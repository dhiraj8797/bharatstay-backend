import mongoose, { Schema, Document } from 'mongoose';

export interface IDispute extends Document {
  type: 'user_complaint' | 'host_complaint' | 'booking_dispute' | 'refund_request';
  complainantId: mongoose.Types.ObjectId;
  complainantType: 'user' | 'host';
  respondentId?: mongoose.Types.ObjectId;
  respondentType?: 'user' | 'host' | 'admin';
  bookingId?: mongoose.Types.ObjectId;
  bookingReference?: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'under_review' | 'investigating' | 'resolved' | 'rejected' | 'escalated';
  evidence: {
    screenshots: string[];
    documents: string[];
    messages: Array<{
      senderId: mongoose.Types.ObjectId;
      senderType: 'user' | 'host' | 'admin';
      message: string;
      timestamp: Date;
    }>;
  };
  resolution?: {
    action: string;
    compensation?: number;
    refundAmount?: number;
    notes: string;
    resolvedBy: string;
    resolvedAt: Date;
  };
  escalation?: {
    escalatedAt: Date;
    escalatedBy: string;
    escalationReason: string;
    assignedTo: string;
  };
  timeline: Array<{
    status: string;
    description: string;
    timestamp: Date;
    updatedBy: string;
  }>;
  assignedTo?: string;
  assignedAt?: Date;
  estimatedResolutionDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DisputeSchema = new Schema<IDispute>({
  type: {
    type: String,
    enum: ['user_complaint', 'host_complaint', 'booking_dispute', 'refund_request'],
    required: true
  },
  complainantId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'complainantType'
  },
  complainantType: {
    type: String,
    enum: ['user', 'host'],
    required: true
  },
  respondentId: {
    type: Schema.Types.ObjectId,
    refPath: 'respondentType'
  },
  respondentType: {
    type: String,
    enum: ['user', 'host', 'admin']
  },
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking'
  },
  bookingReference: {
    type: String,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'under_review', 'investigating', 'resolved', 'rejected', 'escalated'],
    default: 'open'
  },
  evidence: {
    screenshots: [{
      type: String,
      trim: true
    }],
    documents: [{
      type: String,
      trim: true
    }],
    messages: [{
      senderId: {
        type: Schema.Types.ObjectId,
        required: true
      },
      senderType: {
        type: String,
        enum: ['user', 'host', 'admin'],
        required: true
      },
      message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  resolution: {
    action: {
      type: String,
      trim: true
    },
    compensation: {
      type: Number,
      min: 0
    },
    refundAmount: {
      type: Number,
      min: 0
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    resolvedBy: {
      type: String,
      trim: true
    },
    resolvedAt: {
      type: Date
    }
  },
  escalation: {
    escalatedAt: {
      type: Date
    },
    escalatedBy: {
      type: String,
      trim: true
    },
    escalationReason: {
      type: String,
      trim: true
    },
    assignedTo: {
      type: String,
      trim: true
    }
  },
  timeline: [{
    status: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: String,
      required: true,
      trim: true
    }
  }],
  assignedTo: {
    type: String,
    trim: true
  },
  assignedAt: {
    type: Date
  },
  estimatedResolutionDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
DisputeSchema.index({ status: 1, createdAt: -1 });
DisputeSchema.index({ complainantId: 1, status: 1 });
DisputeSchema.index({ type: 1, priority: 1 });
DisputeSchema.index({ assignedTo: 1, status: 1 });

export const Dispute = mongoose.model<IDispute>('Dispute', DisputeSchema);
