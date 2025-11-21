const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const result = await pool.query(
      'UPDATE links SET total_clicks = total_clicks + 1, last_clicked = CURRENT_TIMESTAMP WHERE code = $1 RETURNING target_url',
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }

    res.redirect(302, result.rows[0].target_url);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
