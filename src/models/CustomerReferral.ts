import mongoose, { Document, Schema } from 'mongoose';

// Customer Referral interface
export interface ICustomerReferral extends Document {
  referrerId: string; // User who made the referral (customer)
  refereeId?: string; // User who was referred (new customer)
  referralCode: string; // Unique referral code
  referralLink: string; // Full referral URL
  status: 'pending' | 'signed_up' | 'first_booking' | 'completed';
  referrerReward: number; // Discount percentage for referrer (15%)
  refereeReward: number; // Discount percentage for referee (20%)
  referrerRewardUsed: boolean; // Whether referrer has used their discount
  refereeRewardUsed: boolean; // Whether referee has used their discount
  referrerBookingId?: string; // Booking ID where discount was used
  refereeBookingId?: string; // Booking ID where discount was used
  createdAt: Date;
  signedUpAt?: Date;
  completedAt?: Date;
  metadata: {
    refereeEmail?: string;
    refereePhone?: string;
    signupSource?: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

// Customer Referral schema
const CustomerReferralSchema = new Schema<ICustomerReferral>({
  referrerId: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  },
  refereeId: {
    type: String,
    ref: 'User',
    index: true,
    default: null
  },
  referralCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  referralLink: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'signed_up', 'first_booking', 'completed'],
    default: 'pending',
    index: true
  },
  referrerReward: {
    type: Number,
    default: 15 // 15% discount for referrer
  },
  refereeReward: {
    type: Number,
    default: 20 // 20% discount for referee
  },
  referrerRewardUsed: {
    type: Boolean,
    default: false
  },
  refereeRewardUsed: {
    type: Boolean,
    default: false
  },
  referrerBookingId: {
    type: String,
    default: null
  },
  refereeBookingId: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  signedUpAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  metadata: {
    refereeEmail: String,
    refereePhone: String,
    signupSource: String,
    ipAddress: String,
    userAgent: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
CustomerReferralSchema.index({ referrerId: 1, status: 1 });
CustomerReferralSchema.index({ referralCode: 1 });
CustomerReferralSchema.index({ createdAt: -1 });

// Static method to generate unique customer referral code
CustomerReferralSchema.statics.generateCustomerReferralCode = async function(userId: string): Promise<string> {
  let code = '';
  let isUnique = false;
  let attempts = 0;
  
  while (!isUnique && attempts < 10) {
    // Generate code: CUST + last 6 chars of userId + 2 random chars
    const randomSuffix = Math.random().toString(36).substr(2, 2).toUpperCase();
    code = `CUST${userId.slice(-6).toUpperCase()}${randomSuffix}`;
    
    const existing = await this.findOne({ referralCode: code });
    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }
  
  if (!isUnique) {
    throw new Error('Failed to generate unique customer referral code after multiple attempts');
  }
  
  return code;
};

// Static method to create customer referral for a user
CustomerReferralSchema.statics.createCustomerReferral = async function(userId: string) {
  const referralCode = await this.generateCustomerReferralCode(userId);
  const referralLink = `https://bharat-stay.com/user-signup?ref=${referralCode}`;
  
  return await this.create({
    referrerId: userId,
    referralCode,
    referralLink
  });
};

// Static method to track customer signup
CustomerReferralSchema.statics.trackCustomerSignup = async function(referralCode: string, refereeData: {
  userId: string;
  email: string;
  phone?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const referral = await this.findOne({ 
    referralCode, 
    status: 'pending' 
  });
  
  if (!referral) {
    return null;
  }
  
  // Update referral with signup information
  referral.refereeId = refereeData.userId;
  referral.status = 'signed_up';
  referral.signedUpAt = new Date();
  referral.metadata = {
    ...referral.metadata,
    refereeEmail: refereeData.email,
    refereePhone: refereeData.phone,
    ipAddress: refereeData.ipAddress,
    userAgent: refereeData.userAgent,
    signupSource: 'customer_referral_link'
  };
  
  await referral.save();
  return referral;
};

// Static method to track customer first booking
CustomerReferralSchema.statics.trackCustomerFirstBooking = async function(refereeId: string, bookingId: string) {
  const referral = await this.findOne({ 
    refereeId, 
    status: 'signed_up' 
  });
  
  if (!referral) {
    return null;
  }
  
  referral.status = 'first_booking';
  referral.completedAt = new Date();
  referral.refereeBookingId = bookingId;
  referral.refereeRewardUsed = true; // Auto-apply 20% discount on first booking
  
  await referral.save();
  
  return referral;
};

// Static method to apply referrer discount
CustomerReferralSchema.statics.applyReferrerDiscount = async function(referrerId: string, bookingId: string) {
  const referral = await this.findOne({ 
    referrerId, 
    status: 'first_booking' // Must have completed a referral first
  });
  
  if (!referral || referral.referrerRewardUsed) {
    return null;
  }
  
  referral.referrerRewardUsed = true;
  referral.referrerBookingId = bookingId;
  referral.status = 'completed';
  
  await referral.save();
  
  return referral;
};

// Static method to get customer referral stats for a user
CustomerReferralSchema.statics.getCustomerReferralStats = async function(userId: string) {
  const stats = await this.aggregate([
    { $match: { referrerId: userId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRewards: { $sum: '$referrerReward' }
      }
    }
  ]);
  
  const result = {
    totalReferrals: 0,
    pendingReferrals: 0,
    signedUpReferrals: 0,
    completedReferrals: 0,
    availableDiscount: 0,
    usedDiscounts: 0
  };
  
  stats.forEach(stat => {
    result.totalReferrals += stat.count;
    
    switch (stat._id) {
      case 'pending':
        result.pendingReferrals = stat.count;
        break;
      case 'signed_up':
        result.signedUpReferrals = stat.count;
        break;
      case 'first_booking':
      case 'completed':
        result.completedReferrals += stat.count;
        result.availableDiscount = stat.count * 15; // 15% per completed referral
        break;
    }
  });
  
  return result;
};

// Static method to get recent customer referrals
CustomerReferralSchema.statics.getRecentCustomerReferrals = async function(userId: string, limit = 10) {
  return await this.find({ referrerId: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('refereeId', 'name email')
    .lean();
};

// Static method to check if user can refer (has completed booking)
CustomerReferralSchema.statics.canUserRefer = async function(userId: string) {
  // Check if user has completed at least one booking
  // This would integrate with your booking system
  // For now, we'll assume a user can refer if they have any bookings
  try {
    // This would be replaced with actual booking check
    const bookingData = await mongoose.connection.db.collection('bookings')
      .findOne({ 
        userId: userId, 
        status: 'completed' 
      });
    
    return !!bookingData;
  } catch (error) {
    console.error('Error checking user eligibility:', error);
    return false;
  }
};

// Static method to get user's referral discount availability
CustomerReferralSchema.statics.getUserDiscountAvailability = async function(userId: string) {
  const referrals = await this.find({
    referrerId: userId,
    status: 'first_booking'
  });
  
  return {
    availableDiscounts: referrals.filter(r => !r.referrerRewardUsed).length,
    discountPercentage: 15,
    totalReferralsCompleted: referrals.length
  };
};

const CustomerReferral = mongoose.model<ICustomerReferral>('CustomerReferral', CustomerReferralSchema);
export default CustomerReferral;
