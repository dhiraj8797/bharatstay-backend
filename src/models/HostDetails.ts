import mongoose, { Schema, Document } from 'mongoose';
import { getConnections } from './HostSignUp';

export interface IHostDetails extends Document {
  hostId: string;
  name?: string;
  age?: string;
  gender?: string;
  profession?: string;
  nativeLanguage?: string;
  otherLanguages?: string;
  localAreaKnowledge?: string;
  currentCityDuration?: string;
  livesOnProperty?: string;
  hostingSince?: string;
  hobbies?: string;
  emergencyContact?: string;
  instagram?: string;
  facebook?: string;
  govIdVerified?: boolean;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  profilePhoto?: string;
  description?: string;
}

const HostDetailsSchema = new Schema<IHostDetails>({
  hostId: {
    type: String,
    required: true,
    ref: 'HostSignUp' // Reference to HostSignUp model
  },
  name: {
    type: String,
    trim: true
  },
  age: {
    type: String
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  profession: {
    type: String,
    trim: true
  },
  nativeLanguage: {
    type: String,
    trim: true
  },
  otherLanguages: {
    type: String,
    trim: true
  },
  localAreaKnowledge: {
    type: String,
    trim: true
  },
  currentCityDuration: {
    type: String,
    trim: true
  },
  livesOnProperty: {
    type: String,
    enum: ['yes', 'no', 'sometimes']
  },
  hostingSince: {
    type: Number
  },
  hobbies: {
    type: String,
    trim: true
  },
  emergencyContact: {
    type: String,
    trim: true
  },
  instagram: {
    type: String,
    trim: true
  },
  facebook: {
    type: String,
    trim: true
  },
  govIdVerified: {
    type: Boolean,
    default: false
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  profilePhoto: {
    type: String
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export const HostDetails = (() => {
  const { hostDataConnection } = getConnections();
  return hostDataConnection.model<IHostDetails>("HostDetails", HostDetailsSchema, "hostdetails");
})();

export default HostDetails;
