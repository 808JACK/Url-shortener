const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { validateUrl, generateCode, validateCode } = require('../utils/helpers');

// Create a new link
router.post('/', async (req, res) => {
  try {
    const { target_url, code } = req.body;

    if (!target_url || !validateUrl(target_url)) {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    const shortCode = code || generateCode();

    if (!validateCode(shortCode)) {
      return res.status(400).json({ error: 'Code must be 6-8 alphanumeric characters' });
    }

    const result = await pool.query(
      'INSERT INTO links (code, target_url) VALUES ($1, $2) RETURNING *',
      [shortCode, target_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Code already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all links
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM links ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get stats for a specific link
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const result = await pool.query(
      'SELECT * FROM links WHERE code = $1',
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a link
router.delete('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const result = await pool.query(
      'DELETE FROM links WHERE code = $1 RETURNING *',
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }

    res.json({ message: 'Link deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
