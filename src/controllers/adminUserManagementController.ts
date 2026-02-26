import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import User from '../models/User';
import Booking from '../models/Booking';

// Get all users with comprehensive filters
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      verificationStatus,
      riskScore,
      search 
    } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    // Build filter
    const filter: any = {};
    
    if (status === 'blocked') {
      filter.isBlocked = true;
    } else if (status === 'active') {
      filter.isBlocked = false;
    }
    
    if (verificationStatus) {
      filter.verificationStatus = verificationStatus;
    }
    
    if (riskScore) {
      const score = Number(riskScore);
      filter.riskScore = { $gte: score };
    }
    
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password -firebaseUid')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Add additional stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const bookingCount = await Booking.countDocuments({ 
          guestId: user._id 
        });
        
        const cancelledBookings = await Booking.countDocuments({ 
          guestId: user._id,
          bookingStatus: 'cancelled'
        });
        
        const totalSpent = await Booking.aggregate([
          { $match: { guestId: user._id, paymentStatus: 'paid' } },
          { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
        ]);

        const cancellationRate = bookingCount > 0 ? (cancelledBookings / bookingCount) * 100 : 0;

        return {
          ...user.toObject(),
          stats: {
            bookingCount,
            cancelledBookings,
            totalSpent: totalSpent[0]?.total || 0,
            cancellationRate,
            riskScore: user.riskScore || 0
          }
        };
      })
    );

    const total = await User.countDocuments(filter);

    return res.json({
      success: true,
      users: usersWithStats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get user by ID with detailed information
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-password -firebaseUid');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's booking history
    const bookings = await Booking.find({ guestId: user._id })
      .populate('stayId', 'stayName city address photos')
      .sort({ createdAt: -1 })
      .limit(20);

    // Calculate user statistics
    const bookingStats = await Booking.aggregate([
      { $match: { guestId: user._id } },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$bookingStatus', 'completed'] }, 1, 0] }
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$bookingStatus', 'cancelled'] }, 1, 0] }
          },
          totalSpent: { $sum: { $sum: '$pricing.totalAmount' } },
          averageRating: { $avg: '$rating' }
        }
      }
    ]);

    return res.json({
      success: true,
      user: {
        ...user.toObject(),
        bookings,
        stats: bookingStats[0] || {
          totalBookings: 0,
          completedBookings: 0,
          cancelledBookings: 0,
          totalSpent: 0,
          averageRating: 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching user details',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Block/Unblock user
export const updateUserBlockStatus = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    const { action, reason } = req.body; // action: 'block' | 'unblock'

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (action === 'block') {
      user.isBlocked = true;
      user.blockedAt = new Date();
      user.blockedBy = 'admin_current_user'; // TODO: Replace with actual admin ID
      user.blockReason = reason;
    } else if (action === 'unblock') {
      user.isBlocked = false;
      user.unblockedAt = new Date();
      user.unblockedBy = 'admin_current_user';
      user.blockReason = '';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be block or unblock'
      });
    }

    await user.save();

    return res.json({
      success: true,
      message: `User ${action}ed successfully`,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        isBlocked: user.isBlocked
      }
    });
  } catch (error) {
    console.error('Error updating user block status:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating user block status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update user verification status
export const updateUserVerification = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    const { status, reason } = req.body; // status: 'verified' | 'rejected'

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.verificationStatus = status;
    user.verifiedAt = new Date();
    user.verifiedBy = 'admin_current_user'; // TODO: Replace with actual admin ID

    if (status === 'rejected') {
      user.notes = reason || 'Verification rejected by admin';
    }

    await user.save();

    return res.json({
      success: true,
      message: `User verification ${status} successfully`,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        verificationStatus: user.verificationStatus
      }
    });
  } catch (error) {
    console.error('Error updating user verification:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating user verification',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update user fraud flags
export const updateUserFraudFlags = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    const { 
      suspiciousActivity, 
      multipleAccounts, 
      fakeDocuments, 
      paymentIssues, 
      unusualBookingPattern,
      flagReason 
    } = req.body;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fraud flags
    if (suspiciousActivity !== undefined) user.fraudFlags!.suspiciousActivity = suspiciousActivity;
    if (multipleAccounts !== undefined) user.fraudFlags!.multipleAccounts = multipleAccounts;
    if (fakeDocuments !== undefined) user.fraudFlags!.fakeDocuments = fakeDocuments;
    if (paymentIssues !== undefined) user.fraudFlags!.paymentIssues = paymentIssues;
    if (unusualBookingPattern !== undefined) user.fraudFlags!.unusualBookingPattern = unusualBookingPattern;

    // Update fraud tracking
    if (suspiciousActivity || multipleAccounts || fakeDocuments || paymentIssues || unusualBookingPattern) {
      user.fraudFlags!.lastFlaggedAt = new Date();
      user.fraudFlags!.flaggedBy = 'admin_current_user';
      user.fraudFlags!.flagReason = flagReason || 'Fraud detected by admin';
      
      // Update risk score based on flags
      let riskScore = user.riskScore || 0;
      if (suspiciousActivity) riskScore += 30;
      if (multipleAccounts) riskScore += 25;
      if (fakeDocuments) riskScore += 40;
      if (paymentIssues) riskScore += 20;
      if (unusualBookingPattern) riskScore += 15;
      
      user.riskScore = Math.min(riskScore, 100);
    }

    await user.save();

    return res.json({
      success: true,
      message: 'User fraud flags updated successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        riskScore: user.riskScore,
        fraudFlags: user.fraudFlags
      }
    });
  } catch (error) {
    console.error('Error updating user fraud flags:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating user fraud flags',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get user statistics
export const getUserStatistics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchFilter: any = {};
    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) matchFilter.createdAt.$gte = new Date(startDate as string);
      if (endDate) matchFilter.createdAt.$lte = new Date(endDate as string);
    }

    const stats = await User.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          blockedUsers: {
            $sum: { $cond: [{ $eq: ['$isBlocked', true] }, 1, 0] }
          },
          verifiedUsers: {
            $sum: { $cond: [{ $eq: ['$verificationStatus', 'verified'] }, 1, 0] }
          },
          highRiskUsers: {
            $sum: { $cond: [{ $gte: ['$riskScore', 70] }, 1, 0] }
          },
          suspiciousActivityUsers: {
            $sum: { $cond: [{ $eq: ['$fraudFlags.suspiciousActivity', true] }, 1, 0] }
          }
        }
      }
    ]);

    const verificationBreakdown = await User.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$verificationStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const riskScoreBreakdown = await User.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ['$riskScore', 20] }, then: 'Low' },
                { case: { $lt: ['$riskScore', 50] }, then: 'Medium' },
                { case: { $lt: ['$riskScore', 70] }, then: 'High' },
                { default: 'Critical' }
              ]
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    return res.json({
      success: true,
      statistics: stats[0] || {
        totalUsers: 0,
        blockedUsers: 0,
        verifiedUsers: 0,
        highRiskUsers: 0,
        suspiciousActivityUsers: 0
      },
      breakdowns: {
        verification: verificationBreakdown,
        riskScore: riskScoreBreakdown
      }
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching user statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get fraud detection report
export const getFraudDetectionReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, riskThreshold = 50 } = req.query;
    
    const matchFilter: any = {
      $or: [
        { 'fraudFlags.suspiciousActivity': true },
        { 'fraudFlags.multipleAccounts': true },
        { 'fraudFlags.fakeDocuments': true },
        { 'fraudFlags.paymentIssues': true },
        { 'fraudFlags.unusualBookingPattern': true },
        { riskScore: { $gte: Number(riskThreshold) } }
      ]
    };
    
    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) matchFilter.createdAt.$gte = new Date(startDate as string);
      if (endDate) matchFilter.createdAt.$lte = new Date(endDate as string);
    }

    const suspiciousUsers = await User.find(matchFilter)
      .select('-password -firebaseUid')
      .sort({ 'fraudFlags.lastFlaggedAt': -1 })
      .limit(50);

    const report = {
      period: {
        startDate,
        endDate,
        riskThreshold
      },
      summary: {
        totalSuspiciousUsers: suspiciousUsers.length,
        totalRiskScore: suspiciousUsers.reduce((sum, user) => sum + (user.riskScore || 0), 0),
        flaggedByCategory: {
          suspiciousActivity: suspiciousUsers.filter(u => u.fraudFlags?.suspiciousActivity).length,
          multipleAccounts: suspiciousUsers.filter(u => u.fraudFlags?.multipleAccounts).length,
          fakeDocuments: suspiciousUsers.filter(u => u.fraudFlags?.fakeDocuments).length,
          paymentIssues: suspiciousUsers.filter(u => u.fraudFlags?.paymentIssues).length,
          unusualBookingPattern: suspiciousUsers.filter(u => u.fraudFlags?.unusualBookingPattern).length
        }
      },
      users: suspiciousUsers.map(user => ({
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        isBlocked: user.isBlocked,
        riskScore: user.riskScore,
        fraudFlags: user.fraudFlags,
        lastFlaggedAt: user.fraudFlags?.lastFlaggedAt,
        createdAt: user.createdAt
      }))
    };

    return res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error generating fraud detection report:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating fraud detection report',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
