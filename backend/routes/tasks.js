const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/db');
const { authenticate, requireProjectAccess } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/tasks?project_id=&status=&assignee_id=
router.get('/', (req, res) => {
  const { project_id, status, priority, assignee_id } = req.query;

  let query = `
    SELECT t.*, 
      u.name as assignee_name, u.avatar_color as assignee_color,
      c.name as creator_name,
      p.name as project_name, p.color as project_color
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    LEFT JOIN users c ON t.creator_id = c.id
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE 1=1
  `;
  const params = [];

  if (req.user.role !== 'admin') {
    query += ' AND t.project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)';
    params.push(req.user.id);
  }
  if (project_id) { query += ' AND t.project_id = ?'; params.push(project_id); }
  if (status) { query += ' AND t.status = ?'; params.push(status); }
  if (priority) { query += ' AND t.priority = ?'; params.push(priority); }
  if (assignee_id) { query += ' AND t.assignee_id = ?'; params.push(assignee_id); }

  query += ' ORDER BY t.created_at DESC';

  const tasks = db.prepare(query).all(...params);
  res.json({ tasks });
});

// GET /api/tasks/dashboard - summary stats
router.get('/dashboard', (req, res) => {
  let projectFilter = '';
  const params = [];

  if (req.user.role !== 'admin') {
    projectFilter = 'AND t.project_id IN (SELECT project_id FROM project_members WHERE user_id = ?)';
    params.push(req.user.id);
  }

  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'review' THEN 1 ELSE 0 END) as review,
      SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done,
      SUM(CASE WHEN due_date < date('now') AND status != 'done' THEN 1 ELSE 0 END) as overdue
    FROM tasks t WHERE 1=1 ${projectFilter}
  `).get(...params);

  const myTasks = db.prepare(`
    SELECT t.*, p.name as project_name, p.color as project_color
    FROM tasks t LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.assignee_id = ? AND t.status != 'done'
    ORDER BY t.due_date ASC NULLS LAST LIMIT 10
  `).all(req.user.id);

  const recentTasks = db.prepare(`
    SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_color,
      p.name as project_name, p.color as project_color
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE 1=1 ${projectFilter}
    ORDER BY t.updated_at DESC LIMIT 8
  `).all(...params);

  res.json({ stats, myTasks, recentTasks });
});

// POST /api/tasks
router.post('/', (req, res) => {
  const { title, description, status, priority, project_id, assignee_id, due_date } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Task title is required' });
  if (!project_id) return res.status(400).json({ error: 'project_id is required' });

  // Check project access
  const member = db.prepare('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?').get(project_id, req.user.id);
  if (!member && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'No access to this project' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO tasks (id, title, description, status, priority, project_id, assignee_id, creator_id, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, title.trim(), description || null, status || 'todo', priority || 'medium', project_id, assignee_id || null, req.user.id, due_date || null);

  const task = db.prepare(`
    SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_color, p.name as project_name, p.color as project_color
    FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.id = ?
  `).get(id);

  res.status(201).json({ task });
});

// PUT /api/tasks/:id
router.put('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const member = db.prepare('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?').get(task.project_id, req.user.id);
  if (!member && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'No access to this task' });
  }

  const { title, description, status, priority, assignee_id, due_date } = req.body;
  db.prepare(`
    UPDATE tasks SET 
      title = COALESCE(?, title), description = COALESCE(?, description),
      status = COALESCE(?, status), priority = COALESCE(?, priority),
      assignee_id = ?, due_date = COALESCE(?, due_date),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(title || null, description !== undefined ? description : null, status || null, priority || null, assignee_id !== undefined ? assignee_id : task.assignee_id, due_date || null, req.params.id);

  const updated = db.prepare(`
    SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_color, p.name as project_name, p.color as project_color
    FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.id = ?
  `).get(req.params.id);

  res.json({ task: updated });
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const isProjectAdmin = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(task.project_id, req.user.id);
  if (!isProjectAdmin && req.user.role !== 'admin' && task.creator_id !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to delete this task' });
  }

  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ message: 'Task deleted' });
});

// GET /api/tasks/:id/comments
router.get('/:id/comments', (req, res) => {
  const comments = db.prepare(`
    SELECT c.*, u.name as user_name, u.avatar_color
    FROM comments c JOIN users u ON c.user_id = u.id
    WHERE c.task_id = ? ORDER BY c.created_at ASC
  `).all(req.params.id);
  res.json({ comments });
});

// POST /api/tasks/:id/comments
router.post('/:id/comments', (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Comment content required' });

  const id = uuidv4();
  db.prepare('INSERT INTO comments (id, content, task_id, user_id) VALUES (?, ?, ?, ?)').run(id, content.trim(), req.params.id, req.user.id);

  const comment = db.prepare(`
    SELECT c.*, u.name as user_name, u.avatar_color
    FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?
  `).get(id);

  res.status(201).json({ comment });
});

module.exports = router;
