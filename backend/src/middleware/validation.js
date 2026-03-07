const { body, validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

const registerRules = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('first_name')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name max 50 characters'),
  body('last_name')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name max 50 characters'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const updateProfileRules = [
  body('first_name')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name max 50 characters'),
  body('last_name')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name max 50 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
];

const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
];

const createUserRules = [
  ...registerRules,
  body('role')
    .optional()
    .isIn(['admin', 'user'])
    .withMessage('Role must be admin or user'),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  updateProfileRules,
  changePasswordRules,
  createUserRules,
};
