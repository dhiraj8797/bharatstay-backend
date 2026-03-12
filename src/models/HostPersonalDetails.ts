import mongoose, { Schema, Document } from 'mongoose';

export interface IHostPersonalDetails extends Document {
  hostId: mongoose.Types.ObjectId;
  profilePhoto?: string;
  fullName: string;
  profession: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  nativeLanguage: string;
  otherLanguages?: string[];
  localAreaKnowledge?: string;
  city?: string;
  state?: string;
  country?: string;
  bio?: string;
  phoneNumber?: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HostPersonalDetailsSchema: Schema = new Schema({
  hostId: {
    type: Schema.Types.ObjectId,
    ref: 'HostSignUp',
    required: true,
    unique: true,
    index: true
  },
  profilePhoto: {
    type: String,
    default: null
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  profession: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 18,
    max: 120
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  nativeLanguage: {
    type: String,
    required: true,
    trim: true
  },
  otherLanguages: [{
    type: String,
    trim: true
  }],
  localAreaKnowledge: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true,
    default: 'India'
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 500
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IHostPersonalDetails>('HostPersonalDetails', HostPersonalDetailsSchema);
