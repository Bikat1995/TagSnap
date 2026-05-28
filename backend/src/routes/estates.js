const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Get all estates for a user
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const result = await pool.query(
      'SELECT * FROM estates WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching estates:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch estates' });
  }
});

// Get a single estate with its items
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get estate details
    const estateResult = await pool.query(
      'SELECT * FROM estates WHERE id = $1',
      [id]
    );

    if (estateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Estate not found' });
    }

    if (estateResult.rows[0].user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get items for this estate
    const itemsResult = await pool.query(
      'SELECT * FROM items WHERE estate_id = $1 ORDER BY created_at DESC',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...estateResult.rows[0],
        items: itemsResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching estate:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch estate' });
  }
});

// Create a new estate
router.post('/', authenticateToken, [
  body('name').isString().trim().notEmpty(),
  body('address').optional().isString().trim(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, address } = req.body;
  const user_id = req.user.userId;

  try {
    const result = await pool.query(
      `INSERT INTO estates (user_id, name, address)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [user_id, name, address || null]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating estate:', error);
    res.status(500).json({ success: false, error: 'Failed to create estate' });
  }
});

// Update an estate
router.put('/:id', authenticateToken, [
  body('name').optional().isString().trim().notEmpty(),
  body('address').optional().isString().trim(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const updates = req.body;

  // Check ownership
  try {
    const estateCheck = await pool.query(
      'SELECT user_id FROM estates WHERE id = $1',
      [id]
    );

    if (estateCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Estate not found' });
    }

    if (estateCheck.rows[0].user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
  } catch (error) {
    console.error('Error checking estate ownership:', error);
    return res.status(500).json({ success: false, error: 'Failed to update estate' });
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
      UPDATE estates
      SET ${updateFields.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, values);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating estate:', error);
    res.status(500).json({ success: false, error: 'Failed to update estate' });
  }
});

// Delete an estate (and its items via CASCADE)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const estateCheck = await pool.query(
      'SELECT user_id FROM estates WHERE id = $1',
      [id]
    );

    if (estateCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Estate not found' });
    }

    if (estateCheck.rows[0].user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      'DELETE FROM estates WHERE id = $1 RETURNING *',
      [id]
    );

    res.json({
      success: true,
      message: 'Estate and all associated items deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting estate:', error);
    res.status(500).json({ success: false, error: 'Failed to delete estate' });
  }
});

module.exports = router;
