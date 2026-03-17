import mongoose, { Schema, Document } from 'mongoose';

export interface IBlockedDate extends Document {
  stayId: mongoose.Types.ObjectId;
  hostId: mongoose.Types.ObjectId;
  date: Date;
  reason?: string;
  createdAt: Date;
}

const BlockedDateSchema: Schema = new Schema({
  stayId: {
    type: Schema.Types.ObjectId,
    ref: 'HostDashBoardStay',
    required: true,
    index: true,
  },
  hostId: {
    type: Schema.Types.ObjectId,
    ref: 'HostSignUp',
    required: true,
    index: true,
  },
  date: {
    type: Date,
    required: true,
    index: true,
  },
  reason: {
    type: String,
    trim: true,
    maxlength: 200,
  },
}, {
  timestamps: true,
});

// Compound index for unique stay-date combinations
BlockedDateSchema.index({ stayId: 1, date: 1 }, { unique: true });

export default mongoose.model<IBlockedDate>('BlockedDate', BlockedDateSchema);
