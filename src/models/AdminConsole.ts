import mongoose, { Document, Schema } from 'mongoose';

export interface IAdminConsole extends Document {
  adminId: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'moderator';
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminConsoleSchema = new Schema<IAdminConsole>({
  adminId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'moderator'],
    default: 'admin'
  },
  permissions: [{
    type: String,
    enum: [
      'manage_users',
      'manage_hosts',
      'manage_stays',
      'manage_bookings',
      'manage_reviews',
      'manage_payments',
      'view_analytics',
      'manage_settings',
      'manage_promotions',
      'manage_referrals',
      'view_reports'
    ]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
AdminConsoleSchema.index({ adminId: 1 });
AdminConsoleSchema.index({ email: 1 });
AdminConsoleSchema.index({ role: 1 });
AdminConsoleSchema.index({ isActive: 1 });

export const AdminConsole = mongoose.model<IAdminConsole>('AdminConsole', AdminConsoleSchema);
