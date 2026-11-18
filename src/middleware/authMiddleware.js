
const { pool } = require('../db');

async function requireAuth(req, res, next) {
  try {
    const userId = req.session?.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Please log in to continue.',
      });
    }

    const { rows } = await pool.query(
      `SELECT id, email
       FROM app_users
       WHERE id = $1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        error: 'Your account could not be found.',
      });
    }

    req.user = rows[0];

    next();
  } catch (error) {
    console.error('Authentication error:', error);

    res.status(500).json({
      error: 'Authentication failed.',
    });
  }
}

module.exports = { requireAuth };
