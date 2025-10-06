import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists for tenant documents
const uploadsDir = path.join(process.cwd(), 'uploads', 'tenant-documents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for tenant document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `tenant-doc-${uniqueSuffix}${extension}`);
  }
});

// File filter to allow images and PDFs
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) and PDF files are allowed'), false);
  }
};

// Configure multer for tenant documents
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Middleware for multiple file uploads
export const uploadTenantDocuments = (req, res, next) => {
  upload.fields([
    { name: 'idImage', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
    { name: 'nbiClearance', maxCount: 1 },
    { name: 'biodata', maxCount: 1 },
    { name: 'proofOfIncome', maxCount: 1 }
  ])(req, res, (err) => {
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
export const handleTenantDocumentUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum size is 10MB.' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Unexpected file field.' });
    }
    return res.status(400).json({ message: error.message });
  }
  
  if (error.message.includes('Only image files')) {
    return res.status(400).json({ message: 'Only image files (JPEG, PNG, GIF, WebP) and PDF files are allowed.' });
  }
  
  next(error);
};
