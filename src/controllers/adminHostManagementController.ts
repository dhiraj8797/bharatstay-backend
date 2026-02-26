import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Host from '../models/Host';
import HostDashBoardStay from '../models/HostDashBoardStay';
import Booking from '../models/Booking';

// Get all hosts with filters
export const getAllHosts = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      kycStatus, 
      verificationStatus, 
      suspensionStatus,
      search 
    } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    // Build filter
    const filter: any = {};
    
    if (kycStatus === 'pending') {
      filter['documents.aadhar'] = { $exists: true, $ne: null };
      filter['isVerified'] = false;
    } else if (kycStatus === 'approved') {
      filter['isVerified'] = true;
    } else if (kycStatus === 'rejected') {
      filter['isVerified'] = false;
      filter['documents.aadhar'] = { $exists: true, $ne: null };
    }
    
    if (suspensionStatus === 'suspended') {
      filter['isSuspended'] = true;
    } else if (suspensionStatus === 'active') {
      filter['isSuspended'] = { $ne: true };
    }
    
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const hosts = await Host.find(filter)
      .select('-password -firebaseUid')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Add additional stats for each host
    const hostsWithStats = await Promise.all(
      hosts.map(async (host) => {
        const propertyCount = await HostDashBoardStay.countDocuments({ 
          hostId: host._id 
        });
        
        const bookingCount = await Booking.countDocuments({ 
          hostId: host._id 
        });
        
        const totalRevenue = await Booking.aggregate([
          { $match: { hostId: host._id, paymentStatus: 'paid' } },
          { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
        ]);
        
        const cancellationRate = await Booking.aggregate([
          { $match: { hostId: host._id } },
          { 
            $group: { 
              _id: null, 
              total: { $sum: 1 },
              cancelled: { 
                $sum: { 
                  $cond: [{ $eq: ['$bookingStatus', 'cancelled'] }, 1, 0] 
                } 
              }
            } 
          }
        ]);

        const stats = cancellationRate[0] || { total: 0, cancelled: 0 };
        const cancelRate = stats.total > 0 ? (stats.cancelled / stats.total) * 100 : 0;

        return {
          ...host.toObject(),
          stats: {
            propertyCount,
            bookingCount,
            totalRevenue: totalRevenue[0]?.total || 0,
            cancellationRate: cancelRate
          }
        };
      })
    );

    const total = await Host.countDocuments(filter);

    return res.json({
      success: true,
      hosts: hostsWithStats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching hosts:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching hosts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get host by ID with detailed information
export const getHostById = async (req: Request, res: Response) => {
  try {
    const { hostId } = req.params;

    const host = await Host.findById(hostId).select('-password -firebaseUid');
    
    if (!host) {
      return res.status(404).json({
        success: false,
        message: 'Host not found'
      });
    }

    // Get host properties
    const properties = await HostDashBoardStay.find({ hostId: host._id })
      .sort({ createdAt: -1 });

    // Get recent bookings
    const recentBookings = await Booking.find({ hostId: host._id })
      .populate('guestId', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(10);

    // Calculate earnings
    const earnings = await Booking.aggregate([
      { $match: { hostId: host._id, paymentStatus: 'paid' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalRevenue: { $sum: '$pricing.totalAmount' },
          commission: { $sum: { $multiply: ['$pricing.totalAmount', 0.1] } },
          netEarnings: { $sum: { $multiply: ['$pricing.totalAmount', 0.9] } },
          bookingCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);

    return res.json({
      success: true,
      host: {
        ...host.toObject(),
        properties,
        recentBookings,
        earnings
      }
    });
  } catch (error) {
    console.error('Error fetching host details:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching host details',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Approve/Reject Host KYC
export const updateHostKYC = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { hostId } = req.params;
    const { action, reason } = req.body; // action: 'approve' | 'reject'

    const host = await Host.findById(hostId);
    
    if (!host) {
      return res.status(404).json({
        success: false,
        message: 'Host not found'
      });
    }

    if (action === 'approve') {
      host.isVerified = true;
      host.kycStatus = 'approved';
      host.kycApprovedAt = new Date();
      host.kycApprovedBy = 'admin_current_user'; // TODO: Replace with actual admin ID from auth middleware
    } else if (action === 'reject') {
      host.isVerified = false;
      host.kycStatus = 'rejected';
      host.kycRejectedAt = new Date();
      host.kycRejectedBy = 'admin_current_user'; // TODO: Replace with actual admin ID from auth middleware
      host.kycRejectionReason = reason;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be approve or reject'
      });
    }

    await host.save();

    return res.json({
      success: true,
      message: `Host KYC ${action}d successfully`,
      host: {
        id: host._id,
        fullName: host.fullName,
        email: host.email,
        isVerified: host.isVerified,
        kycStatus: host.kycStatus
      }
    });
  } catch (error) {
    console.error('Error updating host KYC:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating host KYC',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Suspend/Unsuspend Host
export const updateHostSuspension = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { hostId } = req.params;
    const { action, reason } = req.body; // action: 'suspend' | 'unsuspend'

    const host = await Host.findById(hostId);
    
    if (!host) {
      return res.status(404).json({
        success: false,
        message: 'Host not found'
      });
    }

    if (action === 'suspend') {
      host.isSuspended = true;
      host.suspendedAt = new Date();
      host.suspendedBy = 'admin_current_user'; // TODO: Replace with actual admin ID from auth middleware
      host.suspensionReason = reason;
      
      // Also deactivate all their properties
      await HostDashBoardStay.updateMany(
        { hostId: host._id },
        { status: 'suspended' }
      );
    } else if (action === 'unsuspend') {
      host.isSuspended = false;
      host.unsuspendedAt = new Date();
      host.unsuspendedBy = 'admin_current_user'; // TODO: Replace with actual admin ID from auth middleware
      
      // Reactivate their properties
      await HostDashBoardStay.updateMany(
        { hostId: host._id, status: 'suspended' },
        { status: 'active' }
      );
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be suspend or unsuspend'
      });
    }

    await host.save();

    return res.json({
      success: true,
      message: `Host ${action}ed successfully`,
      host: {
        id: host._id,
        fullName: host.fullName,
        email: host.email,
        isSuspended: host.isSuspended
      }
    });
  } catch (error) {
    console.error('Error updating host suspension:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating host suspension',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get host documents
export const getHostDocuments = async (req: Request, res: Response) => {
  try {
    const { hostId } = req.params;

    const host = await Host.findById(hostId)
      .select('documents fullName email isVerified kycStatus')
      .lean();

    if (!host) {
      return res.status(404).json({
        success: false,
        message: 'Host not found'
      });
    }

    return res.json({
      success: true,
      host
    });
  } catch (error) {
    console.error('Error fetching host documents:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching host documents',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get host earnings summary
export const getHostEarnings = async (req: Request, res: Response) => {
  try {
    const { hostId } = req.params;
    const { startDate, endDate } = req.query;

    const matchFilter: any = { hostId: new mongoose.Types.ObjectId(hostId) };
    
    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) matchFilter.createdAt.$gte = new Date(startDate as string);
      if (endDate) matchFilter.createdAt.$lte = new Date(endDate as string);
    }

    const earnings = await Booking.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricing.totalAmount' },
          totalCommission: { $sum: { $multiply: ['$pricing.totalAmount', 0.1] } },
          netEarnings: { $sum: { $multiply: ['$pricing.totalAmount', 0.9] } },
          totalBookings: { $sum: 1 },
          paidBookings: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] }
          }
        }
      }
    ]);

    const monthlyEarnings = await Booking.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$pricing.totalAmount' },
          commission: { $sum: { $multiply: ['$pricing.totalAmount', 0.1] } },
          netEarnings: { $sum: { $multiply: ['$pricing.totalAmount', 0.9] } },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);

    return res.json({
      success: true,
      summary: earnings[0] || {
        totalRevenue: 0,
        totalCommission: 0,
        netEarnings: 0,
        totalBookings: 0,
        paidBookings: 0
      },
      monthlyEarnings
    });
  } catch (error) {
    console.error('Error fetching host earnings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching host earnings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
