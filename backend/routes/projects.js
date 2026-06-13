const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/db');
const { authenticate, requireProjectAccess } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/projects - list projects accessible to user
router.get('/', (req, res) => {
  let projects;
  if (req.user.role === 'admin') {
    projects = db.prepare(`
      SELECT p.*, u.name as owner_name,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
      FROM projects p JOIN users u ON p.owner_id = u.id
      ORDER BY p.created_at DESC
    `).all();
  } else {
    projects = db.prepare(`
      SELECT p.*, u.name as owner_name, pm.role as my_role,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
      FROM projects p
      JOIN project_members pm ON p.id = pm.project_id
      JOIN users u ON p.owner_id = u.id
      WHERE pm.user_id = ?
      ORDER BY p.created_at DESC
    `).all(req.user.id);
  }
  res.json({ projects });
});

// POST /api/projects
router.post('/', (req, res) => {
  const { name, description, color } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Project name is required' });

  const id = uuidv4();
  db.prepare(
    'INSERT INTO projects (id, name, description, color, owner_id) VALUES (?, ?, ?, ?, ?)'
  ).run(id, name.trim(), description || null, color || '#6366f1', req.user.id);

  // Auto-add creator as admin member
  db.prepare(
    'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)'
  ).run(id, req.user.id, 'admin');

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.status(201).json({ project });
});

// GET /api/projects/:projectId
router.get('/:projectId', requireProjectAccess, (req, res) => {
  const project = db.prepare(`
    SELECT p.*, u.name as owner_name
    FROM projects p JOIN users u ON p.owner_id = u.id
    WHERE p.id = ?
  `).get(req.params.projectId);

  if (!project) return res.status(404).json({ error: 'Project not found' });

  const members = db.prepare(`
    SELECT u.id, u.name, u.email, u.avatar_color, pm.role, pm.joined_at
    FROM project_members pm JOIN users u ON pm.user_id = u.id
    WHERE pm.project_id = ?
  `).all(req.params.projectId);

  res.json({ project, members });
});

// PUT /api/projects/:projectId
router.put('/:projectId', requireProjectAccess, (req, res) => {
  const { name, description, color, status } = req.body;
  if (req.projectRole !== 'admin' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only project admins can edit projects' });
  }

  db.prepare(`
    UPDATE projects SET name = COALESCE(?, name), description = COALESCE(?, description),
    color = COALESCE(?, color), status = COALESCE(?, status)
    WHERE id = ?
  `).run(name || null, description || null, color || null, status || null, req.params.projectId);

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.projectId);
  res.json({ project });
});

// DELETE /api/projects/:projectId
router.delete('/:projectId', requireProjectAccess, (req, res) => {
  if (req.projectRole !== 'admin' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only project admins can delete projects' });
  }
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.projectId);
  res.json({ message: 'Project deleted' });
});

// POST /api/projects/:projectId/members
router.post('/:projectId/members', requireProjectAccess, (req, res) => {
  if (req.projectRole !== 'admin' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only project admins can add members' });
  }
  const { email, role } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const user = db.prepare('SELECT id, name, email, avatar_color FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user) return res.status(404).json({ error: 'User not found' });

  const existing = db.prepare('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.projectId, user.id);
  if (existing) return res.status(409).json({ error: 'User already a member' });

  db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(req.params.projectId, user.id, role || 'member');

  res.status(201).json({ member: { ...user, role: role || 'member' } });
});

// DELETE /api/projects/:projectId/members/:userId
router.delete('/:projectId/members/:userId', requireProjectAccess, (req, res) => {
  if (req.projectRole !== 'admin' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only project admins can remove members' });
  }
  db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?').run(req.params.projectId, req.params.userId);
  res.json({ message: 'Member removed' });
});

module.exports = router;
