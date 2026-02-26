import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Promotion from '../models/Promotion';

// Create promotion
export const createPromotion = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    const promotion = new Promotion(req.body);
    await promotion.save();

    res.status(201).json({
      success: true,
      message: 'Promotion created successfully',
      data: promotion,
    });
  } catch (error: any) {
    console.error('Create promotion error:', error);
    
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Promotion code already exists',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create promotion',
      error: error.message,
    });
  }
};

// Get all promotions for a host
export const getHostPromotions = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.params.hostId;
    const { active, stayId } = req.query;

    const query: any = { hostId };
    
    if (active !== undefined) {
      query.active = active === 'true';
    }
    
    if (stayId) {
      query.$or = [{ stayId }, { applicableFor: 'all' }];
    }

    const promotions = await Promotion.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: promotions,
    });
  } catch (error: any) {
    console.error('Get host promotions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch promotions',
      error: error.message,
    });
    return;
  }
};

// Get promotion by code
export const getPromotionByCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

    const promotion = await Promotion.findOne({
      code: code.toUpperCase(),
      active: true,
    });

    if (!promotion) {
      res.status(404).json({
        success: false,
        message: 'Promotion not found or inactive',
      });
      return;
    }

    // Check if promotion is valid
    if (!(promotion as any).isValid()) {
      res.status(400).json({
        success: false,
        message: 'Promotion is expired or usage limit reached',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: promotion,
    });
  } catch (error: any) {
    console.error('Get promotion by code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch promotion',
      error: error.message,
    });
    return;
  }
};

// Update promotion
export const updatePromotion = async (req: Request, res: Response): Promise<void> => {
  try {
    const promotionId = req.params.promotionId;
    const updateData = req.body;

    const promotion = await Promotion.findByIdAndUpdate(
      promotionId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!promotion) {
      res.status(404).json({
        success: false,
        message: 'Promotion not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Promotion updated successfully',
      data: promotion,
    });
  } catch (error: any) {
    console.error('Update promotion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update promotion',
      error: error.message,
    });
    return;
  }
};

// Toggle promotion status
export const togglePromotionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const promotionId = req.params.promotionId;

    const promotion = await Promotion.findById(promotionId);

    if (!promotion) {
      res.status(404).json({
        success: false,
        message: 'Promotion not found',
      });
      return;
    }

    promotion.active = !promotion.active;
    await promotion.save();

    res.status(200).json({
      success: true,
      message: `Promotion ${promotion.active ? 'activated' : 'deactivated'} successfully`,
      data: promotion,
    });
  } catch (error: any) {
    console.error('Toggle promotion status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle promotion status',
      error: error.message,
    });
    return;
  }
};

// Delete promotion
export const deletePromotion = async (req: Request, res: Response): Promise<void> => {
  try {
    const promotionId = req.params.promotionId;

    const promotion = await Promotion.findByIdAndDelete(promotionId);

    if (!promotion) {
      res.status(404).json({
        success: false,
        message: 'Promotion not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Promotion deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete promotion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete promotion',
      error: error.message,
    });
    return;
  }
};

// Apply promotion to booking
export const applyPromotion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, bookingAmount, stayId } = req.body;

    const promotion = await Promotion.findOne({
      code: code.toUpperCase(),
      active: true,
    });

    if (!promotion) {
      res.status(404).json({
        success: false,
        message: 'Invalid promotion code',
      });
      return;
    }

    // Check if promotion is valid
    if (!(promotion as any).isValid()) {
      res.status(400).json({
        success: false,
        message: 'Promotion is expired or usage limit reached',
      });
      return;
    }

    // Check if applicable for stay
    if (promotion.applicableFor === 'specific' && promotion.stayId?.toString() !== stayId) {
      res.status(400).json({
        success: false,
        message: 'Promotion not applicable for this stay',
      });
      return;
    }

    // Check minimum booking amount
    if (promotion.minBookingAmount && bookingAmount < promotion.minBookingAmount) {
      res.status(400).json({
        success: false,
        message: `Minimum booking amount of ₹${promotion.minBookingAmount} required`,
      });
      return;
    }

    const discountAmount = (bookingAmount * promotion.discount) / 100;
    const finalAmount = bookingAmount - discountAmount;

    // Increment usage count
    promotion.usedCount += 1;
    await promotion.save();

    res.status(200).json({
      success: true,
      message: 'Promotion applied successfully',
      data: {
        discount: promotion.discount,
        discountAmount,
        originalAmount: bookingAmount,
        finalAmount,
      },
    });
  } catch (error: any) {
    console.error('Apply promotion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply promotion',
      error: error.message,
    });
    return;
  }
};

// Get promotion statistics
export const getPromotionStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.params.hostId;

    const totalPromotions = await Promotion.countDocuments({ hostId });
    
    const activePromotions = await Promotion.countDocuments({
      hostId,
      active: true,
      validTo: { $gte: new Date() },
    });

    const totalUsage = await Promotion.aggregate([
      { $match: { hostId: new mongoose.Types.ObjectId(hostId) } },
      {
        $group: {
          _id: null,
          totalUsage: { $sum: '$usedCount' },
          avgDiscount: { $avg: '$discount' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalPromotions,
        activePromotions,
        totalUsage: totalUsage.length > 0 ? totalUsage[0].totalUsage : 0,
        avgDiscount: totalUsage.length > 0 ? Math.round(totalUsage[0].avgDiscount) : 0,
      },
    });
  } catch (error: any) {
    console.error('Get promotion stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch promotion statistics',
      error: error.message,
    });
    return;
  }
};

import mongoose from 'mongoose';
