import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAdminSettings,
  updateCommissionSettings,
  updateGstSettings,
  updateTcsSettings,
  updatePlatformFeeSettings,
  calculateBookingFinancials,
  generateGstReport,
  generateCommissionReport
} from '../controllers/adminCommissionController';

const router = Router();

// Validation middleware
const commissionValidation = [
  body('commissionRate')
    .optional()
    .isFloat({ min: 0, max: 50 })
    .withMessage('Commission rate must be between 0 and 50'),
  body('commissionType')
    .optional()
    .isIn(['percentage', 'fixed'])
    .withMessage('Commission type must be either percentage or fixed'),
  body('fixedCommissionAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Fixed commission amount must be positive'),
  body('commissionOnCleaningFee')
    .optional()
    .isBoolean()
    .withMessage('Commission on cleaning fee must be a boolean'),
  body('commissionOnExtraGuests')
    .optional()
    .isBoolean()
    .withMessage('Commission on extra guests must be a boolean')
];

const gstValidation = [
  body('gstEnabled')
    .optional()
    .isBoolean()
    .withMessage('GST enabled must be a boolean'),
  body('gstRate')
    .optional()
    .isFloat({ min: 0, max: 30 })
    .withMessage('GST rate must be between 0 and 30'),
  body('gstNumber')
    .optional()
    .isString()
    .withMessage('GST number must be a string')
    .matches(/^[0-9]{15}$/)
    .withMessage('GST number must be 15 digits'),
  body('gstOnCommission')
    .optional()
    .isBoolean()
    .withMessage('GST on commission must be a boolean'),
  body('gstInclusive')
    .optional()
    .isBoolean()
    .withMessage('GST inclusive must be a boolean')
];

const tcsValidation = [
  body('tcsEnabled')
    .optional()
    .isBoolean()
    .withMessage('TCS enabled must be a boolean'),
  body('tcsRate')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('TCS rate must be between 0 and 10'),
  body('tcsThreshold')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('TCS threshold must be positive')
];

const platformFeeValidation = [
  body('platformFeeEnabled')
    .optional()
    .isBoolean()
    .withMessage('Platform fee enabled must be a boolean'),
  body('platformFeeRate')
    .optional()
    .isFloat({ min: 0, max: 20 })
    .withMessage('Platform fee rate must be between 0 and 20'),
  body('platformFeeType')
    .optional()
    .isIn(['percentage', 'fixed'])
    .withMessage('Platform fee type must be either percentage or fixed'),
  body('fixedPlatformFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Fixed platform fee must be positive')
];

const calculationValidation = [
  body('baseAmount')
    .isFloat({ min: 0 })
    .withMessage('Base amount must be a positive number'),
  body('cleaningFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cleaning fee must be a positive number'),
  body('extraGuestCharge')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Extra guest charge must be a positive number')
];

const reportValidation = [
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
];

// Commission & GST Control endpoints

// GET /api/admin-commission/settings - Get current admin settings
router.get('/settings', getAdminSettings);

// PUT /api/admin-commission/commission - Update commission settings
router.put('/commission', commissionValidation, updateCommissionSettings);

// PUT /api/admin-commission/gst - Update GST settings
router.put('/gst', gstValidation, updateGstSettings);

// PUT /api/admin-commission/tcs - Update TCS settings
router.put('/tcs', tcsValidation, updateTcsSettings);

// PUT /api/admin-commission/platform-fee - Update platform fee settings
router.put('/platform-fee', platformFeeValidation, updatePlatformFeeSettings);

// POST /api/admin-commission/calculate - Calculate booking financials
router.post('/calculate', calculationValidation, calculateBookingFinancials);

// GET /api/admin-commission/reports/gst - Generate GST report
router.get('/reports/gst', reportValidation, generateGstReport);

// GET /api/admin-commission/reports/commission - Generate commission report
router.get('/reports/commission', reportValidation, generateCommissionReport);

export default router;
