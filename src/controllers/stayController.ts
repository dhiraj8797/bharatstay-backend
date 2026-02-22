import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Stay from '../models/Stay';
import Booking from '../models/Booking';
import Review from '../models/Review';
import Payout from '../models/Payout';

// Get dashboard statistics
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.params.hostId;

    // Get all stays for this host
    const stays = await Stay.find({ hostId });
    const stayIds = stays.map(stay => stay._id);

    // Get bookings
    const bookings = await Booking.find({ hostId });
    const upcomingBookings = await Booking.countDocuments({
      hostId,
      bookingStatus: 'upcoming',
    });

    // Calculate earnings
    const paidBookings = await Booking.find({
      hostId,
      paymentStatus: 'paid',
    });

    const totalEarnings = paidBookings.reduce(
      (sum, booking) => sum + booking.pricing.totalAmount,
      0
    );

    const platformCommission = totalEarnings * 0.1; // 10% commission
    const netEarnings = totalEarnings - platformCommission;

    // Get processing amount (from processing payouts)
    const processingPayouts = await Payout.find({
      hostId,
      status: 'processing',
    });
    const processingAmount = processingPayouts.reduce(
      (sum, payout) => sum + payout.netAmount,
      0
    );

    // Get withdrawn amount (completed payouts)
    const completedPayouts = await Payout.find({
      hostId,
      status: 'completed',
    });
    const withdrawnAmount = completedPayouts.reduce(
      (sum, payout) => sum + payout.netAmount,
      0
    );

    const availableBalance = netEarnings - withdrawnAmount - processingAmount;

    // Get average rating
    const totalRating = stays.reduce((sum, stay) => sum + stay.averageRating, 0);
    const averageRating = stays.length > 0 ? totalRating / stays.length : 0;

    // Get active promotions
    const activePromotions = await  mongoose.model('Promotion').countDocuments({
      hostId,
      active: true,
      validTo: { $gte: new Date() },
    });

    // Get monthly earnings (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyEarnings = await Booking.aggregate([
      {
        $match: {
          hostId: new mongoose.Types.ObjectId(hostId),
          paymentStatus: 'paid',
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          amount: { $sum: '$pricing.totalAmount' },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalEarnings,
        platformCommission,
        availableBalance,
        processingAmount,
        totalBookings: bookings.length,
        upcomingBookings,
        averageRating: Math.round(averageRating * 10) / 10,
        activePromotions,
        monthlyEarnings,
        totalStays: stays.length,
      },
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message,
    });
  }
};

// Create new stay
export const createStay = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    const files = req.files as Express.Multer.File[];
    const photos = files.map(file => file.path);

    const stayData = {
      ...req.body,
      photos,
      amenities: JSON.parse(req.body.amenities || '[]'),
      pricing: JSON.parse(req.body.pricing || '{}'),
      capacity: JSON.parse(req.body.capacity || '{}'),
      location: {
        latitude: parseFloat(req.body.latitude),
        longitude: parseFloat(req.body.longitude),
      },
    };

    const stay = new Stay(stayData);
    await stay.save();

    res.status(201).json({
      success: true,
      message: 'Stay created successfully',
      data: stay,
    });
  } catch (error: any) {
    console.error('Create stay error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create stay',
      error: error.message,
    });
  }
};

// Get all stays for a host
export const getHostStays = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.params.hostId;
    const stays = await Stay.find({ hostId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: stays,
    });
  } catch (error: any) {
    console.error('Get host stays error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stays',
      error: error.message,
    });
  }
};

// Update stay
export const updateStay = async (req: Request, res: Response): Promise<void> => {
  try {
    const stayId = req.params.stayId;
    const updateData = { ...req.body };

    // Handle file uploads if present
    if (req.files && (req.files as Express.Multer.File[]).length > 0) {
      const files = req.files as Express.Multer.File[];
      updateData.photos = files.map(file => file.path);
    }

    // Parse JSON fields
    if (updateData.amenities) {
      updateData.amenities = JSON.parse(updateData.amenities);
    }
    if (updateData.pricing) {
      updateData.pricing = JSON.parse(updateData.pricing);
    }
    if (updateData.capacity) {
      updateData.capacity = JSON.parse(updateData.capacity);
    }

    const stay = await Stay.findByIdAndUpdate(stayId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!stay) {
      res.status(404).json({
        success: false,
        message: 'Stay not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Stay updated successfully',
      data: stay,
    });
  } catch (error: any) {
    console.error('Update stay error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stay',
      error: error.message,
    });
  }
};

// Delete stay
export const deleteStay = async (req: Request, res: Response): Promise<void> => {
  try {
    const stayId = req.params.stayId;

    // Check if there are any upcoming bookings
    const upcomingBookings = await Booking.countDocuments({
      stayId,
      bookingStatus: { $in: ['upcoming', 'ongoing'] },
    });

    if (upcomingBookings > 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete stay with active or upcoming bookings',
      });
      return;
    }

    const stay = await Stay.findByIdAndDelete(stayId);

    if (!stay) {
      res.status(404).json({
        success: false,
        message: 'Stay not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Stay deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete stay error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete stay',
      error: error.message,
    });
  }
};

// Update stay pricing
export const updateStayPricing = async (req: Request, res: Response): Promise<void> => {
  try {
    const stayId = req.params.stayId;
    const { pricing } = req.body;

    const stay = await Stay.findByIdAndUpdate(
      stayId,
      { pricing },
      { new: true, runValidators: true }
    );

    if (!stay) {
      res.status(404).json({
        success: false,
        message: 'Stay not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Pricing updated successfully',
      data: stay,
    });
  } catch (error: any) {
    console.error('Update pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update pricing',
      error: error.message,
    });
  }
};

// Toggle stay status (Go Live / Go Offline)
export const toggleStayStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const stayId = req.params.stayId;

    const stay = await Stay.findById(stayId);

    if (!stay) {
      res.status(404).json({
        success: false,
        message: 'Stay not found',
      });
      return;
    }

    // Toggle between active and inactive
    stay.status = stay.status === 'active' ? 'inactive' : 'active';
    await stay.save();

    res.status(200).json({
      success: true,
      message: `Stay is now ${stay.status}`,
      data: stay,
    });
  } catch (error: any) {
    console.error('Toggle stay status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle stay status',
      error: error.message,
    });
  }
};

import mongoose from 'mongoose';
