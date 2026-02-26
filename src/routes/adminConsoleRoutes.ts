import { Router } from 'express';
import { body } from 'express-validator';
import {
  createAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  updateLastLogin,
  getAdminStats
} from '../controllers/adminConsoleController';

const router = Router();

// Validation middleware
const createAdminValidation = [
  body('adminId')
    .notEmpty()
    .withMessage('Admin ID is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Admin ID must be between 3 and 50 characters'),
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('role')
    .optional()
    .isIn(['super_admin', 'admin', 'moderator'])
    .withMessage('Role must be one of: super_admin, admin, moderator'),
  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array')
    .custom((permissions) => {
      const validPermissions = [
        'manage_users',
        'manage_hosts',
        'manage_stays',
        'manage_bookings',
        'manage_reviews',
        'manage_payments',
        'view_analytics',
        'manage_settings',
        'manage_promotions',
        'manage_referrals',
        'view_reports'
      ];
      
      if (!permissions.every((perm: string) => validPermissions.includes(perm))) {
        throw new Error('Invalid permission(s)');
      }
      return true;
    })
];

const updateAdminValidation = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('role')
    .optional()
    .isIn(['super_admin', 'admin', 'moderator'])
    .withMessage('Role must be one of: super_admin, admin, moderator'),
  body('permissions')
    .optional()
    .isArray()
    .withMessage('Permissions must be an array'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// Routes

// POST /api/admin-console - Create a new admin
router.post('/', createAdminValidation, createAdmin);

// GET /api/admin-console - Get all admins with pagination and filtering
router.get('/', getAllAdmins);

// GET /api/admin-console/stats - Get admin statistics
router.get('/stats', getAdminStats);

// GET /api/admin-console/:adminId - Get admin by ID
router.get('/:adminId', getAdminById);

// PUT /api/admin-console/:adminId - Update admin
router.put('/:adminId', updateAdminValidation, updateAdmin);

// DELETE /api/admin-console/:adminId - Delete admin
router.delete('/:adminId', deleteAdmin);

// PATCH /api/admin-console/:adminId/login - Update last login
router.patch('/:adminId/login', updateLastLogin);

export default router;
