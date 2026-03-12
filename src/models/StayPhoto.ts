import mongoose, { Schema, Document } from 'mongoose';

export interface IStayPhoto extends Document {
  stayId: mongoose.Types.ObjectId;
  hostId: mongoose.Types.ObjectId;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: 'bedroom' | 'kitchen' | 'hall' | 'bathroom' | 'exterior' | 'amenities' | 'other';
  caption?: string;
  isPrimary: boolean;
  displayOrder: number;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

const StayPhotoSchema: Schema = new Schema(
  {
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
    },
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      enum: ['bedroom', 'kitchen', 'hall', 'bathroom', 'exterior', 'amenities', 'other'],
      default: 'other',
    },
    caption: {
      type: String,
      maxlength: 200,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    url: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
StayPhotoSchema.index({ stayId: 1, displayOrder: 1 });
StayPhotoSchema.index({ stayId: 1, category: 1 });
StayPhotoSchema.index({ hostId: 1 });

export default mongoose.model<IStayPhoto>('StayPhoto', StayPhotoSchema);
