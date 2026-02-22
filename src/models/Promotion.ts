import mongoose, { Schema, Document } from 'mongoose';

export interface IPromotion extends Document {
  hostId: mongoose.Types.ObjectId;
  stayId?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  discount: number;
  code: string;
  validFrom: Date;
  validTo: Date;
  maxUsage?: number;
  usedCount: number;
  minBookingAmount?: number;
  applicableFor: 'all' | 'specific';
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  isExpired(): boolean;
  isValid(): boolean;
}

const PromotionSchema: Schema = new Schema(
  {
    hostId: {
      type: Schema.Types.ObjectId,
      ref: 'HostSignUp',
      required: true,
      index: true,
    },
    stayId: {
      type: Schema.Types.ObjectId,
      ref: 'Stay',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    discount: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 4,
      maxlength: 20,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validTo: {
      type: Date,
      required: true,
    },
    maxUsage: {
      type: Number,
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    minBookingAmount: {
      type: Number,
      min: 0,
    },
    applicableFor: {
      type: String,
      enum: ['all', 'specific'],
      default: 'all',
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Validate dates
PromotionSchema.pre<IPromotion>('save', function (next) {
  if (this.validFrom >= this.validTo) {
    return next(new Error('Valid To date must be after Valid From date'));
  }
  next();
});

// Check if promotion is expired
PromotionSchema.methods.isExpired = function (this: IPromotion): boolean {
  return new Date() > this.validTo;
};

// Check if promotion is valid
PromotionSchema.methods.isValid = function (this: IPromotion): boolean {
  const now = new Date();
  return (
    this.active &&
    now >= this.validFrom &&
    now <= this.validTo &&
    (!this.maxUsage || this.usedCount < this.maxUsage)
  );
};

// Indexes
PromotionSchema.index({ code: 1, active: 1 });
PromotionSchema.index({ validFrom: 1, validTo: 1 });

export default mongoose.model<IPromotion>('Promotion', PromotionSchema);
