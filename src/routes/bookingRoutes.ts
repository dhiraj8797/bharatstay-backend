import express from 'express';

import { protect } from '../middleware/auth';

import {
  createBooking,
  getHostBookings,
  getUserBookings,
  getBookingDetails,
  updateBookingStatus,
  cancelBooking,
  getBookingStats,
  sendConfirmationEmail,
} from '../controllers/bookingController';

const router = express.Router();

// Booking management - Protected routes

// Create new booking
router.post('/', protect, createBooking);

router.get('/host/:hostId', protect, getHostBookings);

router.get('/user/:userId', protect, getUserBookings);

router.get('/details/:bookingId', protect, getBookingDetails);

router.put('/:bookingId/status', protect, updateBookingStatus);

router.put('/:bookingId/cancel', protect, cancelBooking);

router.get('/stats/:hostId', protect, getBookingStats);

// Send confirmation email
router.post('/send-confirmation-email', protect, sendConfirmationEmail);

export default router;

