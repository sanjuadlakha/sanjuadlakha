const bcrypt = require('bcryptjs');
const { getDb, persistDatabase } = require('../config/database');

function safeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

// GET /api/users — Admin: list all (with pagination + search)
function getUsers(req, res, next) {
  try {
    const db = getDb();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search}%` : '%';
    const role = req.query.role || null;

    let query = `
      SELECT id, username, email, role, first_name, last_name, is_active, is_deleted, created_at, updated_at
      FROM users
      WHERE is_deleted = 0
        AND (username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)
    `;
    const params = [search, search, search, search];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    // Count total
    const countStmt = db.prepare(
      `SELECT COUNT(*) as total FROM users WHERE is_deleted = 0
       AND (username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)
       ${role ? 'AND role = ?' : ''}`
    );
    const countParams = [search, search, search, search];
    if (role) countParams.push(role);
    const countResult = countStmt.getAsObject(countParams);
    countStmt.free();

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = db.prepare(query);
    const users = [];
    stmt.bind(params);
    while (stmt.step()) {
      users.push(stmt.getAsObject());
    }
    stmt.free();

    res.json({
      users,
      pagination: {
        page,
        limit,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/users/:id
function getUserById(req, res, next) {
  try {
    const db = getDb();
    const stmt = db.prepare(
      'SELECT id, username, email, role, first_name, last_name, is_active, created_at, updated_at FROM users WHERE id = ? AND is_deleted = 0'
    );
    const user = stmt.getAsObject([req.params.id]);
    stmt.free();

    if (!user.id) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
}

// POST /api/users — Admin: create user
async function createUser(req, res, next) {
  try {
    const { username, email, password, role, first_name, last_name } = req.body;
    const db = getDb();

    const checkStmt = db.prepare(
      'SELECT id FROM users WHERE (username = ? OR email = ?) AND is_deleted = 0'
    );
    const existing = checkStmt.getAsObject([username, email]);
    checkStmt.free();

    if (existing.id) {
      return res.status(409).json({ message: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);

    db.run(
      `INSERT INTO users (username, email, password, role, first_name, last_name)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, role || 'user', first_name || '', last_name || '']
    );

    const newUserStmt = db.prepare(
      'SELECT id, username, email, role, first_name, last_name, is_active, created_at, updated_at FROM users WHERE email = ?'
    );
    const newUser = newUserStmt.getAsObject([email]);
    newUserStmt.free();

    persistDatabase();

    res.status(201).json({ user: newUser });
  } catch (err) {
    next(err);
  }
}

// PUT /api/users/:id — Admin or owner: update profile
function updateUser(req, res, next) {
  try {
    const { first_name, last_name, email, role, is_active } = req.body;
    const db = getDb();
    const targetId = parseInt(req.params.id, 10);

    const existingStmt = db.prepare('SELECT * FROM users WHERE id = ? AND is_deleted = 0');
    const existing = existingStmt.getAsObject([targetId]);
    existingStmt.free();

    if (!existing.id) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Non-admins can only update their own profile fields
    const isAdmin = req.user.role === 'admin';
    const updates = {};

    if (first_name !== undefined) updates.first_name = first_name;
    if (last_name !== undefined) updates.last_name = last_name;
    if (email !== undefined) {
      // Check email uniqueness
      const emailCheck = db.prepare(
        'SELECT id FROM users WHERE email = ? AND id != ? AND is_deleted = 0'
      );
      const emailConflict = emailCheck.getAsObject([email, targetId]);
      emailCheck.free();
      if (emailConflict.id) {
        return res.status(409).json({ message: 'Email already in use' });
      }
      updates.email = email;
    }

    // Admin-only fields
    if (isAdmin) {
      if (role !== undefined) updates.role = role;
      if (is_active !== undefined) updates.is_active = is_active ? 1 : 0;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const setClauses = Object.keys(updates)
      .map((k) => `${k} = ?`)
      .join(', ');
    const values = [...Object.values(updates), new Date().toISOString(), targetId];

    db.run(
      `UPDATE users SET ${setClauses}, updated_at = ? WHERE id = ?`,
      values
    );

    persistDatabase();

    const updatedStmt = db.prepare(
      'SELECT id, username, email, role, first_name, last_name, is_active, created_at, updated_at FROM users WHERE id = ?'
    );
    const updatedUser = updatedStmt.getAsObject([targetId]);
    updatedStmt.free();

    res.json({ user: updatedUser });
  } catch (err) {
    next(err);
  }
}

// PUT /api/users/:id/password — Change password (owner or admin)
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const db = getDb();
    const targetId = parseInt(req.params.id, 10);

    const stmt = db.prepare('SELECT * FROM users WHERE id = ? AND is_deleted = 0');
    const user = stmt.getAsObject([targetId]);
    stmt.free();

    if (!user.id) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Admin can change anyone's password without current password check
    if (req.user.role !== 'admin') {
      const passwordMatch = await bcrypt.compare(currentPassword, user.password);
      if (!passwordMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      parseInt(process.env.BCRYPT_ROUNDS) || 10
    );

    db.run(
      'UPDATE users SET password = ?, updated_at = ? WHERE id = ?',
      [hashedPassword, new Date().toISOString(), targetId]
    );

    persistDatabase();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/users/:id — Admin: soft delete
function deleteUser(req, res, next) {
  try {
    const db = getDb();
    const targetId = parseInt(req.params.id, 10);

    const stmt = db.prepare('SELECT id FROM users WHERE id = ? AND is_deleted = 0');
    const user = stmt.getAsObject([targetId]);
    stmt.free();

    if (!user.id) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting yourself
    if (req.user.id === targetId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    db.run(
      'UPDATE users SET is_deleted = 1, updated_at = ? WHERE id = ?',
      [new Date().toISOString(), targetId]
    );

    persistDatabase();

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
}

// PUT /api/users/:id/restore — Admin: restore soft-deleted user
function restoreUser(req, res, next) {
  try {
    const db = getDb();
    const targetId = parseInt(req.params.id, 10);

    db.run(
      'UPDATE users SET is_deleted = 0, updated_at = ? WHERE id = ?',
      [new Date().toISOString(), targetId]
    );

    persistDatabase();

    res.json({ message: 'User restored successfully' });
  } catch (err) {
    next(err);
  }
}

// GET /api/users/stats — Admin: summary counts
function getUserStats(req, res, next) {
  try {
    const db = getDb();

    const totalStmt = db.prepare(
      'SELECT COUNT(*) as total FROM users WHERE is_deleted = 0'
    );
    const totalResult = totalStmt.getAsObject([]);
    totalStmt.free();

    const adminStmt = db.prepare(
      'SELECT COUNT(*) as count FROM users WHERE is_deleted = 0 AND role = ?'
    );
    const adminResult = adminStmt.getAsObject(['admin']);
    adminStmt.free();

    const activeStmt = db.prepare(
      'SELECT COUNT(*) as count FROM users WHERE is_deleted = 0 AND is_active = 1'
    );
    const activeResult = activeStmt.getAsObject([]);
    activeStmt.free();

    const total = totalResult.total || 0;
    const admins = adminResult.count || 0;
    const active = activeResult.count || 0;

    res.json({
      stats: {
        total,
        active,
        inactive: total - active,
        admins,
        users: total - admins,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  changePassword,
  deleteUser,
  restoreUser,
  getUserStats,
};
