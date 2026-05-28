const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Get all items for a user (across all estates)
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const result = await pool.query(
      'SELECT items.*, estates.name as estate_name FROM items JOIN estates ON items.estate_id = estates.id WHERE estates.user_id = $1 ORDER BY items.created_at DESC LIMIT 10',
      [userId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching user items:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch items' });
  }
});

// Get all items for an estate
router.get('/estate/:estateId', authenticateToken, async (req, res) => {
  try {
    const { estateId } = req.params;

    // Check estate ownership
    const estateCheck = await pool.query(
      'SELECT user_id FROM estates WHERE id = $1',
      [estateId]
    );

    if (estateCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Estate not found' });
    }

    if (estateCheck.rows[0].user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      'SELECT * FROM items WHERE estate_id = $1 ORDER BY created_at DESC',
      [estateId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch items' });
  }
});

// Create a new item
router.post('/', authenticateToken, [
  body('estate_id').isUUID(),
  body('ai_title').isString().trim().notEmpty(),
  body('ai_description').isString().trim(),
  body('estimated_min_price').isDecimal(),
  body('estimated_max_price').isDecimal(),
  body('actual_price').optional().isDecimal(),
  body('status').optional().isIn(['draft', 'printed', 'sold']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    estate_id,
    image_url,
    ai_title,
    ai_description,
    estimated_min_price,
    estimated_max_price,
    actual_price,
    status = 'draft'
  } = req.body;

  try {
    // Check estate ownership
    const estateCheck = await pool.query(
      'SELECT user_id FROM estates WHERE id = $1',
      [estate_id]
    );

    if (estateCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Estate not found' });
    }

    if (estateCheck.rows[0].user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      `INSERT INTO items (
        estate_id, image_url, ai_title, ai_description,
        estimated_min_price, estimated_max_price, actual_price, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        estate_id,
        image_url || null,
        ai_title,
        ai_description,
        estimated_min_price,
        estimated_max_price,
        actual_price || null,
        status
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ success: false, error: 'Failed to create item' });
  }
});

// Update an item
router.put('/:id', authenticateToken, [
  body('ai_title').optional().isString().trim().notEmpty(),
  body('ai_description').optional().isString().trim(),
  body('estimated_min_price').optional().isDecimal(),
  body('estimated_max_price').optional().isDecimal(),
  body('actual_price').optional().isDecimal(),
  body('status').optional().isIn(['draft', 'printed', 'sold']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const updates = req.body;

  try {
    // Check ownership via estate
    const itemCheck = await pool.query(
      'SELECT estates.user_id FROM items JOIN estates ON items.estate_id = estates.id WHERE items.id = $1',
      [id]
    );

    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (itemCheck.rows[0].user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
  } catch (error) {
    console.error('Error checking item ownership:', error);
    return res.status(500).json({ success: false, error: 'Failed to update item' });
  }

  const updateFields = [];
  const values = [id];
  let paramCount = 2; // Start from $2 because $1 is the id

  // Build the SET clause dynamically based on provided fields
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined && key !== 'id') {
      updateFields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  });

  if (updateFields.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  try {
    const query = `
      UPDATE items
      SET ${updateFields.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, values);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ success: false, error: 'Failed to update item' });
  }
});

module.exports = router;
