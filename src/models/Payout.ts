import mongoose, { Schema, Document } from 'mongoose';

export interface IPayout extends Document {
  hostId: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  bookingReference: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  amounts: {
    totalBookingAmount: number;
    commissionAmount: number;
    gstAmount: number;
    tcsAmount: number;
    platformFeeAmount: number;
    penalties: number;
    totalDeductions: number;
    netPayout: number;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  payoutMethod: 'bank_transfer' | 'upi' | 'wallet';
  bankDetails?: {
    accountNumber: string;
    ifsc: string;
    accountHolderName: string;
    bankName: string;
  };
  upiDetails?: {
    upiId: string;
    accountHolderName: string;
  };
  transactionId?: string;
  processedAt?: Date;
  processedBy?: string;
  failureReason?: string;
  retryCount: number;
  lastRetryAt?: Date;
  notes?: string;
  // Legacy fields for backward compatibility
  amount?: number;
  platformCommission?: number;
  netAmount?: number;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
  upiId?: string;
  requestedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PayoutSchema: Schema = new Schema(
  {
    hostId: {
      type: Schema.Types.ObjectId,
      ref: 'HostSignUp',
      required: true,
      index: true
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true
    },
    bookingReference: {
      type: String,
      required: true,
      trim: true
    },
    period: {
      startDate: {
        type: Date,
        required: true
      },
      endDate: {
        type: Date,
        required: true
      }
    },
    amounts: {
      totalBookingAmount: {
        type: Number,
        required: true,
        min: 0
      },
      commissionAmount: {
        type: Number,
        required: true,
        min: 0
      },
      gstAmount: {
        type: Number,
        required: true,
        min: 0
      },
      tcsAmount: {
        type: Number,
        required: true,
        min: 0
      },
      platformFeeAmount: {
        type: Number,
        required: true,
        min: 0
      },
      penalties: {
        type: Number,
        default: 0,
        min: 0
      },
      totalDeductions: {
        type: Number,
        required: true,
        min: 0
      },
      netPayout: {
        type: Number,
        required: true,
        min: 0
      }
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      index: true
    },
    payoutMethod: {
      type: String,
      enum: ['bank_transfer', 'upi', 'wallet'],
      required: true
    },
    bankDetails: {
      accountNumber: {
        type: String,
        trim: true
      },
      ifsc: {
        type: String,
        trim: true
      },
      accountHolderName: {
        type: String,
        trim: true
      },
      bankName: {
        type: String,
        trim: true
      }
    },
    upiDetails: {
      upiId: {
        type: String,
        trim: true
      },
      accountHolderName: {
        type: String,
        trim: true
      }
    },
    transactionId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true
    },
    processedAt: {
      type: Date
    },
    processedBy: {
      type: String
    },
    failureReason: {
      type: String,
      trim: true
    },
    retryCount: {
      type: Number,
      default: 0,
      min: 0
    },
    lastRetryAt: {
      type: Date
    },
    notes: {
      type: String,
      trim: true
    },
    // Legacy fields for backward compatibility
    amount: {
      type: Number,
      min: 0
    },
    platformCommission: {
      type: Number,
      min: 0
    },
    netAmount: {
      type: Number,
      min: 0
    },
    bankName: {
      type: String,
      trim: true
    },
    accountNumber: {
      type: String,
      trim: true
    },
    ifscCode: {
      type: String,
      trim: true
    },
    accountHolderName: {
      type: String,
      trim: true
    },
    upiId: {
      type: String,
      trim: true
    },
    requestedAt: {
      type: Date
    },
    completedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Indexes for better query performance
PayoutSchema.index({ hostId: 1, status: 1 });
PayoutSchema.index({ status: 1, createdAt: -1 });
PayoutSchema.index({ period: 1 });
PayoutSchema.index({ requestedAt: -1 });
PayoutSchema.index({ status: 1, requestedAt: -1 });

export default mongoose.model<IPayout>('Payout', PayoutSchema);
