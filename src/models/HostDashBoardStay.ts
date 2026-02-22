import mongoose, { Schema, Document } from 'mongoose';

export interface IHostDashBoardStay extends Document {
  hostId: mongoose.Types.ObjectId;
  stayName: string;
  stayType: string;
  propertyAge: number;
  numberOfRooms: number;
  currentLocation?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  description?: string;
  nearbyAttractions?: string;
  houseRules?: string;
  checkInTime?: string;
  checkOutTime?: string;
  allowPets: boolean;
  photos: string[];
  amenities: string[];
  offerCloakRoom: boolean;
  cloakRoomPrice?: number;
  cloakRoomMaxHrs?: number;
  cloakRoomExtraCharge?: number;
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}

const HostDashBoardStaySchema: Schema = new Schema(
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
      enum: ['Apartment', 'Villa', 'PG', 'Homestay', 'Hotel', 'Resort', 'Guest House'],
    },
    propertyAge: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    numberOfRooms: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
      default: 1,
    },
    currentLocation: {
      type: String,
      trim: true,
      default: '',
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
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    nearbyAttractions: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    houseRules: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    checkInTime: {
      type: String,
      default: '14:00',
    },
    checkOutTime: {
      type: String,
      default: '11:00',
    },
    allowPets: {
      type: Boolean,
      default: false,
    },
    photos: {
      type: [String],
      default: [],
    },
    amenities: {
      type: [String],
      default: [],
    },
    offerCloakRoom: {
      type: Boolean,
      default: false,
    },
    cloakRoomPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    cloakRoomMaxHrs: {
      type: Number,
      min: 1,
      default: 24,
    },
    cloakRoomExtraCharge: {
      type: Number,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    collection: 'HostDashBoardStay',
  }
);

// Indexes for better query performance
HostDashBoardStaySchema.index({ hostId: 1, status: 1 });
HostDashBoardStaySchema.index({ city: 1, status: 1 });
HostDashBoardStaySchema.index({ stayType: 1 });

export default mongoose.model<IHostDashBoardStay>('HostDashBoardStay', HostDashBoardStaySchema);
