import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Payout from '../models/Payout';
import Booking from '../models/Booking';
import Host from '../models/Host';
import { AdminSettings } from '../models/AdminSettings';

// Get all payouts with comprehensive filters
export const getAllPayouts = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      hostId, 
      payoutMethod,
      startDate,
      endDate,
      search 
    } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    // Build filter
    const filter: any = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (hostId) {
      filter.hostId = new mongoose.Types.ObjectId(hostId as string);
    }
    
    if (payoutMethod) {
      filter.payoutMethod = payoutMethod;
    }
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }
    
    if (search) {
      filter.$or = [
        { bookingReference: { $regex: search, $options: 'i' } },
        { transactionId: { $regex: search, $options: 'i' } }
      ];
    }

    const payouts = await Payout.find(filter)
      .populate('hostId', 'fullName email')
      .populate('bookingId', 'bookingReference checkIn checkOut')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Payout.countDocuments(filter);

    return res.json({
      success: true,
      payouts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching payouts:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching payouts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get payout by ID with full details
export const getPayoutById = async (req: Request, res: Response) => {
  try {
    const { payoutId } = req.params;

    const payout = await Payout.findById(payoutId)
      .populate('hostId', 'fullName email phoneNumber')
      .populate('bookingId', 'bookingReference checkIn checkOut guestDetails pricing');
    
    if (!payout) {
      return res.status(404).json({
        success: false,
        message: 'Payout not found'
      });
    }

    return res.json({
      success: true,
      payout
    });
  } catch (error) {
    console.error('Error fetching payout details:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching payout details',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Generate payouts for completed bookings
export const generatePayouts = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { hostId, startDate, endDate } = req.body;

    // Get admin settings for commission and tax rates
    const settings = await AdminSettings.findOne();
    if (!settings) {
      return res.status(400).json({
        success: false,
        message: 'Admin settings not configured'
      });
    }

    // Find completed bookings within the period that don't have payouts yet
    const completedBookings = await Booking.find({
      hostId: new mongoose.Types.ObjectId(hostId),
      bookingStatus: 'completed',
      paymentStatus: 'paid',
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).populate('hostId');

    // Check which bookings already have payouts
    const existingPayoutBookingIds = await Payout.find({
      hostId: new mongoose.Types.ObjectId(hostId),
      bookingId: { $in: completedBookings.map(b => b._id) }
    }).distinct('bookingId');

    const bookingsNeedingPayout = completedBookings.filter(
      booking => !existingPayoutBookingIds.includes(booking._id)
    );

    const generatedPayouts = [];

    for (const booking of bookingsNeedingPayout) {
      const totalAmount = booking.pricing?.totalAmount || 0;
      
      // Calculate commission
      const commissionAmount = (totalAmount * settings.commissionRate) / 100;
      
      // Calculate GST
      const gstAmount = settings.gstEnabled ? (totalAmount * settings.gstRate) / 100 : 0;
      
      // Calculate TCS
      const tcsAmount = settings.tcsEnabled && totalAmount >= settings.tcsThreshold 
        ? (totalAmount * settings.tcsRate) / 100 
        : 0;
      
      // Calculate platform fee
      const platformFeeAmount = settings.platformFeeEnabled 
        ? (totalAmount * settings.platformFeeRate) / 100 
        : 0;
      
      const totalDeductions = commissionAmount + gstAmount + tcsAmount + platformFeeAmount;
      const netPayout = totalAmount - totalDeductions;

      // Get host's preferred payout method and details
      const host = await Host.findById(booking.hostId);
      let payoutMethod = 'bank_transfer';
      let bankDetails, upiDetails;

      if (host) {
        // This would come from host's profile settings
        payoutMethod = host.payoutMethod || 'bank_transfer';
        if (payoutMethod === 'bank_transfer') {
          bankDetails = {
            accountNumber: host.bankAccountNumber || '',
            ifsc: host.ifscCode || '',
            accountHolderName: host.fullName,
            bankName: host.bankName || ''
          };
        } else if (payoutMethod === 'upi') {
          upiDetails = {
            upiId: host.upiId || '',
            accountHolderName: host.fullName
          };
        }
      }

      const payout = new Payout({
        hostId: booking.hostId,
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        period: {
          startDate: new Date(startDate),
          endDate: new Date(endDate)
        },
        amounts: {
          totalBookingAmount: totalAmount,
          commissionAmount,
          gstAmount,
          tcsAmount,
          platformFeeAmount,
          penalties: 0,
          totalDeductions,
          netPayout
        },
        status: 'pending',
        payoutMethod,
        bankDetails,
        upiDetails
      });

      await payout.save();
      generatedPayouts.push(payout);
    }

    return res.json({
      success: true,
      message: `Generated ${generatedPayouts.length} payouts successfully`,
      payouts: generatedPayouts
    });
  } catch (error) {
    console.error('Error generating payouts:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating payouts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Process payout (release payment)
export const processPayout = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { payoutId } = req.params;
    const { action, transactionId, notes } = req.body; // action: 'process' | 'fail' | 'cancel'

    const payout = await Payout.findById(payoutId);
    
    if (!payout) {
      return res.status(404).json({
        success: false,
        message: 'Payout not found'
      });
    }

    if (payout.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payout has already been processed'
      });
    }

    if (action === 'process') {
      payout.status = 'completed';
      payout.transactionId = transactionId;
      payout.processedAt = new Date();
      payout.processedBy = 'admin_current_user'; // TODO: Replace with actual admin ID
      payout.notes = notes || 'Payment processed successfully';
    } else if (action === 'fail') {
      payout.status = 'failed';
      payout.failureReason = notes || 'Payment failed';
      payout.retryCount += 1;
      payout.lastRetryAt = new Date();
    } else if (action === 'cancel') {
      payout.status = 'cancelled';
      payout.notes = notes || 'Payout cancelled by admin';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be process, fail, or cancel'
      });
    }

    await payout.save();

    return res.json({
      success: true,
      message: `Payout ${action}ed successfully`,
      payout: {
        id: payout._id,
        status: payout.status,
        transactionId: payout.transactionId,
        processedAt: payout.processedAt
      }
    });
  } catch (error) {
    console.error('Error processing payout:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing payout',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get payout statistics
export const getPayoutStatistics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchFilter: any = {};
    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) matchFilter.createdAt.$gte = new Date(startDate as string);
      if (endDate) matchFilter.createdAt.$lte = new Date(endDate as string);
    }

    const stats = await Payout.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalPayouts: { $sum: 1 },
          pendingPayouts: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          processingPayouts: {
            $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] }
          },
          completedPayouts: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          failedPayouts: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          totalAmount: { $sum: '$amounts.totalBookingAmount' },
          totalCommission: { $sum: '$amounts.commissionAmount' },
          totalNetPayout: { $sum: '$amounts.netPayout' }
        }
      }
    ]);

    const statusBreakdown = await Payout.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amounts.netPayout' }
        }
      }
    ]);

    const methodBreakdown = await Payout.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$payoutMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amounts.netPayout' }
        }
      }
    ]);

    return res.json({
      success: true,
      statistics: stats[0] || {
        totalPayouts: 0,
        pendingPayouts: 0,
        processingPayouts: 0,
        completedPayouts: 0,
        failedPayouts: 0,
        totalAmount: 0,
        totalCommission: 0,
        totalNetPayout: 0
      },
      breakdowns: {
        status: statusBreakdown,
        method: methodBreakdown
      }
    });
  } catch (error) {
    console.error('Error fetching payout statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching payout statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Export payout report
export const exportPayoutReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, hostId, status, format } = req.query;
    
    const matchFilter: any = {};
    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) matchFilter.createdAt.$gte = new Date(startDate as string);
      if (endDate) matchFilter.createdAt.$lte = new Date(endDate as string);
    }
    
    if (hostId) {
      matchFilter.hostId = new mongoose.Types.ObjectId(hostId as string);
    }
    
    if (status) {
      matchFilter.status = status;
    }

    const payouts = await Payout.find(matchFilter)
      .populate('hostId', 'fullName email')
      .populate('bookingId', 'bookingReference checkIn checkOut')
      .sort({ createdAt: -1 });

    const report = {
      period: {
        startDate,
        endDate
      },
      summary: {
        totalPayouts: payouts.length,
        totalAmount: payouts.reduce((sum, p) => sum + (p.amounts?.totalBookingAmount || 0), 0),
        totalCommission: payouts.reduce((sum, p) => sum + (p.amounts?.commissionAmount || 0), 0),
        totalNetPayout: payouts.reduce((sum, p) => sum + (p.amounts?.netPayout || 0), 0)
      },
      payouts: payouts.map(p => ({
        id: p._id,
        hostName: (p.hostId as any)?.fullName,
        hostEmail: (p.hostId as any)?.email,
        bookingReference: p.bookingReference,
        bookingDetails: p.bookingId,
        amounts: p.amounts,
        status: p.status,
        payoutMethod: p.payoutMethod,
        transactionId: p.transactionId,
        processedAt: p.processedAt,
        createdAt: p.createdAt
      }))
    };

    return res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error exporting payout report:', error);
    return res.status(500).json({
      success: false,
      message: 'Error exporting payout report',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get host payout summary
export const getHostPayoutSummary = async (req: Request, res: Response) => {
  try {
    const { hostId } = req.params;
    const { startDate, endDate } = req.query;

    const matchFilter: any = {
      hostId: new mongoose.Types.ObjectId(hostId)
    };
    
    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) matchFilter.createdAt.$gte = new Date(startDate as string);
      if (endDate) matchFilter.createdAt.$lte = new Date(endDate as string);
    }

    const summary = await Payout.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalPayouts: { $sum: 1 },
          pendingPayouts: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          completedPayouts: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalAmount: { $sum: '$amounts.totalBookingAmount' },
          totalCommission: { $sum: '$amounts.commissionAmount' },
          totalNetPayout: { $sum: '$amounts.netPayout' }
        }
      }
    ]);

    const monthlyBreakdown = await Payout.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalPayouts: { $sum: 1 },
          totalAmount: { $sum: '$amounts.totalBookingAmount' },
          totalNetPayout: { $sum: '$amounts.netPayout' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);

    return res.json({
      success: true,
      summary: summary[0] || {
        totalPayouts: 0,
        pendingPayouts: 0,
        completedPayouts: 0,
        totalAmount: 0,
        totalCommission: 0,
        totalNetPayout: 0
      },
      monthlyBreakdown
    });
  } catch (error) {
    console.error('Error fetching host payout summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching host payout summary',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
