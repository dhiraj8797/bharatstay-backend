import express from 'express';
import { body } from 'express-validator';
import {
  createStay,
  getHostStays,
  getStayById,
  updateStay,
  deleteStay,
  updateStayStatus,
} from '../controllers/hostDashboardStayController';

const router = express.Router();

// Validation middleware for creating/updating stays
const stayValidation = [
  body('hostId').notEmpty().withMessage('Host ID is required'),
  body('stayName')
    .notEmpty()
    .withMessage('Stay name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Stay name must be between 3 and 100 characters'),
  body('stayType').notEmpty().withMessage('Stay type is required'),
  body('propertyAge')
    .notEmpty()
    .withMessage('Property age is required')
    .isInt({ min: 0, max: 100 })
    .withMessage('Property age must be between 0 and 100'),
  body('numberOfRooms')
    .notEmpty()
    .withMessage('Number of rooms is required')
    .isInt({ min: 1, max: 100 })
    .withMessage('Number of rooms must be between 1 and 100'),
  body('address').notEmpty().withMessage('Address is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('state').notEmpty().withMessage('State is required'),
  body('pincode')
    .notEmpty()
    .withMessage('Pincode is required')
    .matches(/^[0-9]{6}$/)
    .withMessage('Pincode must be 6 digits'),
];

// Create a new stay
router.post('/', stayValidation, createStay);

// Get all stays for a host
router.get('/host/:hostId', getHostStays);

// Get a single stay by ID
router.get('/:stayId', getStayById);

// Update a stay
router.put('/:stayId', stayValidation, updateStay);

// Delete a stay
router.delete('/:stayId', deleteStay);

// Update stay status
router.patch('/:stayId/status', updateStayStatus);

export default router;
