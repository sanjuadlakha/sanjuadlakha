const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb, persistDatabase } = require('../config/database');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

async function register(req, res, next) {
  try {
    const { username, email, password, first_name, last_name } = req.body;
    const db = getDb();

    // Check duplicate username or email
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
       VALUES (?, ?, ?, 'user', ?, ?)`,
      [username, email, hashedPassword, first_name || '', last_name || '']
    );

    const newUserStmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const newUser = newUserStmt.getAsObject([email]);
    newUserStmt.free();

    persistDatabase();

    const token = generateToken(newUser);
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({ token, user: userWithoutPassword });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const db = getDb();

    const stmt = db.prepare('SELECT * FROM users WHERE email = ? AND is_deleted = 0');
    const user = stmt.getAsObject([email]);
    stmt.free();

    if (!user.id) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    next(err);
  }
}

function logout(req, res) {
  // JWT is stateless; client removes the token
  res.json({ message: 'Logged out successfully' });
}

function getMe(req, res, next) {
  try {
    const db = getDb();
    const stmt = db.prepare(
      'SELECT id, username, email, role, first_name, last_name, is_active, created_at, updated_at FROM users WHERE id = ? AND is_deleted = 0'
    );
    const user = stmt.getAsObject([req.user.id]);
    stmt.free();

    if (!user.id) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, getMe };
