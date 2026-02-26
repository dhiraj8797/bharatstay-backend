import { Request, Response } from 'express';
import Payout from '../models/Payout';
import Booking from '../models/Booking';
import mongoose from 'mongoose';

// Request payout
export const requestPayout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hostId, amount, payoutMethod, bankDetails, upiId } = req.body;

    // Calculate platform commission (6%)
    const platformCommission = amount * 0.06;
    const netAmount = amount - platformCommission;

    // Verify if host has sufficient available balance
    const paidBookings = await Booking.find({
      hostId,
      paymentStatus: 'paid',
    });

    const totalEarnings = paidBookings.reduce(
      (sum, booking) => sum + booking.pricing.totalAmount,
      0
    );

    const completedPayouts = await Payout.find({
      hostId,
      status: { $in: ['completed', 'processing'] },
    });

    const withdrawnAmount = completedPayouts.reduce(
      (sum, payout) => sum + payout.netAmount,
      0
    );

    const availableBalance = totalEarnings - totalEarnings * 0.1 - withdrawnAmount;

    if (netAmount > availableBalance) {
      res.status(400).json({
        success: false,
        message: 'Insufficient balance for withdrawal',
      });
      return;
    }

    const payout = new Payout({
      hostId,
      amount,
      platformCommission,
      netAmount,
      payoutMethod,
      bankDetails: payoutMethod === 'bank' ? bankDetails : undefined,
      upiId: payoutMethod === 'upi' ? upiId : undefined,
    });

    await payout.save();

    res.status(201).json({
      success: true,
      message: 'Payout request submitted successfully',
      data: payout,
    });
  } catch (error: any) {
    console.error('Request payout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request payout',
      error: error.message,
    });
  }
};

// Get payout history
export const getPayoutHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.params.hostId;
    const { status } = req.query;

    const query: any = { hostId };
    if (status) {
      query.status = status;
    }

    const payouts = await Payout.find(query).sort({ requestedAt: -1 });

    res.status(200).json({
      success: true,
      data: payouts,
    });
  } catch (error: any) {
    console.error('Get payout history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payout history',
      error: error.message,
    });
  }
};

// Get payout details
export const getPayoutDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const payoutId = req.params.payoutId;

    const payout = await Payout.findById(payoutId).populate('hostId', 'fullName email phoneNumber');

    if (!payout) {
      res.status(404).json({
        success: false,
        message: 'Payout not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: payout,
    });
  } catch (error: any) {
    console.error('Get payout details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payout details',
      error: error.message,
    });
  }
};

// Get payout statistics
export const getPayoutStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.params.hostId;

    // Get all paid bookings
    const paidBookings = await Booking.find({
      hostId,
      paymentStatus: 'paid',
    });

    const totalEarnings = paidBookings.reduce(
      (sum, booking) => sum + booking.pricing.totalAmount,
      0
    );

    const platformCommission = totalEarnings * 0.06;

    // Get payouts by status
    const completedPayouts = await Payout.find({
      hostId,
      status: 'completed',
    });

    const processingPayouts = await Payout.find({
      hostId,
      status: 'processing',
    });

    const withdrawnAmount = completedPayouts.reduce(
      (sum, payout) => sum + payout.netAmount,
      0
    );

    const processingAmount = processingPayouts.reduce(
      (sum, payout) => sum + payout.netAmount,
      0
    );

    const availableBalance = totalEarnings - platformCommission - withdrawnAmount - processingAmount;

    res.status(200).json({
      success: true,
      data: {
        totalEarnings,
        platformCommission,
        availableBalance,
        processingAmount,
        withdrawnAmount,
        totalPayouts: completedPayouts.length + processingPayouts.length,
      },
    });
  } catch (error: any) {
    console.error('Get payout stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payout statistics',
      error: error.message,
    });
  }
};

// Update bank details
export const updateBankDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.params.hostId;
    const { bankDetails, upiId } = req.body;

    // Store bank details in HostSignUp model
    const HostSignUp = mongoose.model('HostSignUp');
    
    const host = await HostSignUp.findByIdAndUpdate(
      hostId,
      {
        bankDetails,
        upiId,
      },
      { new: true }
    );

    if (!host) {
      res.status(404).json({
        success: false,
        message: 'Host not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Bank details updated successfully',
    });
  } catch (error: any) {
    console.error('Update bank details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bank details',
      error: error.message,
    });
  }
};
