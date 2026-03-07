const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { register, login, logout, getMe } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { registerRules, loginRules, validate } = require('../middleware/validation');

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const meLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const logoutLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/register
router.post('/register', authLimiter, registerRules, validate, register);

// POST /api/auth/login
router.post('/login', authLimiter, loginRules, validate, login);

// POST /api/auth/logout
router.post('/logout', logoutLimiter, authenticateToken, logout);

// GET /api/auth/me
router.get('/me', meLimiter, authenticateToken, getMe);

module.exports = router;
