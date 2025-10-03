import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists for maintenance images
const uploadsDir = path.join(process.cwd(), 'uploads', 'maintenance');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for maintenance image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `maintenance-${uniqueSuffix}${extension}`);
  }
});

// File filter to only allow image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed for maintenance requests'), false);
  }
};

// Configure multer for maintenance images
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Middleware for single image upload
export const uploadMaintenanceImage = (req, res, next) => {
  upload.single('maintenanceImage')(req, res, (err) => {
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
export const handleMaintenanceImageUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Image size too large. Maximum size is 5MB.' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Unexpected file field.' });
    }
    return res.status(400).json({ message: error.message });
  }
  
  if (error.message === 'Only image files are allowed for maintenance requests') {
    return res.status(400).json({ message: 'Only image files are allowed for maintenance requests.' });
  }
  
  next(error);
};
