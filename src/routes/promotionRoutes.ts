import express from 'express';
import { body } from 'express-validator';
import {
  createPromotion,
  getHostPromotions,
  getPromotionByCode,
  updatePromotion,
  togglePromotionStatus,
  deletePromotion,
  applyPromotion,
  getPromotionStats,
} from '../controllers/promotionController';

const router = express.Router();

// Promotion management
router.post(
  '/create',
  [
    body('hostId').notEmpty().withMessage('Host ID is required'),
    body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
    body('discount').isInt({ min: 1, max: 100 }).withMessage('Discount must be between 1-100'),
    body('code').trim().isLength({ min: 4, max: 20 }).withMessage('Code must be 4-20 characters'),
    body('validFrom').isISO8601().withMessage('Invalid validFrom date'),
    body('validTo').isISO8601().withMessage('Invalid validTo date'),
  ],
  createPromotion
);

router.get('/host/:hostId', getHostPromotions);
router.get('/code/:code', getPromotionByCode);
router.put('/:promotionId', updatePromotion);
router.put('/:promotionId/toggle', togglePromotionStatus);
router.delete('/:promotionId', deletePromotion);
router.post('/apply', applyPromotion);
router.get('/stats/:hostId', getPromotionStats);

export default router;
