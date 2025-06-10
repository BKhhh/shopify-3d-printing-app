/*!
 * File Upload Route - 3D Printing Files
 * @author @aduy0 <aduy050302.com>
 * @created 2025-06-10
 * @description Handles 3D file uploads for custom printing orders
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// [@aduy0] - File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/temp';
    // Make sure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-originalname
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

// [@aduy0] - File filter for file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.stl', '.obj', '.3mf', '.ply'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

// [@aduy0] - Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, //100MB limit
    files: 1
  }
});

// [@aduy0] - File upload endpoint
router.post('/upload', upload.single('3dFile'), [
  // middleware validation
  body('customerEmail').optional().isEmail().withMessage('Valid email required if provided'),
  body('fileName').notEmpty().withMessage('File name required'),
], (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded or invalid file type'
      });
    }

    // [Your Name] - File analysis (basic)
    const fileInfo = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path,
      uploadTime: new Date().toISOString(),
      customerEmail: req.body.customerEmail || 'anonymous@customer.com' // Default email
    };

    // [@aduy0] - Basic file size analysis for pricing
    const fileSizeMB = (req.file.size / (1024 * 1024)).toFixed(2);
    
    res.json({
      success: true,
      message: 'File uploaded successfully',
      fileInfo: {
        id: fileInfo.filename.split('-')[0], //ID = timestamp
        originalName: fileInfo.originalName,
        size: `${fileSizeMB} MB`,
        type: path.extname(fileInfo.originalName),
        uploadTime: fileInfo.uploadTime
      },
      printingOptions: {
        //Default options that customer can modify
        material: 'PLA',
        quality: 'Standard',
        infill: 20,
        walls: 3,
        supports: 'Auto'
      },
      estimatedPrice: {
        base: (fileSizeMB * 0.50).toFixed(2), //Basic estimation: $0.50 per MB
        currency: 'USD'
      }
    });

  } catch (error) {
    console.error('[Upload Error]:', error);
    res.status(500).json({
      success: false,
      message: 'File upload failed',
      error: error.message
    });
  }
});

// [@aduy0] - Get file info endpoint
router.get('/file/:fileId', (req, res) => {
  try {
    const fileId = req.params.fileId;
    const uploadPath = 'uploads/temp';
    
    //find file by ID (timestamp)
    const files = fs.readdirSync(uploadPath);
    const targetFile = files.find(file => file.startsWith(fileId));
    
    if (!targetFile) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const filePath = path.join(uploadPath, targetFile);
    const stats = fs.statSync(filePath);
    
    res.json({
      success: true,
      fileInfo: {
        id: fileId,
        name: targetFile,
        size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
        uploadDate: stats.birthtime
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve file info',
      error: error.message
    });
  }
});

module.exports = router;