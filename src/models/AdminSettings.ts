import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminSettings extends Document {
  // Commission Settings
  commissionRate: number;
  commissionType: 'percentage' | 'fixed';
  fixedCommissionAmount?: number;
  commissionOnCleaningFee: boolean;
  commissionOnExtraGuests: boolean;
  
  // GST Settings
  gstEnabled: boolean;
  gstRate: number;
  gstNumber: string;
  gstOnCommission: boolean;
  gstInclusive: boolean;
  
  // TCS Settings
  tcsEnabled: boolean;
  tcsRate: number;
  tcsThreshold: number;
  
  // Platform Fee Settings
  platformFeeEnabled: boolean;
  platformFeeRate: number;
  platformFeeType: 'percentage' | 'fixed';
  fixedPlatformFee?: number;
  
  // Payment Gateway Settings
  paymentGateway: {
    razorpayKeyId: string;
    razorpayKeySecret: string;
    stripePublicKey: string;
    stripeSecretKey: string;
    paypalClientId: string;
    paypalClientSecret: string;
  };
  
  // Cancellation Settings
  cancellationPolicy: {
    strictCancellationEnabled: boolean;
    freeCancellationHours: number;
    cancellationPenaltyRate: number;
    hostPenaltyRate: number;
    guestRefundRate: number;
  };
  
  // Auto-confirm Settings
  autoConfirmEnabled: boolean;
  autoConfirmHours: number;
  
  // Refund Settings
  refundWindow: number; // hours
  autoRefundEnabled: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

const AdminSettingsSchema = new Schema<IAdminSettings>({
  // Commission Settings
  commissionRate: {
    type: Number,
    default: 10,
    min: 0,
    max: 50
  },
  commissionType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  fixedCommissionAmount: {
    type: Number,
    min: 0
  },
  commissionOnCleaningFee: {
    type: Boolean,
    default: true
  },
  commissionOnExtraGuests: {
    type: Boolean,
    default: true
  },
  
  // GST Settings
  gstEnabled: {
    type: Boolean,
    default: false
  },
  gstRate: {
    type: Number,
    default: 18,
    min: 0,
    max: 30
  },
  gstNumber: {
    type: String,
    trim: true
  },
  gstOnCommission: {
    type: Boolean,
    default: false
  },
  gstInclusive: {
    type: Boolean,
    default: true
  },
  
  // TCS Settings
  tcsEnabled: {
    type: Boolean,
    default: false
  },
  tcsRate: {
    type: Number,
    default: 1,
    min: 0,
    max: 10
  },
  tcsThreshold: {
    type: Number,
    default: 7000, // INR 7000 per Indian tax rules
    min: 0
  },
  
  // Platform Fee Settings
  platformFeeEnabled: {
    type: Boolean,
    default: false
  },
  platformFeeRate: {
    type: Number,
    default: 2,
    min: 0,
    max: 20
  },
  platformFeeType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  fixedPlatformFee: {
    type: Number,
    min: 0
  },
  
  // Payment Gateway Settings
  paymentGateway: {
    razorpayKeyId: {
      type: String,
      default: ''
    },
    razorpayKeySecret: {
      type: String,
      default: ''
    },
    stripePublicKey: {
      type: String,
      default: ''
    },
    stripeSecretKey: {
      type: String,
      default: ''
    },
    paypalClientId: {
      type: String,
      default: ''
    },
    paypalClientSecret: {
      type: String,
      default: ''
    }
  },
  
  // Cancellation Settings
  cancellationPolicy: {
    strictCancellationEnabled: {
      type: Boolean,
      default: false
    },
    freeCancellationHours: {
      type: Number,
      default: 24,
      min: 0
    },
    cancellationPenaltyRate: {
      type: Number,
      default: 10,
      min: 0,
      max: 100
    },
    hostPenaltyRate: {
      type: Number,
      default: 5,
      min: 0,
      max: 100
    },
    guestRefundRate: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    }
  },
  
  // Auto-confirm Settings
  autoConfirmEnabled: {
    type: Boolean,
    default: false
  },
  autoConfirmHours: {
    type: Number,
    default: 24,
    min: 1
  },
  
  // Refund Settings
  refundWindow: {
    type: Number,
    default: 72, // hours
    min: 0
  },
  autoRefundEnabled: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export const AdminSettings = mongoose.model<IAdminSettings>('AdminSettings', AdminSettingsSchema);
