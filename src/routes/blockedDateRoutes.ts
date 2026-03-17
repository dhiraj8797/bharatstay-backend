import { Router } from 'express';
import { protect } from '../middleware/auth';
import { blockDates, unblockDates, getBlockedDates } from '../controllers/blockedDateController';

const router = Router();

// All routes require authentication
router.use(protect);

// Block dates
router.post('/block-dates', blockDates);

// Unblock dates
router.post('/unblock-dates', unblockDates);

// Get blocked dates
router.get('/blocked-dates/:stayId', getBlockedDates);
router.get('/blocked-dates/:hostId', getBlockedDates);

export default router;
