import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  bookingId: mongoose.Types.ObjectId;
  stayId: mongoose.Types.ObjectId;
  hostId: mongoose.Types.ObjectId;
  guestId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
  paymentMethod: 'credit_card' | 'debit_card' | 'upi' | 'netbanking' | 'wallet' | 'cash';
  transactionId?: string;
  gatewayResponse?: any;
  paidAt?: Date;
  refundAmount?: number;
  refundReason?: string;
  refundStatus?: 'pending' | 'processed' | 'failed';
  refundedAt?: Date;
  commissionAmount: number;
  hostPayoutAmount: number;
  hostPayoutStatus: 'pending' | 'processed' | 'failed';
  hostPayoutDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    stayId: {
      type: Schema.Types.ObjectId,
      ref: 'HostDashBoardStay',
      required: true,
      index: true,
    },
    hostId: {
      type: Schema.Types.ObjectId,
      ref: 'HostSignUp',
      required: true,
      index: true,
    },
    guestId: {
      type: Schema.Types.ObjectId,
      ref: 'UserSignUp',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded', 'partially_refunded'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'debit_card', 'upi', 'netbanking', 'wallet', 'cash'],
      required: true,
    },
    transactionId: {
      type: String,
      sparse: true,
    },
    gatewayResponse: {
      type: Schema.Types.Mixed,
    },
    paidAt: {
      type: Date,
    },
    // Refund fields
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundReason: {
      type: String,
      trim: true,
    },
    refundStatus: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
      default: 'pending',
    },
    refundedAt: {
      type: Date,
    },
    // Commission and payout fields
    commissionAmount: {
      type: Number,
      default: 0,
    },
    hostPayoutAmount: {
      type: Number,
      default: 0,
    },
    hostPayoutStatus: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
      default: 'pending',
    },
    hostPayoutDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
PaymentSchema.index({ status: 1, createdAt: -1 });
PaymentSchema.index({ hostId: 1, status: 1 });
PaymentSchema.index({ guestId: 1, status: 1 });
PaymentSchema.index({ createdAt: -1 });

export default mongoose.model<IPayment>('Payment', PaymentSchema);
