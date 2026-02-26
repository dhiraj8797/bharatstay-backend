import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllBookings,
  getBookingById,
  adminCancelBooking,
  processRefund,
  resolveDispute,
  getBookingStatistics,
  getPaymentLogs
} from '../controllers/adminBookingManagementController';

const router = Router();

// Validation middleware
const cancelBookingValidation = [
  body('reason')
    .notEmpty()
    .withMessage('Cancellation reason is required')
    .isString()
    .withMessage('Reason must be a string')
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters'),
  body('refundAmount')
    .optional()
    .isNumeric()
    .withMessage('Refund amount must be a number')
    .isFloat({ min: 0 })
    .withMessage('Refund amount must be positive')
];

const refundValidation = [
  body('action')
    .isIn(['approve', 'reject'])
    .withMessage('Action must be either approve or reject'),
  body('amount')
    .if(body('action').equals('approve'))
    .isNumeric()
    .withMessage('Refund amount must be a number')
    .isFloat({ min: 0 })
    .withMessage('Refund amount must be positive'),
  body('reason')
    .optional()
    .isString()
    .withMessage('Reason must be a string')
    .isLength({ max: 500 })
    .withMessage('Reason must not exceed 500 characters')
];

const disputeValidation = [
  body('action')
    .isIn(['resolve', 'reject'])
    .withMessage('Action must be either resolve or reject'),
  body('resolution')
    .notEmpty()
    .withMessage('Resolution details are required')
    .isString()
    .withMessage('Resolution must be a string')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Resolution must be between 10 and 1000 characters'),
  body('refundAmount')
    .optional()
    .isNumeric()
    .withMessage('Refund amount must be a number')
    .isFloat({ min: 0 })
    .withMessage('Refund amount must be positive')
];

// Booking Management endpoints

// GET /api/admin-booking-management - Get all bookings with comprehensive filters
router.get('/', getAllBookings);

// GET /api/admin-booking-management/statistics - Get booking statistics
router.get('/statistics', getBookingStatistics);

// GET /api/admin-booking-management/:bookingId - Get booking by ID with full details
router.get('/:bookingId', getBookingById);

// GET /api/admin-booking-management/:bookingId/payment-logs - Get payment logs for booking
router.get('/:bookingId/payment-logs', getPaymentLogs);

// PUT /api/admin-booking-management/:bookingId/cancel - Admin cancel booking
router.put('/:bookingId/cancel', cancelBookingValidation, adminCancelBooking);

// PUT /api/admin-booking-management/:bookingId/refund - Process refund
router.put('/:bookingId/refund', refundValidation, processRefund);

// PUT /api/admin-booking-management/:bookingId/dispute - Resolve dispute
router.put('/:bookingId/dispute', disputeValidation, resolveDispute);

export default router;
