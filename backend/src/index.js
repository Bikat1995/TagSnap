require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { Pool } = require('pg');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Import routes
const itemRoutes = require('./routes/items');
const estateRoutes = require('./routes/estates');
const authRoutes = require('./routes/auth');
const analyticsRoutes = require('./routes/analytics');

// Initialize Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configure multer for image uploads
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test database connection
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Connected to PostgreSQL database');
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// API Routes
app.use('/api/items', itemRoutes);
app.use('/api/estates', estateRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);

// AI scan endpoint using Google Gemini Vision (free tier)
app.post('/api/scan', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are an expert estate sale appraiser. Analyze this image and respond ONLY with a valid JSON object — no markdown, no code fences, no explanation — in exactly this format:
{
  "title": "Brief descriptive title for the item",
  "description": "Detailed description including condition, materials, age, and notable features",
  "estimated_min_price": 50,
  "estimated_max_price": 150
}
Focus on items commonly found in estate sales. Provide realistic USD price ranges based on current resale market values. Be specific about condition and any visible damage.`;

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text().trim();

    // Strip any accidental markdown code fences
    const cleaned = responseText.replace(/```json|```/g, '').trim();

    let parsedData;
    try {
      parsedData = JSON.parse(cleaned);
    } catch (parseError) {
      // Fallback regex extraction if JSON parse fails
      const titleMatch = cleaned.match(/"title"\s*:\s*"([^"]+)"/);
      const descMatch = cleaned.match(/"description"\s*:\s*"([^"]+)"/);
      const minMatch = cleaned.match(/"estimated_min_price"\s*:\s*([0-9.]+)/);
      const maxMatch = cleaned.match(/"estimated_max_price"\s*:\s*([0-9.]+)/);
      parsedData = {
        title: titleMatch ? titleMatch[1].trim() : 'Estate Sale Item',
        description: descMatch ? descMatch[1].trim() : 'Item identified from estate sale.',
        estimated_min_price: minMatch ? parseFloat(minMatch[1]) : 10.00,
        estimated_max_price: maxMatch ? parseFloat(maxMatch[1]) : 50.00,
      };
    }

    res.json({
      success: true,
      data: {
        ai_title: parsedData.title,
        ai_description: parsedData.description,
        estimated_min_price: parsedData.estimated_min_price,
        estimated_max_price: parsedData.estimated_max_price,
      }
    });

  } catch (error) {
    console.error('Gemini scan error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze image. Please ensure GEMINI_API_KEY is set correctly.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});


// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
