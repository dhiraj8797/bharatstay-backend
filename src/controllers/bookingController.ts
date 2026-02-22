import { Request, Response } from 'express';
import Booking from '../models/Booking';
import Stay from '../models/Stay';

// Get all bookings for a host
export const getHostBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.params.hostId;
    const { status } = req.query;

    const query: any = { hostId };
    if (status) {
      query.bookingStatus = status;
    }

    const bookings = await Booking.find(query)
      .populate('stayId', 'stayName stayType')
      .populate('guestId', 'fullName email phoneNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error: any) {
    console.error('Get host bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message,
    });
  }
};

// Get booking details
export const getBookingDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const bookingId = req.params.bookingId;

    const booking = await Booking.findById(bookingId)
      .populate('stayId')
      .populate('guestId', 'fullName email phoneNumber')
      .populate('hostId', 'fullName email phoneNumber');

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error: any) {
    console.error('Get booking details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking details',
      error: error.message,
    });
  }
};

// Update booking status
export const updateBookingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const bookingId = req.params.bookingId;
    const { bookingStatus } = req.body;

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { bookingStatus },
      { new: true, runValidators: true }
    );

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
      return;
    }

    // Update stay bookings count
    if (bookingStatus === 'completed') {
      await Stay.findByIdAndUpdate(booking.stayId, {
        $inc: { bookings: 1 },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking,
    });
  } catch (error: any) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error: error.message,
    });
  }
};

// Cancel booking
export const cancelBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const bookingId = req.params.bookingId;
    const { cancellationReason } = req.body;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
      return;
    }

    if (booking.bookingStatus === 'completed' || booking.bookingStatus === 'cancelled') {
      res.status(400).json({
        success: false,
        message: 'Cannot cancel this booking',
      });
      return;
    }

    booking.bookingStatus = 'cancelled';
    booking.cancellationReason = cancellationReason;
    booking.cancellationDate = new Date();
    booking.paymentStatus = 'refunded';

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking,
    });
  } catch (error: any) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message,
    });
  }
};

// Get bookings for a specific user
export const getUserBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;

    const bookings = await Booking.find({ guestId: new mongoose.Types.ObjectId(userId) })
      .populate('stayId', 'stayName address city state photos')
      .populate('hostId', 'fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      bookings: bookings.map(booking => ({
        _id: booking._id,
        stayName: (booking.stayId as any)?.stayName || 'Unknown Stay',
        location: `${(booking.stayId as any)?.address || 'Unknown Location'}, ${(booking.stayId as any)?.city || ''}`,
        stayImage: (booking.stayId as any)?.photos?.[(booking.stayId as any)?.coverImageIndex || 0],
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guests: booking.guests || 1,
        totalAmount: booking.pricing?.totalAmount || 0,
        status: booking.bookingStatus,
        bookingDate: booking.createdAt,
        hostName: (booking.hostId as any)?.fullName || 'Unknown Host'
      }))
    });
  } catch (error: any) {
    console.error('Get user bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message,
    });
  }
};
export const getBookingStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.params.hostId;

    const stats = await Booking.aggregate([
      { $match: { hostId: new mongoose.Types.ObjectId(hostId) } },
      {
        $group: {
          _id: '$bookingStatus',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.totalAmount' },
        },
      },
    ]);

    const monthlyStats = await Booking.aggregate([
      {
        $match: {
          hostId: new mongoose.Types.ObjectId(hostId),
          createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          bookings: { $sum: 1 },
          revenue: { $sum: '$pricing.totalAmount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats,
        monthlyStats,
      },
    });
  } catch (error: any) {
    console.error('Get booking stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking statistics',
      error: error.message,
    });
  }
};

import mongoose from 'mongoose';
