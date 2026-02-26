import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Booking from '../models/Booking';
import HostDashBoardStay from '../models/HostDashBoardStay';
import User from '../models/User';
import Host from '../models/Host';

// Get all bookings with comprehensive filters
export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      paymentStatus, 
      hostId, 
      propertyId,
      guestId,
      startDate,
      endDate,
      disputeStatus,
      refundStatus,
      search 
    } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    // Build filter
    const filter: any = {};
    
    if (status) {
      filter.bookingStatus = status;
    }
    
    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }
    
    if (hostId) {
      filter.hostId = new mongoose.Types.ObjectId(hostId as string);
    }
    
    if (propertyId) {
      filter.stayId = new mongoose.Types.ObjectId(propertyId as string);
    }
    
    if (guestId) {
      filter.guestId = new mongoose.Types.ObjectId(guestId as string);
    }
    
    if (disputeStatus) {
      filter.disputeStatus = disputeStatus;
    }
    
    if (refundStatus && refundStatus !== 'none') {
      filter.refundStatus = refundStatus;
    }
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }
    
    if (search) {
      filter.$or = [
        { bookingReference: { $regex: search, $options: 'i' } },
        { 'guestDetails.name': { $regex: search, $options: 'i' } },
        { 'guestDetails.email': { $regex: search, $options: 'i' } }
      ];
    }

    const bookings = await Booking.find(filter)
      .populate('guestId', 'fullName email')
      .populate('hostId', 'fullName email')
      .populate('stayId', 'stayName city address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Calculate commission and GST if not already set
    const bookingsWithFinancials = bookings.map(booking => {
      const totalAmount = booking.pricing?.totalAmount || 0;
      const commissionAmount = booking.commissionAmount || (totalAmount * 0.1); // 10% commission
      const gstAmount = booking.gstAmount || (totalAmount * 0.18); // 18% GST
      const tcsAmount = booking.tcsAmount || (totalAmount * 0.01); // 1% TCS
      
      return {
        ...booking.toObject(),
        financials: {
          totalAmount,
          commissionAmount,
          gstAmount,
          tcsAmount,
          netPayout: totalAmount - commissionAmount - gstAmount - tcsAmount
        }
      };
    });

    const total = await Booking.countDocuments(filter);

    return res.json({
      success: true,
      bookings: bookingsWithFinancials,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get booking by ID with full details
export const getBookingById = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate('guestId', 'fullName email phoneNumber')
      .populate('hostId', 'fullName email phoneNumber')
      .populate('stayId', 'stayName city address photos amenities');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Calculate financial details
    const totalAmount = booking.pricing?.totalAmount || 0;
    const commissionAmount = booking.commissionAmount || (totalAmount * 0.1);
    const gstAmount = booking.gstAmount || (totalAmount * 0.18);
    const tcsAmount = booking.tcsAmount || (totalAmount * 0.01);

    return res.json({
      success: true,
      booking: {
        ...booking.toObject(),
        financials: {
          totalAmount,
          commissionAmount,
          gstAmount,
          tcsAmount,
          netPayout: totalAmount - commissionAmount - gstAmount - tcsAmount,
          commissionRate: 10, // This should come from settings
          gstRate: 18, // This should come from settings
          tcsRate: 1 // This should come from settings
        }
      }
    });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching booking details',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Admin cancel booking
export const adminCancelBooking = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { bookingId } = req.params;
    const { reason, refundAmount } = req.body;

    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    // Update booking with admin cancellation details
    booking.bookingStatus = 'cancelled';
    booking.cancellationDate = new Date();
    booking.adminCancelled = true;
    booking.adminCancelledBy = 'admin_current_user'; // TODO: Replace with actual admin ID
    booking.adminCancelledAt = new Date();
    booking.adminCancellationReason = reason;

    // Set refund status and amount
    if (refundAmount && refundAmount > 0) {
      booking.refundStatus = 'pending';
      booking.refundAmount = refundAmount;
      booking.refundReason = `Admin cancellation: ${reason}`;
    }

    await booking.save();

    return res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: {
        id: booking._id,
        bookingReference: booking.bookingReference,
        status: booking.bookingStatus,
        adminCancelled: true,
        refundStatus: booking.refundStatus,
        refundAmount: booking.refundAmount
      }
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Process refund
export const processRefund = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { bookingId } = req.params;
    const { action, amount, reason } = req.body; // action: 'approve' | 'reject'

    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.refundStatus === 'processed') {
      return res.status(400).json({
        success: false,
        message: 'Refund has already been processed'
      });
    }

    if (action === 'approve') {
      booking.refundStatus = 'approved';
      booking.refundAmount = amount || booking.refundAmount || (booking.pricing?.totalAmount || 0);
      booking.refundReason = reason || 'Refund approved by admin';
      booking.refundProcessedAt = new Date();
      booking.refundProcessedBy = 'admin_current_user';
      
      // In a real implementation, you would integrate with payment gateway here
      // For now, we'll mark it as processed
      booking.refundStatus = 'processed';
    } else if (action === 'reject') {
      booking.refundStatus = 'rejected';
      booking.refundReason = reason || 'Refund rejected by admin';
      booking.refundProcessedAt = new Date();
      booking.refundProcessedBy = 'admin_current_user';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be approve or reject'
      });
    }

    await booking.save();

    return res.json({
      success: true,
      message: `Refund ${action}d successfully`,
      booking: {
        id: booking._id,
        bookingReference: booking.bookingReference,
        refundStatus: booking.refundStatus,
        refundAmount: booking.refundAmount,
        refundReason: booking.refundReason
      }
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing refund',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Resolve dispute
export const resolveDispute = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { bookingId } = req.params;
    const { resolution, action, refundAmount } = req.body; // action: 'resolve' | 'reject'

    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.disputeStatus === 'resolved') {
      return res.status(400).json({
        success: false,
        message: 'Dispute has already been resolved'
      });
    }

    if (action === 'resolve') {
      booking.disputeStatus = 'resolved';
      booking.disputeResolution = resolution;
      booking.disputeResolvedAt = new Date();
      booking.disputeResolvedBy = 'admin_current_user';
      
      // If refund is part of resolution
      if (refundAmount && refundAmount > 0) {
        booking.refundStatus = 'approved';
        booking.refundAmount = refundAmount;
        booking.refundReason = `Dispute resolution: ${resolution}`;
        booking.refundProcessedAt = new Date();
        booking.refundProcessedBy = 'admin_current_user';
        booking.refundStatus = 'processed';
      }
    } else if (action === 'reject') {
      booking.disputeStatus = 'rejected';
      booking.disputeResolution = resolution;
      booking.disputeResolvedAt = new Date();
      booking.disputeResolvedBy = 'admin_current_user';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be resolve or reject'
      });
    }

    await booking.save();

    return res.json({
      success: true,
      message: `Dispute ${action}d successfully`,
      booking: {
        id: booking._id,
        bookingReference: booking.bookingReference,
        disputeStatus: booking.disputeStatus,
        disputeResolution: booking.disputeResolution,
        refundStatus: booking.refundStatus,
        refundAmount: booking.refundAmount
      }
    });
  } catch (error) {
    console.error('Error resolving dispute:', error);
    return res.status(500).json({
      success: false,
      message: 'Error resolving dispute',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get booking statistics
export const getBookingStatistics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchFilter: any = {};
    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) matchFilter.createdAt.$gte = new Date(startDate as string);
      if (endDate) matchFilter.createdAt.$lte = new Date(endDate as string);
    }

    const stats = await Booking.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          paidBookings: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] }
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$bookingStatus', 'cancelled'] }, 1, 0] }
          },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$bookingStatus', 'completed'] }, 1, 0] }
          },
          adminCancelledBookings: {
            $sum: { $cond: [{ $eq: ['$adminCancelled', true] }, 1, 0] }
          },
          totalRevenue: { $sum: '$pricing.totalAmount' },
          totalCommission: { $sum: { $multiply: ['$pricing.totalAmount', 0.1] } },
          pendingDisputes: {
            $sum: { $cond: [{ $eq: ['$disputeStatus', 'pending'] }, 1, 0] }
          },
          pendingRefunds: {
            $sum: { $cond: [{ $eq: ['$refundStatus', 'pending'] }, 1, 0] }
          }
        }
      }
    ]);

    const statusBreakdown = await Booking.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$bookingStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const paymentStatusBreakdown = await Booking.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    return res.json({
      success: true,
      statistics: stats[0] || {
        totalBookings: 0,
        paidBookings: 0,
        cancelledBookings: 0,
        completedBookings: 0,
        adminCancelledBookings: 0,
        totalRevenue: 0,
        totalCommission: 0,
        pendingDisputes: 0,
        pendingRefunds: 0
      },
      breakdowns: {
        status: statusBreakdown,
        paymentStatus: paymentStatusBreakdown
      }
    });
  } catch (error) {
    console.error('Error fetching booking statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching booking statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get payment logs for a booking
export const getPaymentLogs = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate('guestId', 'fullName email')
      .populate('hostId', 'fullName email')
      .populate('stayId', 'stayName city');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // In a real implementation, you would fetch payment logs from your payment gateway
    // For now, we'll create a mock payment log structure
    const paymentLogs = [
      {
        timestamp: booking.createdAt,
        type: 'booking_created',
        amount: booking.pricing?.totalAmount,
        status: 'success',
        description: `Booking ${booking.bookingReference} created`
      },
      ...(booking.paymentStatus === 'paid' ? [{
        timestamp: booking.updatedAt,
        type: 'payment_completed',
        amount: booking.pricing?.totalAmount,
        status: 'success',
        description: 'Payment completed successfully'
      }] : []),
      ...(booking.refundStatus === 'processed' ? [{
        timestamp: booking.refundProcessedAt,
        type: 'refund_processed',
        amount: booking.refundAmount,
        status: 'success',
        description: `Refund processed: ${booking.refundReason}`
      }] : [])
    ];

    return res.json({
      success: true,
      booking: {
        id: booking._id,
        bookingReference: booking.bookingReference,
        guest: booking.guestId,
        host: booking.hostId,
        property: booking.stayId,
        amount: booking.pricing?.totalAmount,
        paymentStatus: booking.paymentStatus,
        refundStatus: booking.refundStatus
      },
      paymentLogs
    });
  } catch (error) {
    console.error('Error fetching payment logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching payment logs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
