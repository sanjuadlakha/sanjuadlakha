const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  changePassword,
  deleteUser,
  restoreUser,
} = require('../controllers/userController');
const { authenticateToken, requireAdmin, requireOwnerOrAdmin } = require('../middleware/auth');
const {
  createUserRules,
  updateProfileRules,
  changePasswordRules,
  validate,
} = require('../middleware/validation');

// Rate limiter for read endpoints
const readLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// All routes require authentication and rate limiting
router.use(readLimiter, authenticateToken);

// GET /api/users — Admin only
router.get('/', requireAdmin, getUsers);

// GET /api/users/:id — Admin or owner
router.get('/:id', requireOwnerOrAdmin, getUserById);

// POST /api/users — Admin only
router.post('/', requireAdmin, createUserRules, validate, createUser);

// PUT /api/users/:id — Admin or owner
router.put('/:id', requireOwnerOrAdmin, updateProfileRules, validate, updateUser);

// PUT /api/users/:id/password — Admin or owner
router.put('/:id/password', requireOwnerOrAdmin, changePasswordRules, validate, changePassword);

// DELETE /api/users/:id — Admin only
router.delete('/:id', requireAdmin, deleteUser);

// PUT /api/users/:id/restore — Admin only
router.put('/:id/restore', requireAdmin, restoreUser);

module.exports = router;
