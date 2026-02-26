import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllDisputes,
  getDisputeById,
  createDispute,
  updateDisputeStatus,
  addDisputeMessage,
  resolveDispute,
  escalateDispute,
  getDisputeStatistics,
  exportDisputeReport
} from '../controllers/adminDisputeController';

const router = Router();

// Validation middleware
const createDisputeValidation = [
  body('type')
    .isIn(['user_complaint', 'host_complaint', 'booking_dispute', 'refund_request'])
    .withMessage('Type must be one of: user_complaint, host_complaint, booking_dispute, refund_request'),
  body('complainantId')
    .notEmpty()
    .withMessage('Complainant ID is required')
    .isMongoId()
    .withMessage('Invalid complainant ID'),
  body('complainantType')
    .isIn(['user', 'host'])
    .withMessage('Complainant type must be either user or host'),
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isString()
    .withMessage('Title must be a string')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isString()
    .withMessage('Description must be a string')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isString()
    .withMessage('Category must be a string'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),
  body('respondentId')
    .optional()
    .isMongoId()
    .withMessage('Invalid respondent ID'),
  body('respondentType')
    .optional()
    .isIn(['user', 'host', 'admin'])
    .withMessage('Respondent type must be one of: user, host, admin'),
  body('bookingId')
    .optional()
    .isMongoId()
    .withMessage('Invalid booking ID')
];

const statusUpdateValidation = [
  body('status')
    .isIn(['open', 'under_review', 'investigating', 'resolved', 'rejected', 'escalated'])
    .withMessage('Status must be one of: open, under_review, investigating, resolved, rejected, escalated'),
  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters'),
  body('assignedTo')
    .optional()
    .isString()
    .withMessage('Assigned to must be a string'),
  body('estimatedResolutionDate')
    .optional()
    .isISO8601()
    .withMessage('Estimated resolution date must be a valid date')
];

const messageValidation = [
  body('senderId')
    .notEmpty()
    .withMessage('Sender ID is required')
    .isMongoId()
    .withMessage('Invalid sender ID'),
  body('senderType')
    .isIn(['user', 'host', 'admin'])
    .withMessage('Sender type must be one of: user, host, admin'),
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isString()
    .withMessage('Message must be a string')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters')
];

const resolutionValidation = [
  body('action')
    .notEmpty()
    .withMessage('Action is required')
    .isString()
    .withMessage('Action must be a string')
    .isLength({ min: 5, max: 200 })
    .withMessage('Action must be between 5 and 200 characters'),
  body('compensation')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Compensation must be a positive number'),
  body('refundAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Refund amount must be a positive number'),
  body('notes')
    .notEmpty()
    .withMessage('Resolution notes are required')
    .isString()
    .withMessage('Notes must be a string')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Notes must be between 10 and 1000 characters')
];

const escalationValidation = [
  body('escalationReason')
    .notEmpty()
    .withMessage('Escalation reason is required')
    .isString()
    .withMessage('Escalation reason must be a string')
    .isLength({ min: 10, max: 500 })
    .withMessage('Escalation reason must be between 10 and 500 characters'),
  body('assignedTo')
    .notEmpty()
    .withMessage('Assigned to is required for escalation')
    .isString()
    .withMessage('Assigned to must be a string')
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
  body('status')
    .optional()
    .isIn(['open', 'under_review', 'investigating', 'resolved', 'rejected', 'escalated'])
    .withMessage('Invalid status'),
  body('type')
    .optional()
    .isIn(['user_complaint', 'host_complaint', 'booking_dispute', 'refund_request'])
    .withMessage('Invalid type')
];

// Dispute Management endpoints

// GET /api/admin-dispute-management - Get all disputes with comprehensive filters
router.get('/', getAllDisputes);

// GET /api/admin-dispute-management/statistics - Get dispute statistics
router.get('/statistics', getDisputeStatistics);

// GET /api/admin-dispute-management/export - Export dispute report
router.get('/export', reportValidation, exportDisputeReport);

// GET /api/admin-dispute-management/:disputeId - Get dispute by ID with full details
router.get('/:disputeId', getDisputeById);

// POST /api/admin-dispute-management - Create new dispute
router.post('/', createDisputeValidation, createDispute);

// PUT /api/admin-dispute-management/:disputeId/status - Update dispute status
router.put('/:disputeId/status', statusUpdateValidation, updateDisputeStatus);

// POST /api/admin-dispute-management/:disputeId/messages - Add message to dispute
router.post('/:disputeId/messages', messageValidation, addDisputeMessage);

// PUT /api/admin-dispute-management/:disputeId/resolve - Resolve dispute
router.put('/:disputeId/resolve', resolutionValidation, resolveDispute);

// PUT /api/admin-dispute-management/:disputeId/escalate - Escalate dispute
router.put('/:disputeId/escalate', escalationValidation, escalateDispute);

export default router;
