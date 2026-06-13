const express = require('express');
const db = require('../models/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/users - list all users (admin only or for project member search)
router.get('/', (req, res) => {
  const { search } = req.query;
  let query = 'SELECT id, name, email, role, avatar_color, created_at FROM users';
  const params = [];

  if (search) {
    query += ' WHERE name LIKE ? OR email LIKE ?';
    params.push(`%${search}%`, `%${search}%`);
  }
  query += ' ORDER BY name';

  const users = db.prepare(query).all(...params);
  res.json({ users });
});

// GET /api/users/:id
router.get('/:id', (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, avatar_color, created_at FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// PUT /api/users/:id/role - admin only
router.put('/:id/role', requireAdmin, (req, res) => {
  const { role } = req.body;
  if (!['admin', 'member'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  res.json({ message: 'Role updated' });
});

module.exports = router;
