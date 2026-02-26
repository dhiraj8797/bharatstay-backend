import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllHosts,
  getHostById,
  updateHostKYC,
  updateHostSuspension,
  getHostDocuments,
  getHostEarnings
} from '../controllers/adminHostManagementController';

const router = Router();

// Validation middleware
const kycValidation = [
  body('action')
    .isIn(['approve', 'reject'])
    .withMessage('Action must be either approve or reject'),
  body('reason')
    .optional()
    .isString()
    .withMessage('Reason must be a string')
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters')
];

const suspensionValidation = [
  body('action')
    .isIn(['suspend', 'unsuspend'])
    .withMessage('Action must be either suspend or unsuspend'),
  body('reason')
    .if(body('action').equals('suspend'))
    .notEmpty()
    .withMessage('Reason is required for suspension')
    .isString()
    .withMessage('Reason must be a string')
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters')
];

// Host Management endpoints

// GET /api/admin-host-management - Get all hosts with filters
router.get('/', getAllHosts);

// GET /api/admin-host-management/:hostId - Get host by ID with details
router.get('/:hostId', getHostById);

// GET /api/admin-host-management/:hostId/documents - Get host documents
router.get('/:hostId/documents', getHostDocuments);

// GET /api/admin-host-management/:hostId/earnings - Get host earnings summary
router.get('/:hostId/earnings', getHostEarnings);

// PUT /api/admin-host-management/:hostId/kyc - Update host KYC status
router.put('/:hostId/kyc', kycValidation, updateHostKYC);

// PUT /api/admin-host-management/:hostId/suspension - Update host suspension status
router.put('/:hostId/suspension', suspensionValidation, updateHostSuspension);

export default router;
