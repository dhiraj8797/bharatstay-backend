import { Request, Response } from 'express';
import Review from '../models/Review';

// Get all reviews for a host
export const getHostReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.params.hostId;

    const reviews = await Review.find({ hostId, status: 'active' })
      .populate('stayId', 'stayName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error: any) {
    console.error('Get host reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message,
    });
    return;
  }
};

// Reply to a review
export const replyToReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const reviewId = req.params.reviewId;
    const { hostReply } = req.body;

    if (!hostReply || hostReply.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Reply text is required',
      });
      return;
    }

    const review = await Review.findByIdAndUpdate(
      reviewId,
      {
        hostReply,
        hostReplyDate: new Date(),
      },
      { new: true }
    );

    if (!review) {
      res.status(404).json({
        success: false,
        message: 'Review not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Reply posted successfully',
      data: review,
    });
  } catch (error: any) {
    console.error('Reply to review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to post reply',
      error: error.message,
    });
    return;
  }
};

// Report a review
export const reportReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const reviewId = req.params.reviewId;
    const { reportReason } = req.body;

    if (!reportReason || reportReason.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Report reason is required',
      });
      return;
    }

    const review = await Review.findByIdAndUpdate(
      reviewId,
      {
        reported: true,
        reportReason,
      },
      { new: true }
    );

    if (!review) {
      res.status(404).json({
        success: false,
        message: 'Review not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Review reported successfully',
      data: review,
    });
  } catch (error: any) {
    console.error('Report review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to report review',
      error: error.message,
    });
    return;
  }
};

// Get review statistics
export const getReviewStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.params.hostId;

    const stats = await Review.aggregate([
      { $match: { hostId: new mongoose.Types.ObjectId(hostId), status: 'active' } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    const totalReviews = await Review.countDocuments({ hostId, status: 'active' });
    
    const avgRating = await Review.aggregate([
      { $match: { hostId: new mongoose.Types.ObjectId(hostId), status: 'active' } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
        },
      },
    ]);

    const positiveReviews = await Review.countDocuments({
      hostId,
      status: 'active',
      rating: { $gte: 4 },
    });

    const neutralReviews = await Review.countDocuments({
      hostId,
      status: 'active',
      rating: 3,
    });

    const negativeReviews = await Review.countDocuments({
      hostId,
      status: 'active',
      rating: { $lte: 2 },
    });

    res.status(200).json({
      success: true,
      data: {
        totalReviews,
        averageRating: avgRating.length > 0 ? Math.round(avgRating[0].averageRating * 10) / 10 : 0,
        ratingDistribution: stats,
        positiveReviews,
        neutralReviews,
        negativeReviews,
      },
    });
  } catch (error: any) {
    console.error('Get review stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review statistics',
      error: error.message,
    });
    return;
  }
};

import mongoose from 'mongoose';
