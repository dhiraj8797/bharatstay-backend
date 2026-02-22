import express from 'express';
import {
  requestPayout,
  getPayoutHistory,
  getPayoutDetails,
  getPayoutStats,
  updateBankDetails,
} from '../controllers/payoutController';

const router = express.Router();

// Payout management
router.post('/request', requestPayout);
router.get('/history/:hostId', getPayoutHistory);
router.get('/details/:payoutId', getPayoutDetails);
router.get('/stats/:hostId', getPayoutStats);
router.put('/bank-details/:hostId', updateBankDetails);

export default router;
