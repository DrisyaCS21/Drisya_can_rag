
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function register(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        error: 'Please enter a valid email address.',
      });
    }

    if (password.length < 10 || password.length > 72) {
      return res.status(400).json({
        error: 'Password must contain between 10 and 72 characters.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    const { rows } = await pool.query(
      `INSERT INTO app_users (id, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, email, created_at`,
      [userId, normalizedEmail, passwordHash]
    );

    await regenerateSession(req);

    req.session.userId = userId;

    await saveSession(req);

    res.status(201).json({
      message: 'Account created successfully.',
      user: rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'An account with this email already exists.',
      });
    }

    console.error('Registration error:', error);

    res.status(500).json({
      error: 'Unable to create your account.',
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { rows } = await pool.query(
      `SELECT id, email, password_hash
       FROM app_users
       WHERE email = $1`,
      [normalizedEmail]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid email or password.',
      });
    }

    const user = rows[0];

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        error: 'Invalid email or password.',
      });
    }

    await regenerateSession(req);

    req.session.userId = user.id;

    await saveSession(req);

    res.json({
      message: 'Login successful.',
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);

    res.status(500).json({
      error: 'Unable to log in.',
    });
  }
}

async function logout(req, res) {
  req.session.destroy((error) => {
    if (error) {
      console.error('Logout error:', error);

      return res.status(500).json({
        error: 'Unable to log out.',
      });
    }

    res.clearCookie('documind.sid');

    res.json({
      message: 'Logged out successfully.',
    });
  });
}

async function getCurrentUser(req, res) {
  res.json({
    user: req.user,
  });
}

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
};
