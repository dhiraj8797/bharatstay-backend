import { Router } from 'express';
import {
  adminLogin,
  getDashboardStats,
  getAllStays,
  updateStayStatus,
  getAllBookings,
  getAllHosts,
  createInitialAdmin,
} from '../controllers/adminController';

const router = Router();

// Public routes
router.post('/login', adminLogin);
router.post('/setup', createInitialAdmin); // Only works if no admin exists

// Protected routes (add auth middleware in production)
router.get('/dashboard/stats', getDashboardStats);
router.get('/stays', getAllStays);
router.put('/stays/:stayId/status', updateStayStatus);
router.get('/bookings', getAllBookings);
router.get('/hosts', getAllHosts);

export default router;
