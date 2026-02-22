import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const hostSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },
  dateOfBirth: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  pincode: {
    type: String,
    required: true
  },
  documents: {
    aadhar: {
      type: String,
      default: null
    },
    pan: {
      type: String,
      default: null
    },
    license: {
      type: String,
      default: null
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  termsAccepted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
hostSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password
hostSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Connect to HostData database
const HostDataConn = mongoose.createConnection(
  process.env.MONGODB_HOST_URI || 'mongodb+srv://username:password@cluster0.mongodb.net/HostData?retryWrites=true&w=majority'
);

export const Host = HostDataConn.model('Details_Host', hostSchema);
export default Host;
