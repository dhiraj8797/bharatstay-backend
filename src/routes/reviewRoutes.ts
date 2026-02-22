import express from 'express';
import {
  getHostReviews,
  replyToReview,
  reportReview,
  getReviewStats,
} from '../controllers/reviewController';

const router = express.Router();

// Review management
router.get('/host/:hostId', getHostReviews);
router.post('/:reviewId/reply', replyToReview);
router.post('/:reviewId/report', reportReview);
router.get('/stats/:hostId', getReviewStats);

export default router;
