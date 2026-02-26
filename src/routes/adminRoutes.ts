import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getAdminStats,
  getAllUsers,
  getAllStays,
  getAllBookings,
  verifyUser,
  suspendUser,
  deleteUser,
  approveStay,
  rejectStay,
  suspendStay
} from '../controllers/adminController';

const router = Router();

// Apply authentication middleware to all admin routes
router.use(authenticateToken);

// Dashboard stats
router.get('/stats', getAdminStats);

// Users
router.get('/users', getAllUsers);
router.post('/users/:userId/verify', verifyUser);
router.post('/users/:userId/suspend', suspendUser);
router.post('/users/:userId/delete', deleteUser);

// Stays
router.get('/stays', getAllStays);
router.post('/stays/:stayId/approve', approveStay);
router.post('/stays/:stayId/reject', rejectStay);
router.post('/stays/:stayId/suspend', suspendStay);

// Bookings
router.get('/bookings', getAllBookings);

export default router;
