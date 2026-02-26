import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllContent,
  getContentById,
  createContent,
  updateContent,
  deleteContent,
  getContentByType,
  reorderContent,
  getFeaturedCities,
  getActiveBanners,
  getFAQItems,
  getBlogPosts,
  getTermsAndPolicies
} from '../controllers/adminContentController';

const router = Router();

// Validation middleware
const createContentValidation = [
  body('type')
    .isIn(['banner', 'faq', 'featured_city', 'blog_post', 'term', 'policy', 'announcement'])
    .withMessage('Type must be one of: banner, faq, featured_city, blog_post, term, policy, announcement'),
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isString()
    .withMessage('Title must be a string')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('content')
    .optional()
    .isString()
    .withMessage('Content must be a string')
    .isLength({ max: 5000 })
    .withMessage('Content must not exceed 5000 characters'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  body('linkUrl')
    .optional()
    .isURL()
    .withMessage('Link URL must be a valid URL'),
  body('category')
    .optional()
    .isString()
    .withMessage('Category must be a string'),
  body('author')
    .optional()
    .isString()
    .withMessage('Author must be a string'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Active status must be a boolean'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer')
];

const updateContentValidation = [
  body('type')
    .optional()
    .isIn(['banner', 'faq', 'featured_city', 'blog_post', 'term', 'policy', 'announcement'])
    .withMessage('Type must be one of: banner, faq, featured_city, blog_post, term, policy, announcement'),
  body('title')
    .optional()
    .isString()
    .withMessage('Title must be a string')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('content')
    .optional()
    .isString()
    .withMessage('Content must be a string')
    .isLength({ max: 5000 })
    .withMessage('Content must not exceed 5000 characters'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  body('linkUrl')
    .optional()
    .isURL()
    .withMessage('Link URL must be a valid URL'),
  body('category')
    .optional()
    .isString()
    .withMessage('Category must be a string'),
  body('author')
    .optional()
    .isString()
    .withMessage('Author must be a string'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Active status must be a boolean'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer'),
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Expires at must be a valid date')
];

const reorderValidation = [
  body('contentOrders')
    .isArray()
    .withMessage('Content orders must be an array'),
  body('contentOrders.*.id')
    .notEmpty()
    .withMessage('Each item must have an ID'),
  body('contentOrders.*.order')
    .isInt({ min: 0 })
    .withMessage('Each order must be a non-negative integer')
];

// Content Management endpoints

// GET /api/admin-content-management - Get all content with filters
router.get('/', getAllContent);

// GET /api/admin-content-management/featured-cities - Get featured cities
router.get('/featured-cities', getFeaturedCities);

// GET /api/admin-content-management/active-banners - Get active banners
router.get('/active-banners', getActiveBanners);

// GET /api/admin-content-management/faq - Get FAQ items
router.get('/faq', getFAQItems);

// GET /api/admin-content-management/blog-posts - Get blog posts
router.get('/blog-posts', getBlogPosts);

// GET /api/admin-content-management/terms/:type - Get terms and policies
router.get('/terms/:type', getTermsAndPolicies);

// GET /api/admin-content-management/type/:type - Get content by type
router.get('/type/:type', getContentByType);

// GET /api/admin-content-management/:contentId - Get content by ID
router.get('/:contentId', getContentById);

// POST /api/admin-content-management - Create new content
router.post('/', createContentValidation, createContent);

// PUT /api/admin-content-management/:contentId - Update content
router.put('/:contentId', updateContentValidation, updateContent);

// PUT /api/admin-content-management/reorder - Reorder content
router.put('/reorder', reorderValidation, reorderContent);

// DELETE /api/admin-content-management/:contentId - Delete content
router.delete('/:contentId', deleteContent);

export default router;
