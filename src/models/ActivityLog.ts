import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
  adminId: mongoose.Types.ObjectId;
  action: string;
  details: any;
  ipAddress?: string;
  createdAt: Date;
}

const ActivityLogSchema: Schema = new Schema(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ adminId: 1 });
ActivityLogSchema.index({ action: 1 });

export default mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
