import mongoose, { Schema, Document } from 'mongoose';

export interface IPayout extends Document {
  hostId: mongoose.Types.ObjectId;
  amount: number;
  platformCommission: number;
  netAmount: number;
  payoutMethod: 'bank' | 'upi';
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
  };
  upiId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transactionId?: string;
  failureReason?: string;
  requestedAt: Date;
  processedAt?: Date;
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
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    platformCommission: {
      type: Number,
      required: true,
      min: 0,
    },
    netAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    payoutMethod: {
      type: String,
      enum: ['bank', 'upi'],
      required: true,
    },
    bankDetails: {
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      accountHolderName: String,
    },
    upiId: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    transactionId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    failureReason: {
      type: String,
      trim: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
PayoutSchema.index({ requestedAt: -1 });
PayoutSchema.index({ status: 1, requestedAt: -1 });

export default mongoose.model<IPayout>('Payout', PayoutSchema);
