import { Request, Response } from 'express';
import Referral from '../models/Referral';

// Get or create referral for a user
export const getUserReferral = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Check if user already has a referral code
    let referral = await Referral.findOne({ referrerId: userId });
    
    if (!referral) {
      // Create new referral for this user
      referral = await (Referral as any).createReferral(userId);
    }

    if (referral) {
      return res.status(200).json({
        success: true,
        data: {
          referralCode: referral.referralCode,
          referralLink: referral.referralLink,
          status: referral.status
        }
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create referral'
    });

  } catch (error: any) {
    console.error('Get user referral error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get referral information',
      error: error.message
    });
  }
};

// Get referral stats for a user
export const getReferralStats = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const stats = await (Referral as any).getReferralStats(userId);
    const recentReferrals = await (Referral as any).getRecentReferrals(userId, 5);

    return res.status(200).json({
      success: true,
      data: {
        stats,
        recentReferrals
      }
    });

  } catch (error: any) {
    console.error('Get referral stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get referral stats',
      error: error.message
    });
  }
};

// Track referral signup
export const trackReferralSignup = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { referralCode } = req.body;
    const { userId, email, phone } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    if (!referralCode || !userId || !email) {
      return res.status(400).json({
        success: false,
        message: 'Referral code, user ID, and email are required'
      });
    }

    const refereeData = {
      userId,
      email,
      phone,
      ipAddress,
      userAgent
    };

    const referral = await (Referral as any).trackSignup(referralCode, refereeData);

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or already used referral code'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Referral signup tracked successfully',
      data: {
        referralId: referral._id,
        referrerId: referral.referrerId,
        rewardAmount: referral.rewardAmount
      }
    });

  } catch (error: any) {
    console.error('Track referral signup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to track referral signup',
      error: error.message
    });
  }
};

// Track first booking for referral
export const trackFirstBooking = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId } = req.body;
    const { bookingId } = req.body;

    if (!userId || !bookingId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and booking ID are required'
      });
    }

    const referral = await (Referral as any).trackFirstBooking(userId, bookingId);

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'No pending referral found for this user'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'First booking tracked successfully',
      data: {
        referralId: referral._id,
        referrerId: referral.referrerId,
        rewardAmount: referral.rewardAmount,
        status: referral.status
      }
    });

  } catch (error: any) {
    console.error('Track first booking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to track first booking',
      error: error.message
    });
  }
};

// Validate referral code
export const validateReferralCode = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { referralCode } = req.params;

    if (!referralCode) {
      return res.status(400).json({
        success: false,
        message: 'Referral code is required'
      });
    }

    const referral = await Referral.findOne({ 
      referralCode, 
      status: 'pending' 
    }).populate('referrerId', 'name email');

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or already used referral code'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        referralCode: referral.referralCode,
        referrerInfo: referral.referrerId,
        rewardAmount: referral.rewardAmount
      }
    });

  } catch (error: any) {
    console.error('Validate referral code error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to validate referral code',
      error: error.message
    });
  }
};

// Get all referrals for admin
export const getAllReferrals = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    const query: any = {};
    if (status) {
      query.status = status;
    }

    const referrals = await Referral.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) * Number(page))
      .skip((Number(page) - 1) * Number(limit))
      .populate('referrerId', 'name email')
      .populate('refereeId', 'name email')
      .lean();

    const total = await Referral.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        referrals,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });

  } catch (error: any) {
    console.error('Get all referrals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get referrals',
      error: error.message
    });
  }
};
