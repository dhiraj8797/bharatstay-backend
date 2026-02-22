import express from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import path from 'path';
import {
  getDashboardStats,
  createStay,
  getHostStays,
  updateStay,
  deleteStay,
  updateStayPricing,
  toggleStayStatus,
  getAllStays,
  getStayById,
  syncHostStaysToPublic,
} from '../controllers/stayController';

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

// Dashboard statistics
router.get('/dashboard/:hostId', getDashboardStats);

// Public routes for stay search and viewing
router.get('/', getAllStays); // Get all stays with filters
router.get('/details/:stayId', getStayById); // Get stay details by ID
router.post('/sync/:hostId', syncHostStaysToPublic); // Sync host stays to public collection

// Stay management
router.post(
  '/create',
  upload.array('photos', 20),
  [
    body('hostId').notEmpty().withMessage('Host ID is required'),
    body('stayName').trim().isLength({ min: 3, max: 100 }).withMessage('Stay name must be 3-100 characters'),
    body('stayType').isIn(['Apartment', 'Villa', 'PG', 'Homestay', 'Hotel']).withMessage('Invalid stay type'),
    body('propertyAge').isInt({ min: 0, max: 100 }).withMessage('Property age must be between 0-100 years'),
    body('address').notEmpty().withMessage('Address is required'),
    body('city').notEmpty().withMessage('City is required'),
    body('state').notEmpty().withMessage('State is required'),
    body('pincode').matches(/^[0-9]{6}$/).withMessage('Invalid pincode'),
  ],
  createStay
);

router.get('/:hostId', getHostStays);
router.put('/:stayId', upload.array('photos', 20), updateStay);
router.delete('/:stayId', deleteStay);
router.put('/:stayId/pricing', updateStayPricing);
router.put('/:stayId/toggle-status', toggleStayStatus);

export default router;
