import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllUsers,
  getUserById,
  updateUserBlockStatus,
  updateUserVerification,
  updateUserFraudFlags,
  getUserStatistics,
  getFraudDetectionReport
} from '../controllers/adminUserManagementController';

const router = Router();

// Validation middleware
const blockUserValidation = [
  body('action')
    .isIn(['block', 'unblock'])
    .withMessage('Action must be either block or unblock'),
  body('reason')
    .if(body('action').equals('block'))
    .notEmpty()
    .withMessage('Reason is required for blocking')
    .isString()
    .withMessage('Reason must be a string')
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters')
];

const verificationValidation = [
  body('status')
    .isIn(['verified', 'rejected'])
    .withMessage('Status must be either verified or rejected'),
  body('reason')
    .if(body('status').equals('rejected'))
    .notEmpty()
    .withMessage('Reason is required for rejection')
    .isString()
    .withMessage('Reason must be a string')
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters')
];

const fraudFlagsValidation = [
  body('suspiciousActivity')
    .optional()
    .isBoolean()
    .withMessage('Suspicious activity must be a boolean'),
  body('multipleAccounts')
    .optional()
    .isBoolean()
    .withMessage('Multiple accounts must be a boolean'),
  body('fakeDocuments')
    .optional()
    .isBoolean()
    .withMessage('Fake documents must be a boolean'),
  body('paymentIssues')
    .optional()
    .isBoolean()
    .withMessage('Payment issues must be a boolean'),
  body('unusualBookingPattern')
    .optional()
    .isBoolean()
    .withMessage('Unusual booking pattern must be a boolean'),
  body('flagReason')
    .optional()
    .isString()
    .withMessage('Flag reason must be a string')
    .isLength({ max: 500 })
    .withMessage('Flag reason must not exceed 500 characters')
];

const reportValidation = [
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('riskThreshold')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Risk threshold must be between 0 and 100')
];

// User Management endpoints

// GET /api/admin-user-management - Get all users with comprehensive filters
router.get('/', getAllUsers);

// GET /api/admin-user-management/statistics - Get user statistics
router.get('/statistics', getUserStatistics);

// GET /api/admin-user-management/fraud-report - Get fraud detection report
router.get('/fraud-report', reportValidation, getFraudDetectionReport);

// GET /api/admin-user-management/:userId - Get user by ID with full details
router.get('/:userId', getUserById);

// PUT /api/admin-user-management/:userId/block - Update user block status
router.put('/:userId/block', blockUserValidation, updateUserBlockStatus);

// PUT /api/admin-user-management/:userId/verification - Update user verification status
router.put('/:userId/verification', verificationValidation, updateUserVerification);

// PUT /api/admin-user-management/:userId/fraud-flags - Update user fraud flags
router.put('/:userId/fraud-flags', fraudFlagsValidation, updateUserFraudFlags);

export default router;
