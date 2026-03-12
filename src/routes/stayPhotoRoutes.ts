import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  uploadStayPhotos,
  getStayPhotos,
  getPhotosByCategory,
  updatePhoto,
  deletePhoto,
  setPrimaryPhoto,
  reorderPhotos,
} from '../controllers/stayPhotoController';

const router = express.Router();

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/stay-photos/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'stay-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Routes
router.post('/upload', upload.array('photos', 20), uploadStayPhotos);
router.get('/stay/:stayId', getStayPhotos);
router.get('/stay/:stayId/category/:category', getPhotosByCategory);
router.put('/:photoId', updatePhoto);
router.delete('/:photoId', deletePhoto);
router.put('/:photoId/primary/:stayId', setPrimaryPhoto);
router.put('/stay/:stayId/reorder', reorderPhotos);

export default router;
