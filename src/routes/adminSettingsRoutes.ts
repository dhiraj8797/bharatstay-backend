import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAdminSettings,
  updateCommissionSettings,
  updateGSTSettings,
  updateTCSSettings,
  updatePlatformFeeSettings,
  updatePaymentGatewaySettings,
  updateCancellationSettings,
  updateAutoConfirmSettings,
  updateRefundSettings,
  updateSecuritySettings,
  updateNotificationSettings,
  updateMaintenanceMode,
  updateSystemSettings,
  updateRateLimiting,
  getSettingsByCategory,
  resetSettingsToDefaults,
  exportSettings
} from '../controllers/adminSettingsController';

const router = Router();

// Validation middleware
const commissionValidation = [
  body('commissionRate')
    .optional()
    .isFloat({ min: 0, max: 50 })
    .withMessage('Commission rate must be between 0 and 50'),
  body('commissionType')
    .optional()
    .isIn(['percentage', 'fixed'])
    .withMessage('Commission type must be either percentage or fixed'),
  body('fixedCommissionAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Fixed commission amount must be positive'),
  body('commissionOnCleaningFee')
    .optional()
    .isBoolean()
    .withMessage('Commission on cleaning fee must be a boolean'),
  body('commissionOnExtraGuests')
    .optional()
    .isBoolean()
    .withMessage('Commission on extra guests must be a boolean')
];

const gstValidation = [
  body('gstEnabled')
    .optional()
    .isBoolean()
    .withMessage('GST enabled must be a boolean'),
  body('gstRate')
    .optional()
    .isFloat({ min: 0, max: 30 })
    .withMessage('GST rate must be between 0 and 30'),
  body('gstNumber')
    .optional()
    .isString()
    .withMessage('GST number must be a string')
    .matches(/^[0-9]{15}$/)
    .withMessage('GST number must be 15 digits'),
  body('gstOnCommission')
    .optional()
    .isBoolean()
    .withMessage('GST on commission must be a boolean'),
  body('gstInclusive')
    .optional()
    .isBoolean()
    .withMessage('GST inclusive must be a boolean')
];

const tcsValidation = [
  body('tcsEnabled')
    .optional()
    .isBoolean()
    .withMessage('TCS enabled must be a boolean'),
  body('tcsRate')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('TCS rate must be between 0 and 10'),
  body('tcsThreshold')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('TCS threshold must be positive')
];

const platformFeeValidation = [
  body('platformFeeEnabled')
    .optional()
    .isBoolean()
    .withMessage('Platform fee enabled must be a boolean'),
  body('platformFeeRate')
    .optional()
    .isFloat({ min: 0, max: 20 })
    .withMessage('Platform fee rate must be between 0 and 20'),
  body('platformFeeType')
    .optional()
    .isIn(['percentage', 'fixed'])
    .withMessage('Platform fee type must be either percentage or fixed'),
  body('fixedPlatformFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Fixed platform fee must be positive')
];

const paymentGatewayValidation = [
  body('razorpayKeyId')
    .optional()
    .isString()
    .withMessage('Razorpay key ID must be a string'),
  body('razorpayKeySecret')
    .optional()
    .isString()
    .withMessage('Razorpay key secret must be a string'),
  body('stripePublicKey')
    .optional()
    .isString()
    .withMessage('Stripe public key must be a string'),
  body('stripeSecretKey')
    .optional()
    .isString()
    .withMessage('Stripe secret key must be a string'),
  body('paypalClientId')
    .optional()
    .isString()
    .withMessage('PayPal client ID must be a string'),
  body('paypalClientSecret')
    .optional()
    .isString()
    .withMessage('PayPal client secret must be a string')
];

const cancellationValidation = [
  body('strictCancellationEnabled')
    .optional()
    .isBoolean()
    .withMessage('Strict cancellation enabled must be a boolean'),
  body('freeCancellationHours')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Free cancellation hours must be a non-negative integer'),
  body('cancellationPenaltyRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Cancellation penalty rate must be between 0 and 100'),
  body('hostPenaltyRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Host penalty rate must be between 0 and 100'),
  body('guestRefundRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Guest refund rate must be between 0 and 100'),
  body('hostAutoCancelPenalty')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Host auto cancel penalty must be between 0 and 100'),
  body('guestAutoCancelPenalty')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Guest auto cancel penalty must be between 0 and 100')
];

const autoConfirmValidation = [
  body('autoConfirmEnabled')
    .optional()
    .isBoolean()
    .withMessage('Auto confirm enabled must be a boolean'),
  body('autoConfirmHours')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Auto confirm hours must be at least 1'),
  body('minimumRating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Minimum rating must be between 0 and 5'),
  body('instantBookingEnabled')
    .optional()
    .isBoolean()
    .withMessage('Instant booking enabled must be a boolean')
];

const refundValidation = [
  body('refundWindow')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Refund window must be a non-negative integer'),
  body('autoRefundEnabled')
    .optional()
    .isBoolean()
    .withMessage('Auto refund enabled must be a boolean'),
  body('refundProcessingTime')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Refund processing time must be at least 1'),
  body('partialRefundEnabled')
    .optional()
    .isBoolean()
    .withMessage('Partial refund enabled must be a boolean')
];

const securityValidation = [
  body('maxLoginAttempts')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Max login attempts must be between 1 and 10'),
  body('lockoutDuration')
    .optional()
    .isInt({ min: 1, max: 1440 })
    .withMessage('Lockout duration must be between 1 and 1440 minutes'),
  body('passwordComplexityEnabled')
    .optional()
    .isBoolean()
    .withMessage('Password complexity enabled must be a boolean'),
  body('sessionTimeout')
    .optional()
    .isInt({ min: 5, max: 1440 })
    .withMessage('Session timeout must be between 5 and 1440 minutes'),
  body('twoFactorEnabled')
    .optional()
    .isBoolean()
    .withMessage('Two factor enabled must be a boolean')
];

const notificationValidation = [
  body('emailNotificationsEnabled')
    .optional()
    .isBoolean()
    .withMessage('Email notifications enabled must be a boolean'),
  body('smsNotificationsEnabled')
    .optional()
    .isBoolean()
    .withMessage('SMS notifications enabled must be a boolean'),
  body('pushNotificationsEnabled')
    .optional()
    .isBoolean()
    .withMessage('Push notifications enabled must be a boolean'),
  body('adminAlertsEnabled')
    .optional()
    .isBoolean()
    .withMessage('Admin alerts enabled must be a boolean')
];

const maintenanceValidation = [
  body('maintenanceMode')
    .optional()
    .isBoolean()
    .withMessage('Maintenance mode must be a boolean'),
  body('maintenanceMessage')
    .optional()
    .isString()
    .withMessage('Maintenance message must be a string')
    .isLength({ max: 500 })
    .withMessage('Maintenance message must not exceed 500 characters'),
  body('maintenanceStartTime')
    .optional()
    .isISO8601()
    .withMessage('Maintenance start time must be a valid date'),
  body('maintenanceEndTime')
    .optional()
    .isISO8601()
    .withMessage('Maintenance end time must be a valid date')
];

const systemValidation = [
  body('defaultCurrency')
    .optional()
    .isString()
    .withMessage('Default currency must be a string')
    .isLength({ min: 3, max: 3 })
    .withMessage('Default currency must be 3 characters'),
  body('defaultLanguage')
    .optional()
    .isString()
    .withMessage('Default language must be a string')
    .isLength({ min: 2, max: 5 })
    .withMessage('Default language must be 2-5 characters'),
  body('timezone')
    .optional()
    .isString()
    .withMessage('Timezone must be a string'),
  body('dateFormat')
    .optional()
    .isString()
    .withMessage('Date format must be a string'),
  body('timeFormat')
    .optional()
    .isString()
    .withMessage('Time format must be a string')
];

const rateLimitValidation = [
  body('requestsPerMinute')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Requests per minute must be between 1 and 1000'),
  body('requestsPerHour')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Requests per hour must be between 1 and 10000'),
  body('requestsPerDay')
    .optional()
    .isInt({ min: 1, max: 100000 })
    .withMessage('Requests per day must be between 1 and 100000')
];

const resetValidation = [
  body('confirm')
    .equals('RESET_SETTINGS_CONFIRMED')
    .withMessage('Confirmation required to reset settings')
];

// Settings Management endpoints

// GET /api/admin-settings - Get all admin settings
router.get('/', getAdminSettings);

// GET /api/admin-settings/export - Export all settings as JSON
router.get('/export', exportSettings);

// GET /api/admin-settings/:category - Get settings by category
router.get('/:category', getSettingsByCategory);

// PUT /api/admin-settings/commission - Update commission settings
router.put('/commission', commissionValidation, updateCommissionSettings);

// PUT /api/admin-settings/gst - Update GST settings
router.put('/gst', gstValidation, updateGSTSettings);

// PUT /api/admin-settings/tcs - Update TCS settings
router.put('/tcs', tcsValidation, updateTCSSettings);

// PUT /api/admin-settings/platform-fee - Update platform fee settings
router.put('/platform-fee', platformFeeValidation, updatePlatformFeeSettings);

// PUT /api/admin-settings/payment-gateway - Update payment gateway settings
router.put('/payment-gateway', paymentGatewayValidation, updatePaymentGatewaySettings);

// PUT /api/admin-settings/cancellation - Update cancellation settings
router.put('/cancellation', cancellationValidation, updateCancellationSettings);

// PUT /api/admin-settings/auto-confirm - Update auto-confirm settings
router.put('/auto-confirm', autoConfirmValidation, updateAutoConfirmSettings);

// PUT /api/admin-settings/refund - Update refund settings
router.put('/refund', refundValidation, updateRefundSettings);

// PUT /api/admin-settings/security - Update security settings
router.put('/security', securityValidation, updateSecuritySettings);

// PUT /api/admin-settings/notifications - Update notification settings
router.put('/notifications', notificationValidation, updateNotificationSettings);

// PUT /api/admin-settings/maintenance - Update maintenance mode
router.put('/maintenance', maintenanceValidation, updateMaintenanceMode);

// PUT /api/admin-settings/system - Update system settings
router.put('/system', systemValidation, updateSystemSettings);

// PUT /api/admin-settings/rate-limiting - Update rate limiting settings
router.put('/rate-limiting', rateLimitValidation, updateRateLimiting);

// POST /api/admin-settings/reset - Reset all settings to defaults
router.post('/reset', resetValidation, resetSettingsToDefaults);

export default router;
