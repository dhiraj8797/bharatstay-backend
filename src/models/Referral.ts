import mongoose, { Document, Schema } from 'mongoose';

// Referral interface
export interface IReferral extends Document {
  referrerId: string;
  refereeId?: string;
  referralCode: string;
  referralLink: string;
  status: 'pending' | 'signed_up' | 'first_booking' | 'completed';
  rewardAmount: number;
  rewardPaid: boolean;
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

// Referral schema
const ReferralSchema = new Schema<IReferral>({
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
  rewardAmount: {
    type: Number,
    default: 500
  },
  rewardPaid: {
    type: Boolean,
    default: false
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
ReferralSchema.index({ referrerId: 1, status: 1 });
ReferralSchema.index({ referralCode: 1 });
ReferralSchema.index({ createdAt: -1 });

// Static method to generate unique referral code
ReferralSchema.statics.generateReferralCode = async function(userId: string): Promise<string> {
  let code = '';
  let isUnique = false;
  let attempts = 0;
  
  while (!isUnique && attempts < 10) {
    const randomSuffix = Math.random().toString(36).substr(2, 2).toUpperCase();
    code = `BHARAT${userId.slice(-6).toUpperCase()}${randomSuffix}`;
    
    const existing = await this.findOne({ referralCode: code });
    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }
  
  if (!isUnique) {
    throw new Error('Failed to generate unique referral code after multiple attempts');
  }
  
  return code;
};

// Static method to create referral for a user
ReferralSchema.statics.createReferral = async function(userId: string) {
  const referralCode = await (this as any).generateReferralCode(userId);
  const referralLink = `https://bharat-stay.com/user-signup?ref=${referralCode}`;
  
  return await this.create({
    referrerId: userId,
    referralCode,
    referralLink
  });
};

// Static method to track signup
ReferralSchema.statics.trackSignup = async function(referralCode: string, refereeData: {
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
  
  referral.refereeId = refereeData.userId;
  referral.status = 'signed_up';
  referral.signedUpAt = new Date();
  referral.metadata = {
    ...referral.metadata,
    refereeEmail: refereeData.email,
    refereePhone: refereeData.phone,
    ipAddress: refereeData.ipAddress,
    userAgent: refereeData.userAgent,
    signupSource: 'referral_link'
  };
  
  await referral.save();
  return referral;
};

// Static method to track first booking
ReferralSchema.statics.trackFirstBooking = async function(refereeId: string) {
  const referral = await this.findOne({ 
    refereeId, 
    status: 'signed_up' 
  });
  
  if (!referral) {
    return null;
  }
  
  referral.status = 'first_booking';
  referral.completedAt = new Date();
  await referral.save();
  
  return referral;
};

// Static method to get referral stats for a user
ReferralSchema.statics.getReferralStats = async function(userId: string) {
  const stats = await this.aggregate([
    { $match: { referrerId: userId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRewards: { $sum: '$rewardAmount' }
      }
    }
  ]);
  
  const result = {
    totalReferrals: 0,
    pendingReferrals: 0,
    signedUpReferrals: 0,
    completedReferrals: 0,
    totalEarnings: 0,
    pendingEarnings: 0
  };
  
  stats.forEach(stat => {
    result.totalReferrals += stat.count;
    
    switch (stat._id) {
      case 'pending':
        result.pendingReferrals = stat.count;
        break;
      case 'signed_up':
        result.signedUpReferrals = stat.count;
        result.pendingEarnings += stat.totalRewards;
        break;
      case 'first_booking':
      case 'completed':
        result.completedReferrals += stat.count;
        result.totalEarnings += stat.totalRewards;
        break;
    }
  });
  
  return result;
};

// Static method to get recent referrals
ReferralSchema.statics.getRecentReferrals = async function(userId: string, limit = 10) {
  return await this.find({ referrerId: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('refereeId', 'name email')
    .lean();
};

const Referral = mongoose.model<IReferral>('Referral', ReferralSchema);
export default Referral;
