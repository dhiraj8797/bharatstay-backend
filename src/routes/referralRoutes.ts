import { Router } from 'express';
import {
  getUserReferral,
  getReferralStats,
  trackReferralSignup,
  trackFirstBooking,
  validateReferralCode,
  getAllReferrals
} from '../controllers/referralController';

const router = Router();

// Get or create user referral
router.get('/user/:userId', getUserReferral);

// Get referral stats for user
router.get('/stats/:userId', getReferralStats);

// Track referral signup
router.post('/track-signup', trackReferralSignup);

// Track first booking
router.post('/track-first-booking', trackFirstBooking);

// Validate referral code
router.get('/validate/:referralCode', validateReferralCode);

// Get all referrals (admin)
router.get('/all', getAllReferrals);

export default router;
