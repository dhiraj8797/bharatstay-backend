import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllProperties,
  getPropertyById,
  updatePropertyStatus,
  updatePropertyFeatured,
  getPropertiesWithComplianceIssues,
  getPropertyAvailability
} from '../controllers/adminPropertyManagementController';

const router = Router();

// Validation middleware
const propertyStatusValidation = [
  body('action')
    .isIn(['approve', 'reject', 'disable'])
    .withMessage('Action must be either approve, reject, or disable'),
  body('reason')
    .if(body('action').equals('reject'))
    .notEmpty()
    .withMessage('Reason is required for rejection')
    .isString()
    .withMessage('Reason must be a string')
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters'),
  body('reason')
    .if(body('action').equals('disable'))
    .notEmpty()
    .withMessage('Reason is required for disabling')
    .isString()
    .withMessage('Reason must be a string')
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters')
];

const featuredValidation = [
  body('isFeatured')
    .isBoolean()
    .withMessage('isFeatured must be a boolean'),
  body('featuredReason')
    .optional()
    .isString()
    .withMessage('Featured reason must be a string')
    .isLength({ max: 200 })
    .withMessage('Featured reason must not exceed 200 characters')
];

const availabilityValidation = [
  body('month')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),
  body('year')
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Year must be between 2020 and 2030')
];

// Property Management endpoints

// GET /api/admin-property-management - Get all properties with filters
router.get('/', getAllProperties);

// GET /api/admin-property-management/compliance-issues - Get properties with compliance issues
router.get('/compliance-issues', getPropertiesWithComplianceIssues);

// GET /api/admin-property-management/:propertyId - Get property by ID with details
router.get('/:propertyId', getPropertyById);

// GET /api/admin-property-management/:propertyId/availability - Get property availability calendar
router.get('/:propertyId/availability', availabilityValidation, getPropertyAvailability);

// PUT /api/admin-property-management/:propertyId/status - Update property status (approve/reject/disable)
router.put('/:propertyId/status', propertyStatusValidation, updatePropertyStatus);

// PUT /api/admin-property-management/:propertyId/featured - Update property featured status
router.put('/:propertyId/featured', featuredValidation, updatePropertyFeatured);

export default router;
