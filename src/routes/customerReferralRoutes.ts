import { Router } from 'express';
import {
  getCustomerReferral,
  checkReferralEligibility,
  getCustomerReferralStats,
  trackCustomerReferralSignup,
  trackCustomerFirstBooking,
  applyReferrerDiscount,
  validateCustomerReferralCode,
  getAllCustomerReferrals
} from '../controllers/customerReferralController';

const router = Router();

// Get or create customer referral
router.get('/user/:userId', getCustomerReferral);

// Check if user can refer
router.get('/eligibility/:userId', checkReferralEligibility);

// Get customer referral stats
router.get('/stats/:userId', getCustomerReferralStats);

// Track customer referral signup
router.post('/track-signup', trackCustomerReferralSignup);

// Track customer first booking
router.post('/track-first-booking', trackCustomerFirstBooking);

// Apply referrer discount
router.post('/apply-discount', applyReferrerDiscount);

// Validate customer referral code
router.get('/validate/:referralCode', validateCustomerReferralCode);

// Get all customer referrals (admin)
router.get('/all', getAllCustomerReferrals);

export default router;
