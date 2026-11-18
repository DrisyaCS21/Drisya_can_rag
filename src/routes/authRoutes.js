
const express = require('express');
const rateLimit = require('express-rate-limit');

const {
  register,
  login,
  logout,
  getCurrentUser,
} = require('../controllers/authController');

const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'Too many attempts. Please try again later.',
  },
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, getCurrentUser);

module.exports = router;
