import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
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
  termsAccepted: {
    type: Boolean,
    default: false
  },
  // Admin management fields
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedAt: {
    type: Date
  },
  blockedBy: {
    type: String
  },
  blockReason: {
    type: String,
    trim: true
  },
  unblockedAt: {
    type: Date
  },
  unblockedBy: {
    type: String
  },
  fraudFlags: {
    suspiciousActivity: {
      type: Boolean,
      default: false
    },
    multipleAccounts: {
      type: Boolean,
      default: false
    },
    fakeDocuments: {
      type: Boolean,
      default: false
    },
    paymentIssues: {
      type: Boolean,
      default: false
    },
    unusualBookingPattern: {
      type: Boolean,
      default: false
    },
    lastFlaggedAt: {
      type: Date
    },
    flaggedBy: {
      type: String
    },
    flagReason: {
      type: String,
      trim: true
    }
  },
  riskScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  verificationStatus: {
    type: String,
    enum: ['unverified', 'verified', 'rejected'],
    default: 'unverified'
  },
  verifiedAt: {
    type: Date
  },
  verifiedBy: {
    type: String
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
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
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Connect to UserData database
const UserDataConn = mongoose.createConnection(
  process.env.MONGODB_USER_URI || 'mongodb+srv://username:password@cluster0.mongodb.net/UserData?retryWrites=true&w=majority'
);

export const User = UserDataConn.model('Details_User', userSchema);
export default User;
