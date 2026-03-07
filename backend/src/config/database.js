const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

let db = null;

const DB_PATH = path.join(__dirname, '../../data/users.db');

async function initDatabase() {
  const SQL = await initSqlJs();

  // Load existing DB from disk if available
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    // Ensure data directory exists
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    db = new SQL.Database();
  }

  createSchema();
  seedAdminUser();
  return db;
}

function createSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
      first_name TEXT,
      last_name TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
}

function seedAdminUser() {
  const bcrypt = require('bcryptjs');
  const stmt = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?');
  const result = stmt.getAsObject(['admin']);
  stmt.free();

  if (result.count === 0) {
    const hashedPassword = bcrypt.hashSync('Admin@123', 10);
    db.run(
      `INSERT INTO users (username, email, password, role, first_name, last_name)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['admin', 'admin@example.com', hashedPassword, 'admin', 'System', 'Admin']
    );
    persistDatabase();
    console.log('Default admin user created: admin@example.com / Admin@123');
  }
}

function persistDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

function getDb() {
  if (!db) throw new Error('Database not initialized');
  return db;
}

module.exports = { initDatabase, getDb, persistDatabase };
