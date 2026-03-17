import { Router } from 'express';
import {
  adminLogin,
  getDashboardStats,
  getAllStays,
  updateStayStatus,
  getAllBookings,
  searchBookings,
  getAllHosts,
  getAllGuests,
  createInitialAdmin,
  getAllPayments,
  getAllRefunds,
  processRefund,
  getPaymentStats,
  getAllReviews,
  updateReviewStatus,
  getRevenueStats,
  getActivityLogs,
  getAllPromoCodes,
  createPromoCode,
  updatePromoCodeStatus,
  getAllEmailTemplates,
  updateEmailTemplate,
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
router.get('/bookings/search', searchBookings);
router.get('/hosts', getAllHosts);
router.get('/guests', getAllGuests);

// Payment routes
router.get('/payments', getAllPayments);
router.get('/payments/stats', getPaymentStats);
router.get('/refunds', getAllRefunds);
router.post('/payments/:paymentId/refund', processRefund);

// Reviews routes
router.get('/reviews', getAllReviews);
router.put('/reviews/:reviewId/status', updateReviewStatus);

// Revenue routes
router.get('/revenue/stats', getRevenueStats);

// Activity logs routes
router.get('/activity-logs', getActivityLogs);

// Promo codes routes
router.get('/promo-codes', getAllPromoCodes);
router.post('/promo-codes', createPromoCode);
router.put('/promo-codes/:promoId/status', updatePromoCodeStatus);

// Email templates routes
router.get('/email-templates', getAllEmailTemplates);
router.put('/email-templates/:templateId', updateEmailTemplate);

export default router;
