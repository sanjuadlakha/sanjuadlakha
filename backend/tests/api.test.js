const request = require('supertest');

// Mock the database before app is loaded
jest.mock('../src/config/database', () => {
  const bcrypt = require('bcryptjs');

  // In-memory store
  const users = [
    {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      password: bcrypt.hashSync('Admin@123', 10),
      role: 'admin',
      first_name: 'System',
      last_name: 'Admin',
      is_active: 1,
      is_deleted: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
  let nextId = 2;

  return {
    initDatabase: jest.fn().mockResolvedValue({}),
    persistDatabase: jest.fn(),
    getDb: jest.fn(() => ({
      prepare: jest.fn((sql) => {
        // Simulate basic SQL.js prepare/getAsObject
        return {
          getAsObject: jest.fn((params) => {
            const s = sql.trim().toUpperCase();

            // SELECT * FROM users WHERE id = ?
            if (s.includes('WHERE ID = ?') && !s.includes('OR')) {
              const found = users.find(
                (u) => u.id === parseInt(params[0]) && u.is_deleted === 0
              );
              return found || {};
            }

            // SELECT * FROM users WHERE email = ?
            if (
              s.includes('WHERE EMAIL = ?') ||
              (s.includes('EMAIL = ?') && !s.includes('USERNAME'))
            ) {
              const found = users.find(
                (u) => u.email === params[0] && u.is_deleted === 0
              );
              return found || {};
            }

            // Check duplicates: username OR email
            if (s.includes('USERNAME = ?') && s.includes('OR') && s.includes('EMAIL = ?')) {
              const found = users.find(
                (u) =>
                  (u.username === params[0] || u.email === params[1]) &&
                  u.is_deleted === 0
              );
              return found || {};
            }

            // COUNT admins
            if (s.includes('COUNT(*)') && s.includes('ROLE = ?')) {
              const count = users.filter((u) => u.role === params[0] && u.is_deleted === 0).length;
              return { count };
            }

            // COUNT active users
            if (s.includes('COUNT(*)') && s.includes('IS_ACTIVE = 1')) {
              const count = users.filter((u) => u.is_deleted === 0 && u.is_active === 1).length;
              return { count };
            }

            // COUNT all non-deleted
            if (s.includes('COUNT(*)')) {
              return { total: users.filter((u) => u.is_deleted === 0).length };
            }

            return {};
          }),
          bind: jest.fn(),
          step: jest.fn(() => false),
          free: jest.fn(),
        };
      }),
      run: jest.fn((sql, params) => {
        const s = sql.trim().toUpperCase();
        if (s.startsWith('INSERT INTO USERS')) {
          users.push({
            id: nextId++,
            username: params[0],
            email: params[1],
            password: params[2],
            role: params[3] || 'user',
            first_name: params[4] || '',
            last_name: params[5] || '',
            is_active: 1,
            is_deleted: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
        if (s.startsWith('UPDATE USERS SET IS_DELETED')) {
          const id = parseInt(params[1]);
          const u = users.find((u) => u.id === id);
          if (u) u.is_deleted = 1;
        }
      }),
    })),
  };
});

process.env.JWT_SECRET = 'test-secret';
process.env.BCRYPT_ROUNDS = '1';
process.env.PORT = '0';

const app = require('../src/app');

// Initialize DB before tests
beforeAll(async () => {
  const { initDatabase } = require('../src/config/database');
  await initDatabase();
});

describe('Health Check', () => {
  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Auth - Register', () => {
  test('registers a new user successfully', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'password123',
      first_name: 'Test',
      last_name: 'User',
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('testuser@example.com');
    expect(res.body.user).not.toHaveProperty('password');
  });

  test('rejects registration with invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'testuser2',
      email: 'not-an-email',
      password: 'password123',
    });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  test('rejects registration with short password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'testuser3',
      email: 'testuser3@example.com',
      password: '123',
    });
    expect(res.status).toBe(400);
  });

  test('rejects registration with short username', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'ab',
      email: 'testuser4@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(400);
  });
});

describe('Auth - Login', () => {
  test('logs in with valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'Admin@123',
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.role).toBe('admin');
  });

  test('rejects login with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });

  test('rejects login with non-existent email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(401);
  });

  test('rejects login with missing fields', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
    });
    expect(res.status).toBe(400);
  });
});

describe('Auth - Protected Routes', () => {
  let adminToken;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'Admin@123' });
    adminToken = res.body.token;
  });

  test('GET /api/auth/me returns current user', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
  });

  test('GET /api/auth/me returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('POST /api/auth/logout returns success', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Logged out');
  });
});

describe('Users - Admin CRUD', () => {
  let adminToken;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'Admin@123' });
    adminToken = res.body.token;
  });

  test('GET /api/users returns user list (admin)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('users');
    expect(res.body).toHaveProperty('pagination');
  });

  test('GET /api/users returns 403 for regular user token', async () => {
    // Create a fake user token
    const jwt = require('jsonwebtoken');
    const userToken = jwt.sign(
      { id: 99, username: 'regular', email: 'user@test.com', role: 'user' },
      'test-secret',
      { expiresIn: '1h' }
    );
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  test('GET /api/users/:id returns user (admin)', async () => {
    const res = await request(app)
      .get('/api/users/1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(1);
  });

  test('GET /api/users/:id returns 404 for nonexistent user', async () => {
    const res = await request(app)
      .get('/api/users/9999')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });
});

describe('Users - Stats', () => {
  let adminToken;
  let userToken;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'Admin@123' });
    adminToken = res.body.token;

    const jwt = require('jsonwebtoken');
    userToken = jwt.sign(
      { id: 99, username: 'regular', email: 'user@test.com', role: 'user' },
      'test-secret',
      { expiresIn: '1h' }
    );
  });

  test('GET /api/users/stats returns stats for admin', async () => {
    const res = await request(app)
      .get('/api/users/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('stats');
    expect(res.body.stats).toHaveProperty('total');
    expect(res.body.stats).toHaveProperty('active');
    expect(res.body.stats).toHaveProperty('inactive');
    expect(res.body.stats).toHaveProperty('admins');
    expect(res.body.stats).toHaveProperty('users');
    expect(res.body.stats.total).toBeGreaterThanOrEqual(1);
    expect(res.body.stats.admins).toBeGreaterThanOrEqual(1);
    expect(res.body.stats.total).toBe(res.body.stats.active + res.body.stats.inactive);
    expect(res.body.stats.total).toBe(res.body.stats.admins + res.body.stats.users);
  });

  test('GET /api/users/stats returns 403 for regular user', async () => {
    const res = await request(app)
      .get('/api/users/stats')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  test('GET /api/users/stats returns 401 without token', async () => {
    const res = await request(app).get('/api/users/stats');
    expect(res.status).toBe(401);
  });
});

describe('404 handler', () => {
  test('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/unknown-route');
    expect(res.status).toBe(404);
  });
});
