import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllPayouts,
  getPayoutById,
  generatePayouts,
  processPayout,
  getPayoutStatistics,
  exportPayoutReport,
  getHostPayoutSummary
} from '../controllers/adminPayoutController';

const router = Router();

// Validation middleware
const generatePayoutsValidation = [
  body('hostId')
    .notEmpty()
    .withMessage('Host ID is required')
    .isMongoId()
    .withMessage('Invalid Host ID'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    })
];

const processPayoutValidation = [
  body('action')
    .isIn(['process', 'fail', 'cancel'])
    .withMessage('Action must be either process, fail, or cancel'),
  body('transactionId')
    .if(body('action').equals('process'))
    .notEmpty()
    .withMessage('Transaction ID is required for processing')
    .isString()
    .withMessage('Transaction ID must be a string'),
  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
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
  body('hostId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Host ID'),
  body('status')
    .optional()
    .isIn(['pending', 'processing', 'completed', 'failed', 'cancelled'])
    .withMessage('Invalid status')
];

// Payout Management endpoints

// GET /api/admin-payout-management - Get all payouts with comprehensive filters
router.get('/', getAllPayouts);

// GET /api/admin-payout-management/statistics - Get payout statistics
router.get('/statistics', getPayoutStatistics);

// GET /api/admin-payout-management/export - Export payout report
router.get('/export', reportValidation, exportPayoutReport);

// GET /api/admin-payout-management/:payoutId - Get payout by ID with full details
router.get('/:payoutId', getPayoutById);

// POST /api/admin-payout-management/generate - Generate payouts for completed bookings
router.post('/generate', generatePayoutsValidation, generatePayouts);

// PUT /api/admin-payout-management/:payoutId/process - Process payout (release payment)
router.put('/:payoutId/process', processPayoutValidation, processPayout);

// GET /api/admin-payout-management/host/:hostId/summary - Get host payout summary
router.get('/host/:hostId/summary', getHostPayoutSummary);

export default router;
