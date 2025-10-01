import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads', 'leases');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `lease-${uniqueSuffix}${extension}`);
  }
});

// File filter to only allow PDF files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed for lease documents'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Middleware for single file upload (optional)
export const uploadLeaseDocument = (req, res, next) => {
  upload.single('leaseDocument')(req, res, (err) => {
    if (err) {
      // If it's a "no file" error, just continue without file
      if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.message.includes('Unexpected field')) {
        return next();
      }
      return next(err);
    }
    next();
  });
};

// Error handling middleware
export const handleFileUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum size is 10MB.' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Unexpected file field.' });
    }
    return res.status(400).json({ message: error.message });
  }
  
  if (error.message === 'Only PDF files are allowed for lease documents') {
    return res.status(400).json({ message: 'Only PDF files are allowed for lease documents.' });
  }
  
  next(error);
};
