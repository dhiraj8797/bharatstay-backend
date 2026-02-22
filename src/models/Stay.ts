import mongoose, { Schema, Document } from 'mongoose';

export interface IStay extends Document {
  hostId: mongoose.Types.ObjectId;
  stayName: string;
  stayType: 'Apartment' | 'Villa' | 'PG' | 'Homestay' | 'Hotel';
  propertyAge: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
  location: {
    latitude: number;
    longitude: number;
  };
  description: string;
  houseRules: string;
  checkInTime: string;
  checkOutTime: string;
  photos: string[];
  coverImageIndex: number;
  amenities: string[];
  pricing: {
    basePrice: number;
    weekendPrice: number;
    festivalPrice: number;
    cleaningFee: number;
    extraGuestCharge: number;
    securityDeposit: number;
    smartPricing: boolean;
  };
  capacity: {
    maxGuests: number;
    bedrooms: number;
    bathrooms: number;
    beds: number;
  };
  status: 'active' | 'inactive' | 'pending' | 'blocked';
  views: number;
  bookings: number;
  averageRating: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
}

const StaySchema: Schema = new Schema(
  {
    hostId: {
      type: Schema.Types.ObjectId,
      ref: 'HostSignUp',
      required: true,
      index: true,
    },
    stayName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    stayType: {
      type: String,
      required: true,
      enum: ['Apartment', 'Villa', 'PG', 'Homestay', 'Hotel'],
    },
    propertyAge: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    pincode: {
      type: String,
      required: true,
      match: /^[0-9]{6}$/,
    },
    location: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    houseRules: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    checkInTime: {
      type: String,
      required: true,
      default: '14:00',
    },
    checkOutTime: {
      type: String,
      required: true,
      default: '11:00',
    },
    photos: {
      type: [String],
      validate: {
        validator: function (v: string[]) {
          return v.length >= 5;
        },
        message: 'At least 5 photos are required',
      },
    },
    coverImageIndex: {
      type: Number,
      default: 0,
    },
    amenities: {
      type: [String],
      default: [],
    },
    pricing: {
      basePrice: {
        type: Number,
        required: true,
        min: 0,
      },
      weekendPrice: {
        type: Number,
        default: 0,
      },
      festivalPrice: {
        type: Number,
        default: 0,
      },
      cleaningFee: {
        type: Number,
        default: 0,
      },
      extraGuestCharge: {
        type: Number,
        default: 0,
      },
      securityDeposit: {
        type: Number,
        default: 0,
      },
      smartPricing: {
        type: Boolean,
        default: false,
      },
    },
    capacity: {
      maxGuests: {
        type: Number,
        required: true,
        min: 1,
      },
      bedrooms: {
        type: Number,
        default: 1,
      },
      bathrooms: {
        type: Number,
        default: 1,
      },
      beds: {
        type: Number,
        default: 1,
      },
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending', 'blocked'],
      default: 'pending',
    },
    views: {
      type: Number,
      default: 0,
    },
    bookings: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
StaySchema.index({ city: 1, status: 1 });
StaySchema.index({ stayType: 1, status: 1 });
StaySchema.index({ 'pricing.basePrice': 1 });
StaySchema.index({ averageRating: -1 });

export default mongoose.model<IStay>('Stay', StaySchema, 'Stays');
