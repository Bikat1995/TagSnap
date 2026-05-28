const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { authenticateToken } = require('../middleware/auth');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Get item status distribution for user's estates
router.get('/status-distribution', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        status,
        COUNT(*) as count
      FROM items
      WHERE estate_id IN (
        SELECT id FROM estates WHERE user_id = $1
      )
      GROUP BY status
      ORDER BY count DESC
    `, [req.user.userId]);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        status: row.status,
        count: parseInt(row.count)
      }))
    });
  } catch (error) {
    console.error('Error fetching status distribution:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch status distribution' });
  }
});

// Get sales trends over time (last 6 months)
router.get('/sales-trends', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        DATE_TRUNC('month', created_at) as month,
        SUM(actual_price) as total_sales,
        COUNT(*) as items_sold
      FROM items
      WHERE status = 'sold'
        AND actual_price IS NOT NULL
        AND estate_id IN (
          SELECT id FROM estates WHERE user_id = $1
        )
        AND created_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month
    `, [req.user.userId]);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        month: row.month.toISOString().substring(0, 7), // YYYY-MM format
        total_sales: parseFloat(row.total_sales),
        items_sold: parseInt(row.items_sold)
      }))
    });
  } catch (error) {
    console.error('Error fetching sales trends:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sales trends' });
  }
});

// Get estate performance
router.get('/estate-performance', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        e.name as estate_name,
        COALESCE(SUM(i.actual_price), 0) as total_sales,
        COUNT(i.id) as items_sold,
        COUNT(CASE WHEN i.status = 'sold' THEN 1 END) as sold_items
      FROM estates e
      LEFT JOIN items i ON e.id = i.estate_id AND i.status = 'sold' AND i.actual_price IS NOT NULL
      WHERE e.user_id = $1
      GROUP BY e.id, e.name
      ORDER BY total_sales DESC
    `, [req.user.userId]);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        estate_name: row.estate_name,
        total_sales: parseFloat(row.total_sales),
        items_sold: parseInt(row.items_sold)
      }))
    });
  } catch (error) {
    console.error('Error fetching estate performance:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch estate performance' });
  }
});

module.exports = router;