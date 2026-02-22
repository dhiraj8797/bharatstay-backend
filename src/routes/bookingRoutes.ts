import express from 'express';

import {

  getHostBookings,

  getUserBookings,

  getBookingDetails,

  updateBookingStatus,

  cancelBooking,

  getBookingStats,

} from '../controllers/bookingController';



const router = express.Router();



// Booking management

router.get('/host/:hostId', getHostBookings);

router.get('/user/:userId', getUserBookings);

router.get('/details/:bookingId', getBookingDetails);

router.put('/:bookingId/status', updateBookingStatus);

router.put('/:bookingId/cancel', cancelBooking);

router.get('/stats/:hostId', getBookingStats);



export default router;

