import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  stayId: mongoose.Types.ObjectId;
  hostId: mongoose.Types.ObjectId;
  guestId: mongoose.Types.ObjectId;
  bookingReference: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  nights: number;
  pricing: {
    baseAmount: number;
    cleaningFee: number;
    extraGuestCharge: number;
    discount: number;
    totalAmount: number;
  };
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  bookingStatus: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  cancellationReason?: string;
  cancellationDate?: Date;
  specialRequests?: string;
  guestDetails: {
    name: string;
    email: string;
    phone: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema: Schema = new Schema(
  {
    stayId: {
      type: Schema.Types.ObjectId,
      ref: 'Stay',
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
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: {
      type: Date,
      required: true,
    },
    guests: {
      type: Number,
      required: true,
      min: 1,
    },
    nights: {
      type: Number,
      required: true,
      min: 1,
    },
    pricing: {
      baseAmount: {
        type: Number,
        required: true,
        min: 0,
      },
      cleaningFee: {
        type: Number,
        default: 0,
      },
      extraGuestCharge: {
        type: Number,
        default: 0,
      },
      discount: {
        type: Number,
        default: 0,
      },
      totalAmount: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'failed'],
      default: 'pending',
      index: true,
    },
    bookingStatus: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
      index: true,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    cancellationDate: {
      type: Date,
    },
    specialRequests: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    guestDetails: {
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Generate booking reference before saving
BookingSchema.pre('save', async function (next) {
  if (!this.bookingReference) {
    this.bookingReference = `BH${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

// Indexes for better query performance
BookingSchema.index({ checkIn: 1, checkOut: 1 });
BookingSchema.index({ createdAt: -1 });

export default mongoose.model<IBooking>('Booking', BookingSchema);
