import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  bookingId: mongoose.Types.ObjectId;
  stayId: mongoose.Types.ObjectId;
  hostId: mongoose.Types.ObjectId;
  guestId: mongoose.Types.ObjectId;
  guestName: string;
  rating: number;
  comment: string;
  helpful: number;
  hostReply?: string;
  hostReplyDate?: Date;
  reported: boolean;
  reportReason?: string;
  status: 'active' | 'hidden' | 'removed';
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema: Schema = new Schema(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,
      index: true,
    },
    stayId: {
      type: Schema.Types.ObjectId,
      ref: 'Stay',
      required: true,
      index: true,
    },
    hostId: {
      type: Schema.Types.ObjectId,
      ref: 'HostSignUp',
      required: true,
      index: true,
    },
    guestId: {
      type: Schema.Types.ObjectId,
      ref: 'UserSignUp',
      required: true,
    },
    guestName: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1000,
    },
    helpful: {
      type: Number,
      default: 0,
    },
    hostReply: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    hostReplyDate: {
      type: Date,
    },
    reported: {
      type: Boolean,
      default: false,
    },
    reportReason: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'hidden', 'removed'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Update stay's average rating after review is saved
ReviewSchema.post('save', async function () {
  const Stay = mongoose.model('Stay');
  
  const stats = await mongoose.model('Review').aggregate([
    { $match: { stayId: this.stayId, status: 'active' } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Stay.findByIdAndUpdate(this.stayId, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      totalReviews: stats[0].totalReviews,
    });
  }
});

// Indexes
ReviewSchema.index({ createdAt: -1 });
ReviewSchema.index({ rating: -1 });

export default mongoose.model<IReview>('Review', ReviewSchema);
