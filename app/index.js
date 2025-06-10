/*!
 * Shopify 3D Printing App - Main Server
 * @author aduy0 <aduy050302@gmail.com>
 * @created 2025-06-10
 * @modified 2025-06-10
 * @description Main Express server with file upload capabilities
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
require('dotenv').config();

// Import routes
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 3000;

// aduy0 - Security and middleware setup
app.use(helmet({
  contentSecurityPolicy: false // Disable for development
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// aduy0 - Serve static files
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// aduy0 - API Routes
app.use('/api', uploadRoutes);

// aduy0 - Main customer interface route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// aduy0 - API info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Shopify 3D Printing App',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: [
      'GET / - Customer upload interface',
      'GET /api/info - API information',
      'POST /api/upload - Upload 3D file',
      'GET /api/file/:fileId - Get file information'
    ],
    supportedFormats: ['.stl', '.obj', '.3mf', '.ply'],
    maxFileSize: '100MB'
  });
});

// aduy0 - Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// aduy0 - Error handling middleware
app.use((error, req, res, next) => {
  console.error('[Server Error]:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 100MB.'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// aduy0 - 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// aduy0 - Start server
app.listen(PORT, () => {
  console.log(`🚀 Shopify 3D Printing App running on port ${PORT}`);
  console.log(`📝 Customer interface: http://localhost:${PORT}`);
  console.log(`🔧 API endpoints: http://localhost:${PORT}/api/info`);
  console.log(`💾 File uploads: /api/upload`);
  
  // Create uploads directory if it doesn't exist
  const fs = require('fs');
  if (!fs.existsSync('uploads/temp')) {
    fs.mkdirSync('uploads/temp', { recursive: true });
    console.log('📁 Created uploads directory');
  }
});