import { Router } from 'express';
import {
  getDashboardStats,
  getBookingsPerDayChart,
  getRevenueChart,
  getCityWiseBookings,
  getPropertyTypeDistribution,
  getRecentActivities
} from '../controllers/adminDashboardController';

const router = Router();

// Dashboard endpoints

// GET /api/admin-dashboard/stats - Get dashboard top stats
router.get('/stats', getDashboardStats);

// GET /api/admin-dashboard/charts/bookings-per-day - Get bookings per day chart
router.get('/charts/bookings-per-day', getBookingsPerDayChart);

// GET /api/admin-dashboard/charts/revenue - Get revenue chart
router.get('/charts/revenue', getRevenueChart);

// GET /api/admin-dashboard/charts/city-wise-bookings - Get city-wise bookings
router.get('/charts/city-wise-bookings', getCityWiseBookings);

// GET /api/admin-dashboard/charts/property-types - Get property type distribution
router.get('/charts/property-types', getPropertyTypeDistribution);

// GET /api/admin-dashboard/recent-activities - Get recent activities
router.get('/recent-activities', getRecentActivities);

export default router;
