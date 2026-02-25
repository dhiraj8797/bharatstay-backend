import { Request, Response } from 'express';
import CustomerReferral from '../models/CustomerReferral';

// Get or create customer referral for a user
export const getCustomerReferral = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Check if user can refer (has completed booking)
    const canRefer = await (CustomerReferral as any).canUserRefer(userId);
    
    if (!canRefer) {
      return res.status(403).json({
        success: false,
        message: 'You need to complete at least one booking before you can refer friends',
        canRefer: false
      });
    }

    // Check if user already has a referral code
    let referral = await CustomerReferral.findOne({ referrerId: userId });
    
    if (!referral) {
      // Create new referral for this user
      referral = await (CustomerReferral as any).createCustomerReferral(userId);
    }

    if (referral) {
      // Get user's discount availability
      const discountInfo = await (CustomerReferral as any).getUserDiscountAvailability(userId);

      return res.status(200).json({
        success: true,
        data: {
          referralCode: referral.referralCode,
          referralLink: referral.referralLink,
          status: referral.status,
          canRefer: true,
          discountInfo
        }
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create referral'
    });

  } catch (error: any) {
    console.error('Get customer referral error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get referral information',
      error: error.message
    });
  }
};

// Check if user can refer
export const checkReferralEligibility = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const canRefer = await (CustomerReferral as any).canUserRefer(userId);
    const discountInfo = canRefer ? await (CustomerReferral as any).getUserDiscountAvailability(userId) : null;

    return res.status(200).json({
      success: true,
      data: {
        canRefer,
        discountInfo,
        message: canRefer 
          ? 'You can refer friends and earn discounts!' 
          : 'Complete your first booking to unlock referral benefits'
      }
    });

  } catch (error: any) {
    console.error('Check referral eligibility error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check eligibility',
      error: error.message
    });
  }
};

// Get customer referral stats
export const getCustomerReferralStats = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const stats = await (CustomerReferral as any).getCustomerReferralStats(userId);
    const recentReferrals = await (CustomerReferral as any).getRecentCustomerReferrals(userId, 5);
    const canRefer = await (CustomerReferral as any).canUserRefer(userId);

    return res.status(200).json({
      success: true,
      data: {
        stats,
        recentReferrals,
        canRefer
      }
    });

  } catch (error: any) {
    console.error('Get customer referral stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get referral stats',
      error: error.message
    });
  }
};

// Track customer referral signup
export const trackCustomerReferralSignup = async (req: Request, res: Response): Promise<Response> => {
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

    const referral = await (CustomerReferral as any).trackCustomerSignup(referralCode, {
      userId,
      email,
      phone,
      ipAddress,
      userAgent
    });

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
        refereeDiscount: referral.refereeReward, // 20%
        message: 'You got 20% off your first booking!'
      }
    });

  } catch (error: any) {
    console.error('Track customer referral signup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to track referral signup',
      error: error.message
    });
  }
};

// Track customer first booking (apply 20% discount)
export const trackCustomerFirstBooking = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId, bookingId } = req.body;

    if (!userId || !bookingId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and booking ID are required'
      });
    }

    const referral = await (CustomerReferral as any).trackCustomerFirstBooking(userId, bookingId);

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'No pending referral found for this user'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'First booking tracked successfully - 20% discount applied',
      data: {
        referralId: referral._id,
        referrerId: referral.referrerId,
        discountApplied: 20,
        bookingId: referral.refereeBookingId,
        status: referral.status
      }
    });

  } catch (error: any) {
    console.error('Track customer first booking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to track first booking',
      error: error.message
    });
  }
};

// Apply referrer discount (15% off next booking)
export const applyReferrerDiscount = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId, bookingId } = req.body;

    if (!userId || !bookingId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and booking ID are required'
      });
    }

    const referral = await (CustomerReferral as any).applyReferrerDiscount(userId, bookingId);

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'No available discount found. Complete more referrals to earn discounts.'
      });
    }

    return res.status(200).json({
      success: true,
      message: '15% discount applied successfully',
      data: {
        referralId: referral._id,
        discountApplied: 15,
        bookingId: referral.referrerBookingId,
        status: referral.status
      }
    });

  } catch (error: any) {
    console.error('Apply referrer discount error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to apply discount',
      error: error.message
    });
  }
};

// Validate customer referral code
export const validateCustomerReferralCode = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { referralCode } = req.params;

    if (!referralCode) {
      return res.status(400).json({
        success: false,
        message: 'Referral code is required'
      });
    }

    const referral = await CustomerReferral.findOne({ 
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
        refereeDiscount: referral.refereeReward, // 20%
        message: 'Get 20% off your first booking!'
      }
    });

  } catch (error: any) {
    console.error('Validate customer referral code error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to validate referral code',
      error: error.message
    });
  }
};

// Get all customer referrals for admin
export const getAllCustomerReferrals = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    const query: any = {};
    if (status) {
      query.status = status;
    }

    const referrals = await CustomerReferral.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) * Number(page))
      .skip((Number(page) - 1) * Number(limit))
      .populate('referrerId', 'name email')
      .populate('refereeId', 'name email')
      .lean();

    const total = await CustomerReferral.countDocuments(query);

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
    console.error('Get all customer referrals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get referrals',
      error: error.message
    });
  }
};
