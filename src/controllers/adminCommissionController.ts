import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { AdminSettings } from '../models/AdminSettings';
import Booking from '../models/Booking';

// Get current admin settings
export const getAdminSettings = async (req: Request, res: Response) => {
  try {
    let settings = await AdminSettings.findOne();
    
    if (!settings) {
      // Create default settings if none exist
      settings = new AdminSettings();
      await settings.save();
    }

    return res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching admin settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update commission settings
export const updateCommissionSettings = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      commissionRate,
      commissionType,
      fixedCommissionAmount,
      commissionOnCleaningFee,
      commissionOnExtraGuests
    } = req.body;

    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = new AdminSettings();
    }

    // Update commission settings
    if (commissionRate !== undefined) settings.commissionRate = commissionRate;
    if (commissionType !== undefined) settings.commissionType = commissionType;
    if (fixedCommissionAmount !== undefined) settings.fixedCommissionAmount = fixedCommissionAmount;
    if (commissionOnCleaningFee !== undefined) settings.commissionOnCleaningFee = commissionOnCleaningFee;
    if (commissionOnExtraGuests !== undefined) settings.commissionOnExtraGuests = commissionOnExtraGuests;

    await settings.save();

    return res.json({
      success: true,
      message: 'Commission settings updated successfully',
      settings: {
        commissionRate: settings.commissionRate,
        commissionType: settings.commissionType,
        fixedCommissionAmount: settings.fixedCommissionAmount,
        commissionOnCleaningFee: settings.commissionOnCleaningFee,
        commissionOnExtraGuests: settings.commissionOnExtraGuests
      }
    });
  } catch (error) {
    console.error('Error updating commission settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating commission settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update GST settings
export const updateGstSettings = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      gstEnabled,
      gstRate,
      gstNumber,
      gstOnCommission,
      gstInclusive
    } = req.body;

    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = new AdminSettings();
    }

    // Update GST settings
    if (gstEnabled !== undefined) settings.gstEnabled = gstEnabled;
    if (gstRate !== undefined) settings.gstRate = gstRate;
    if (gstNumber !== undefined) settings.gstNumber = gstNumber;
    if (gstOnCommission !== undefined) settings.gstOnCommission = gstOnCommission;
    if (gstInclusive !== undefined) settings.gstInclusive = gstInclusive;

    await settings.save();

    return res.json({
      success: true,
      message: 'GST settings updated successfully',
      settings: {
        gstEnabled: settings.gstEnabled,
        gstRate: settings.gstRate,
        gstNumber: settings.gstNumber,
        gstOnCommission: settings.gstOnCommission,
        gstInclusive: settings.gstInclusive
      }
    });
  } catch (error) {
    console.error('Error updating GST settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating GST settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update TCS settings
export const updateTcsSettings = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      tcsEnabled,
      tcsRate,
      tcsThreshold
    } = req.body;

    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = new AdminSettings();
    }

    // Update TCS settings
    if (tcsEnabled !== undefined) settings.tcsEnabled = tcsEnabled;
    if (tcsRate !== undefined) settings.tcsRate = tcsRate;
    if (tcsThreshold !== undefined) settings.tcsThreshold = tcsThreshold;

    await settings.save();

    return res.json({
      success: true,
      message: 'TCS settings updated successfully',
      settings: {
        tcsEnabled: settings.tcsEnabled,
        tcsRate: settings.tcsRate,
        tcsThreshold: settings.tcsThreshold
      }
    });
  } catch (error) {
    console.error('Error updating TCS settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating TCS settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update platform fee settings
export const updatePlatformFeeSettings = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      platformFeeEnabled,
      platformFeeRate,
      platformFeeType,
      fixedPlatformFee
    } = req.body;

    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = new AdminSettings();
    }

    // Update platform fee settings
    if (platformFeeEnabled !== undefined) settings.platformFeeEnabled = platformFeeEnabled;
    if (platformFeeRate !== undefined) settings.platformFeeRate = platformFeeRate;
    if (platformFeeType !== undefined) settings.platformFeeType = platformFeeType;
    if (fixedPlatformFee !== undefined) settings.fixedPlatformFee = fixedPlatformFee;

    await settings.save();

    return res.json({
      success: true,
      message: 'Platform fee settings updated successfully',
      settings: {
        platformFeeEnabled: settings.platformFeeEnabled,
        platformFeeRate: settings.platformFeeRate,
        platformFeeType: settings.platformFeeType,
        fixedPlatformFee: settings.fixedPlatformFee
      }
    });
  } catch (error) {
    console.error('Error updating platform fee settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating platform fee settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Calculate commission and taxes for a booking
export const calculateBookingFinancials = async (req: Request, res: Response) => {
  try {
    const { baseAmount, cleaningFee, extraGuestCharge } = req.body;
    
    const settings = await AdminSettings.findOne();
    if (!settings) {
      return res.status(400).json({
        success: false,
        message: 'Admin settings not configured'
      });
    }

    let totalAmount = baseAmount || 0;
    
    // Add cleaning fee and extra guest charges if applicable
    if (cleaningFee && settings.commissionOnCleaningFee) {
      totalAmount += cleaningFee;
    }
    if (extraGuestCharge && settings.commissionOnExtraGuests) {
      totalAmount += extraGuestCharge;
    }

    // Calculate commission
    let commissionAmount = 0;
    if (settings.commissionType === 'percentage') {
      commissionAmount = (totalAmount * settings.commissionRate) / 100;
    } else {
      commissionAmount = settings.fixedCommissionAmount || 0;
    }

    // Calculate GST
    let gstAmount = 0;
    if (settings.gstEnabled) {
      const gstBaseAmount = settings.gstOnCommission ? totalAmount + commissionAmount : totalAmount;
      if (!settings.gstInclusive) {
        gstAmount = (gstBaseAmount * settings.gstRate) / 100;
        totalAmount += gstAmount;
      } else {
        gstAmount = (gstBaseAmount * settings.gstRate) / (100 + settings.gstRate);
      }
    }

    // Calculate TCS
    let tcsAmount = 0;
    if (settings.tcsEnabled && totalAmount >= settings.tcsThreshold) {
      tcsAmount = (totalAmount * settings.tcsRate) / 100;
    }

    // Calculate platform fee
    let platformFeeAmount = 0;
    if (settings.platformFeeEnabled) {
      if (settings.platformFeeType === 'percentage') {
        platformFeeAmount = (totalAmount * settings.platformFeeRate) / 100;
      } else {
        platformFeeAmount = settings.fixedPlatformFee || 0;
      }
    }

    const totalDeductions = commissionAmount + gstAmount + tcsAmount + platformFeeAmount;
    const netPayout = totalAmount - totalDeductions;

    return res.json({
      success: true,
      calculation: {
        baseAmount,
        cleaningFee: cleaningFee || 0,
        extraGuestCharge: extraGuestCharge || 0,
        totalAmount,
        deductions: {
          commissionAmount,
          gstAmount,
          tcsAmount,
          platformFeeAmount
        },
        totalDeductions,
        netPayout,
        rates: {
          commissionRate: settings.commissionRate,
          commissionType: settings.commissionType,
          gstRate: settings.gstRate,
          gstEnabled: settings.gstEnabled,
          tcsRate: settings.tcsRate,
          tcsEnabled: settings.tcsEnabled,
          platformFeeRate: settings.platformFeeRate,
          platformFeeEnabled: settings.platformFeeEnabled
        }
      }
    });
  } catch (error) {
    console.error('Error calculating booking financials:', error);
    return res.status(500).json({
      success: false,
      message: 'Error calculating booking financials',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Generate GST report
export const generateGstReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, format } = req.query;
    
    const settings = await AdminSettings.findOne();
    if (!settings || !settings.gstEnabled) {
      return res.status(400).json({
        success: false,
        message: 'GST is not enabled'
      });
    }

    const matchFilter: any = {
      paymentStatus: 'paid',
      createdAt: {}
    };
    
    if (startDate) matchFilter.createdAt.$gte = new Date(startDate as string);
    if (endDate) matchFilter.createdAt.$lte = new Date(endDate as string);

    const gstReport = await Booking.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalRevenue: { $sum: '$pricing.totalAmount' },
          totalCommission: { $sum: { $multiply: ['$pricing.totalAmount', settings.commissionRate / 100] } },
          bookingCount: { $sum: 1 },
          gstAmount: {
            $sum: {
              $multiply: [
                { $add: ['$pricing.totalAmount', { $multiply: ['$pricing.totalAmount', settings.commissionRate / 100] }] },
                settings.gstRate / 100
              ]
            }
          }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);

    const totalGst = gstReport.reduce((sum, item) => sum + item.gstAmount, 0);
    const totalRevenue = gstReport.reduce((sum, item) => sum + item.totalRevenue, 0);
    const totalCommission = gstReport.reduce((sum, item) => sum + item.totalCommission, 0);
    const totalBookings = gstReport.reduce((sum, item) => sum + item.bookingCount, 0);

    return res.json({
      success: true,
      report: {
        gstNumber: settings.gstNumber,
        gstRate: settings.gstRate,
        period: {
          startDate,
          endDate
        },
        summary: {
          totalRevenue,
          totalCommission,
          totalGst,
          totalBookings
        },
        monthlyBreakdown: gstReport
      }
    });
  } catch (error) {
    console.error('Error generating GST report:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating GST report',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Generate commission report
export const generateCommissionReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, hostId } = req.query;
    
    const settings = await AdminSettings.findOne();
    
    const matchFilter: any = {
      paymentStatus: 'paid',
      createdAt: {}
    };
    
    if (startDate) matchFilter.createdAt.$gte = new Date(startDate as string);
    if (endDate) matchFilter.createdAt.$lte = new Date(endDate as string);
    if (hostId) matchFilter.hostId = new mongoose.Types.ObjectId(hostId as string);

    const commissionReport = await Booking.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: hostId ? null : '$hostId',
          totalRevenue: { $sum: '$pricing.totalAmount' },
          totalCommission: { 
            $sum: { $multiply: ['$pricing.totalAmount', (settings?.commissionRate || 10) / 100] } 
          },
          bookingCount: { $sum: 1 },
          avgBookingValue: { $avg: '$pricing.totalAmount' }
        }
      },
      { $sort: { totalCommission: -1 } }
    ]);

    const totalCommission = commissionReport.reduce((sum, item) => sum + item.totalCommission, 0);
    const totalRevenue = commissionReport.reduce((sum, item) => sum + item.totalRevenue, 0);
    const totalBookings = commissionReport.reduce((sum, item) => sum + item.bookingCount, 0);

    return res.json({
      success: true,
      report: {
        commissionRate: settings?.commissionRate || 10,
        commissionType: settings?.commissionType || 'percentage',
        period: {
          startDate,
          endDate
        },
        summary: {
          totalRevenue,
          totalCommission,
          totalBookings,
          avgCommissionRate: totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0
        },
        breakdown: hostId ? commissionReport[0] || {} : commissionReport
      }
    });
  } catch (error) {
    console.error('Error generating commission report:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating commission report',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
