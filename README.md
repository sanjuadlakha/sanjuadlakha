# User Management WebApp

A full-stack User Management Web Application built with React, Node.js/Express, and SQL.js.

## 🏗 Architecture

```
sanjuadlakha/
├── backend/          # Node.js + Express REST API
│   ├── src/
│   │   ├── config/   # SQL.js database initialization & schema
│   │   ├── controllers/  # Business logic (auth, users)
│   │   ├── middleware/   # JWT auth, error handler, input validation
│   │   └── routes/       # API route definitions
│   └── tests/        # Jest + Supertest API tests
├── frontend/         # React + Vite + Material UI
│   └── src/
│       ├── context/  # AuthContext (JWT state)
│       ├── pages/    # Login, Register, AdminDashboard, UserProfile
│       ├── services/ # Axios API client
│       └── components/ # ProtectedRoute
└── e2e/              # Playwright end-to-end tests
```

## 🗄 Database Schema (SQL.js)

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,         -- bcrypt hash
  role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
  first_name TEXT,
  last_name TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_deleted INTEGER NOT NULL DEFAULT 0,  -- soft delete
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| POST | `/api/auth/logout` | JWT | Logout |
| GET | `/api/auth/me` | JWT | Get current user |
| GET | `/api/users` | Admin | List users (pagination + search) |
| GET | `/api/users/:id` | Admin/Owner | Get user by ID |
| POST | `/api/users` | Admin | Create user |
| PUT | `/api/users/:id` | Admin/Owner | Update user profile |
| PUT | `/api/users/:id/password` | Admin/Owner | Change password |
| DELETE | `/api/users/:id` | Admin | Soft delete user |
| PUT | `/api/users/:id/restore` | Admin | Restore deleted user |

## 🔐 Authentication Flow

1. User registers or logs in → server verifies credentials → returns JWT
2. Client stores JWT in `localStorage`
3. Axios interceptor attaches `Authorization: Bearer <token>` to all requests
4. Backend middleware verifies JWT on protected routes
5. Role-based middleware enforces admin-only access

## ✨ Features

- **User Registration & Login** with JWT authentication
- **Role-Based Access Control** (admin / user)
- **Admin Dashboard** — full CRUD with pagination & search
- **User Profile** — update name/email
- **Change Password** — with current password verification
- **Soft Delete** — users are marked `is_deleted=1`, not hard deleted
- **Input Validation** — server-side with express-validator
- **Password Hashing** — bcrypt with configurable rounds
- **Error Handling** — global error middleware

## 🚀 Running Locally

### Prerequisites
- Node.js ≥ 18

### 1. Clone the repository
```bash
git clone https://github.com/sanjuadlakha/sanjuadlakha.git
cd sanjuadlakha
```

### 2. Start the Backend
```bash
cd backend
npm install
cp .env.example .env    # edit JWT_SECRET in production!
npm start               # or: npm run dev (with nodemon)
```
Server runs on **http://localhost:5000**

Default admin account is auto-created:
- Email: `admin@example.com`
- Password: `Admin@123`

### 3. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
App runs on **http://localhost:5173**

### 4. Run Backend Unit Tests (Jest + Supertest)
```bash
cd backend
npm test
```

### 5. Run E2E Tests (Playwright)
```bash
# Ensure backend (port 5000) and frontend (port 5173) are running first
cd e2e
npm install
npx playwright install chromium
npx playwright test
```

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Material UI, React Router |
| HTTP Client | Axios |
| Backend | Node.js, Express.js |
| Database | SQL.js (SQLite in memory + persisted to disk) |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Validation | express-validator |
| Unit Tests | Jest + Supertest |
| E2E Tests | Playwright |

## 🔒 Security Notes

- Passwords are hashed with bcrypt (10 rounds default)
- JWT tokens expire in 24h (configurable via `JWT_EXPIRES_IN`)
- Change `JWT_SECRET` in `.env` before deploying to production
- Soft delete preserves audit trail
- Input validation on all mutation endpoints
