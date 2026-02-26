import mongoose, { Schema, Document } from 'mongoose';

export interface IContent extends Document {
  type: 'banner' | 'faq' | 'featured_city' | 'blog_post' | 'term' | 'policy' | 'announcement';
  title: string;
  content?: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  order: number;
  isActive: boolean;
  category?: string;
  author?: string;
  publishedAt?: Date;
  expiresAt?: Date;
  tags?: string[];
  metadata?: {
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ContentSchema = new Schema<IContent>({
  type: {
    type: String,
    enum: ['banner', 'faq', 'featured_city', 'blog_post', 'term', 'policy', 'announcement'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    trim: true,
    maxlength: 5000
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  imageUrl: {
    type: String,
    trim: true
  },
  linkUrl: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    trim: true
  },
  author: {
    type: String,
    trim: true
  },
  publishedAt: {
    type: Date
  },
  expiresAt: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  metadata: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for better query performance
ContentSchema.index({ type: 1, isActive: 1, order: 1 });
ContentSchema.index({ category: 1, isActive: 1 });
ContentSchema.index({ tags: 1 });
ContentSchema.index({ publishedAt: -1 });
ContentSchema.index({ expiresAt: 1 });

export const Content = mongoose.model<IContent>('Content', ContentSchema);
