import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AdminSettings } from '../models/Settings';

// Get all admin settings
export const getAdminSettings = async (req: Request, res: Response) => {
  try {
    console.log('getAdminSettings called');
    
    // Return mock data for now to test the endpoint
    const mockSettings = {
      commissionRate: 10,
      commissionType: 'percentage',
      gstEnabled: false,
      gstRate: 18,
      platformFeeEnabled: false,
      platformFeeRate: 2,
      defaultCurrency: 'INR',
      defaultLanguage: 'en'
    };

    return res.json({
      success: true,
      message: 'Admin settings retrieved successfully (mock data)',
      settings: mockSettings
    });
  } catch (error) {
    console.error('Error in getAdminSettings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving admin settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update commission settings
export const updateCommissionSettings = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      commissionRate,
      commissionType,
      fixedCommissionAmount,
      commissionOnCleaningFee,
      commissionOnExtraGuests
    } = req.body;

    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = new AdminSettings();
    }

    // Update commission settings
    if (commissionRate !== undefined) settings.commissionRate = commissionRate;
    if (commissionType !== undefined) settings.commissionType = commissionType;
    if (fixedCommissionAmount !== undefined) settings.fixedCommissionAmount = fixedCommissionAmount;
    if (commissionOnCleaningFee !== undefined) settings.commissionOnCleaningFee = commissionOnCleaningFee;
    if (commissionOnExtraGuests !== undefined) settings.commissionOnExtraGuests = commissionOnExtraGuests;

    await settings.save();

    return res.json({
      success: true,
      message: 'Commission settings updated successfully',
      settings: {
        commissionRate: settings.commissionRate,
        commissionType: settings.commissionType,
        fixedCommissionAmount: settings.fixedCommissionAmount,
        commissionOnCleaningFee: settings.commissionOnCleaningFee,
        commissionOnExtraGuests: settings.commissionOnExtraGuests
      }
    });
  } catch (error) {
    console.error('Error updating commission settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating commission settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update GST settings
export const updateGSTSettings = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      gstEnabled,
      gstRate,
      gstNumber,
      gstOnCommission,
      gstInclusive
    } = req.body;

    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = new AdminSettings();
    }

    // Update GST settings
    if (gstEnabled !== undefined) settings.gstEnabled = gstEnabled;
    if (gstRate !== undefined) settings.gstRate = gstRate;
    if (gstNumber !== undefined) settings.gstNumber = gstNumber;
    if (gstOnCommission !== undefined) settings.gstOnCommission = gstOnCommission;
    if (gstInclusive !== undefined) settings.gstInclusive = gstInclusive;

    await settings.save();

    return res.json({
      success: true,
      message: 'GST settings updated successfully',
      settings: {
        gstEnabled: settings.gstEnabled,
        gstRate: settings.gstRate,
        gstNumber: settings.gstNumber,
        gstOnCommission: settings.gstOnCommission,
        gstInclusive: settings.gstInclusive
      }
    });
  } catch (error) {
    console.error('Error updating GST settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating GST settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update TCS settings
export const updateTCSSettings = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      tcsEnabled,
      tcsRate,
      tcsThreshold
    } = req.body;

    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = new AdminSettings();
    }

    // Update TCS settings
    if (tcsEnabled !== undefined) settings.tcsEnabled = tcsEnabled;
    if (tcsRate !== undefined) settings.tcsRate = tcsRate;
    if (tcsThreshold !== undefined) settings.tcsThreshold = tcsThreshold;

    await settings.save();

    return res.json({
      success: true,
      message: 'TCS settings updated successfully',
      settings: {
        tcsEnabled: settings.tcsEnabled,
        tcsRate: settings.tcsRate,
        tcsThreshold: settings.tcsThreshold
      }
    });
  } catch (error) {
    console.error('Error updating TCS settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating TCS settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update platform fee settings
export const updatePlatformFeeSettings = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      platformFeeEnabled,
      platformFeeRate,
      platformFeeType,
      fixedPlatformFee
    } = req.body;

    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = new AdminSettings();
    }

    // Update platform fee settings
    if (platformFeeEnabled !== undefined) settings.platformFeeEnabled = platformFeeEnabled;
    if (platformFeeRate !== undefined) settings.platformFeeRate = platformFeeRate;
    if (platformFeeType !== undefined) settings.platformFeeType = platformFeeType;
    if (fixedPlatformFee !== undefined) settings.fixedPlatformFee = fixedPlatformFee;

    await settings.save();

    return res.json({
      success: true,
      message: 'Platform fee settings updated successfully',
      settings: {
        platformFeeEnabled: settings.platformFeeEnabled,
        platformFeeRate: settings.platformFeeRate,
        platformFeeType: settings.platformFeeType,
        fixedPlatformFee: settings.fixedPlatformFee
      }
    });
  } catch (error) {
    console.error('Error updating platform fee settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating platform fee settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update payment gateway settings
export const updatePaymentGatewaySettings = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      razorpayKeyId,
      razorpayKeySecret,
      stripePublicKey,
      stripeSecretKey,
      paypalClientId,
      paypalClientSecret
    } = req.body;

    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = new AdminSettings();
    }

    // Update payment gateway settings
    if (razorpayKeyId !== undefined) settings.paymentGateway.razorpayKeyId = razorpayKeyId;
    if (razorpayKeySecret !== undefined) settings.paymentGateway.razorpayKeySecret = razorpayKeySecret;
    if (stripePublicKey !== undefined) settings.paymentGateway.stripePublicKey = stripePublicKey;
    if (stripeSecretKey !== undefined) settings.paymentGateway.stripeSecretKey = stripeSecretKey;
    if (paypalClientId !== undefined) settings.paymentGateway.paypalClientId = paypalClientId;
    if (paypalClientSecret !== undefined) settings.paymentGateway.paypalClientSecret = paypalClientSecret;

    await settings.save();

    return res.json({
      success: true,
      message: 'Payment gateway settings updated successfully',
      settings: {
        paymentGateway: settings.paymentGateway
      }
    });
  } catch (error) {
    console.error('Error updating payment gateway settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating payment gateway settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update cancellation settings
export const updateCancellationSettings = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      strictCancellationEnabled,
      freeCancellationHours,
      cancellationPenaltyRate,
      hostPenaltyRate,
      guestRefundRate,
      hostAutoCancelPenalty,
      guestAutoCancelPenalty
    } = req.body;

    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = new AdminSettings();
    }

    // Update cancellation settings
    if (strictCancellationEnabled !== undefined) settings.cancellationPolicy.strictCancellationEnabled = strictCancellationEnabled;
    if (freeCancellationHours !== undefined) settings.cancellationPolicy.freeCancellationHours = freeCancellationHours;
    if (cancellationPenaltyRate !== undefined) settings.cancellationPolicy.cancellationPenaltyRate = cancellationPenaltyRate;
    if (hostPenaltyRate !== undefined) settings.cancellationPolicy.hostPenaltyRate = hostPenaltyRate;
    if (guestRefundRate !== undefined) settings.cancellationPolicy.guestRefundRate = guestRefundRate;
    if (hostAutoCancelPenalty !== undefined) settings.cancellationPolicy.hostAutoCancelPenalty = hostAutoCancelPenalty;
    if (guestAutoCancelPenalty !== undefined) settings.cancellationPolicy.guestAutoCancelPenalty = guestAutoCancelPenalty;

    await settings.save();

    return res.json({
      success: true,
      message: 'Cancellation settings updated successfully',
      settings: {
        cancellationPolicy: settings.cancellationPolicy
      }
    });
  } catch (error) {
    console.error('Error updating cancellation settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating cancellation settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update auto-confirm settings
export const updateAutoConfirmSettings = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      autoConfirmEnabled,
      autoConfirmHours,
      minimumRating,
      instantBookingEnabled
    } = req.body;

    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = new AdminSettings();
    }

    // Update auto-confirm settings
    if (autoConfirmEnabled !== undefined) settings.autoConfirmEnabled = autoConfirmEnabled;
    if (autoConfirmHours !== undefined) settings.autoConfirmHours = autoConfirmHours;
    if (minimumRating !== undefined) settings.minimumRating = minimumRating;
    if (instantBookingEnabled !== undefined) settings.instantBookingEnabled = instantBookingEnabled;

    await settings.save();

    return res.json({
      success: true,
      message: 'Auto-confirm settings updated successfully',
      settings: {
        autoConfirmEnabled: settings.autoConfirmEnabled,
        autoConfirmHours: settings.autoConfirmHours,
        minimumRating: settings.minimumRating,
        instantBookingEnabled: settings.instantBookingEnabled
      }
    });
  } catch (error) {
    console.error('Error updating auto-confirm settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating auto-confirm settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update refund settings
export const updateRefundSettings = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      refundWindow,
      autoRefundEnabled,
      refundProcessingTime,
      partialRefundEnabled
    } = req.body;

    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = new AdminSettings();
    }

    // Update refund settings
    if (refundWindow !== undefined) settings.refundWindow = refundWindow;
    if (autoRefundEnabled !== undefined) settings.autoRefundEnabled = autoRefundEnabled;
    if (refundProcessingTime !== undefined) settings.refundProcessingTime = refundProcessingTime;
    if (partialRefundEnabled !== undefined) settings.partialRefundEnabled = partialRefundEnabled;

    await settings.save();

    return res.json({
      success: true,
      message: 'Refund settings updated successfully',
      settings: {
        refundWindow: settings.refundWindow,
        autoRefundEnabled: settings.autoRefundEnabled,
        refundProcessingTime: settings.refundProcessingTime,
        partialRefundEnabled: settings.partialRefundEnabled
      }
    });
  } catch (error) {
    console.error('Error updating refund settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating refund settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update security settings
export const updateSecuritySettings = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      maxLoginAttempts,
      lockoutDuration,
      passwordComplexityEnabled,
      sessionTimeout,
      twoFactorEnabled
    } = req.body;

    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = new AdminSettings();
    }

    // Update security settings
    if (maxLoginAttempts !== undefined) settings.maxLoginAttempts = maxLoginAttempts;
    if (lockoutDuration !== undefined) settings.lockoutDuration = lockoutDuration;
    if (passwordComplexityEnabled !== undefined) settings.passwordComplexityEnabled = passwordComplexityEnabled;
    if (sessionTimeout !== undefined) settings.sessionTimeout = sessionTimeout;
    if (twoFactorEnabled !== undefined) settings.twoFactorAuthEnabled = twoFactorEnabled;

    await settings.save();

    return res.json({
      success: true,
      message: 'Security settings updated successfully',
      settings: {
        maxLoginAttempts: settings.maxLoginAttempts,
        lockoutDuration: settings.lockoutDuration,
        passwordComplexityEnabled: settings.passwordComplexityEnabled,
        sessionTimeout: settings.sessionTimeout,
        twoFactorAuthEnabled: settings.twoFactorAuthEnabled
      }
    });
  } catch (error) {
    console.error('Error updating security settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating security settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update notification settings
export const updateNotificationSettings = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      emailNotificationsEnabled,
      smsNotificationsEnabled,
      pushNotificationsEnabled,
      adminAlertsEnabled
    } = req.body;

    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = new AdminSettings();
    }

    // Update notification settings
    if (emailNotificationsEnabled !== undefined) settings.emailNotificationsEnabled = emailNotificationsEnabled;
    if (smsNotificationsEnabled !== undefined) settings.smsNotificationsEnabled = smsNotificationsEnabled;
    if (pushNotificationsEnabled !== undefined) settings.pushNotificationsEnabled = pushNotificationsEnabled;
    if (adminAlertsEnabled !== undefined) settings.adminAlertsEnabled = adminAlertsEnabled;

    await settings.save();

    return res.json({
      success: true,
      message: 'Notification settings updated successfully',
      settings: {
        emailNotificationsEnabled: settings.emailNotificationsEnabled,
        smsNotificationsEnabled: settings.smsNotificationsEnabled,
        pushNotificationsEnabled: settings.pushNotificationsEnabled,
        adminAlertsEnabled: settings.adminAlertsEnabled
      }
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating notification settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update maintenance mode
export const updateMaintenanceMode = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      maintenanceMode,
      maintenanceMessage,
      maintenanceStartTime,
      maintenanceEndTime
    } = req.body;

    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = new AdminSettings();
    }

    // Update maintenance mode
    if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
    if (maintenanceMessage !== undefined) settings.maintenanceMessage = maintenanceMessage;
    if (maintenanceStartTime !== undefined) settings.maintenanceStartTime = new Date(maintenanceStartTime);
    if (maintenanceEndTime !== undefined) settings.maintenanceEndTime = new Date(maintenanceEndTime);

    await settings.save();

    return res.json({
      success: true,
      message: 'Maintenance mode updated successfully',
      settings: {
        maintenanceMode: settings.maintenanceMode,
        maintenanceMessage: settings.maintenanceMessage,
        maintenanceStartTime: settings.maintenanceStartTime,
        maintenanceEndTime: settings.maintenanceEndTime
      }
    });
  } catch (error) {
    console.error('Error updating maintenance mode:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating maintenance mode',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update system settings
export const updateSystemSettings = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      defaultCurrency,
      defaultLanguage,
      timezone,
      dateFormat,
      timeFormat
    } = req.body;

    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = new AdminSettings();
    }

    // Update system settings
    if (defaultCurrency !== undefined) settings.defaultCurrency = defaultCurrency;
    if (defaultLanguage !== undefined) settings.defaultLanguage = defaultLanguage;
    if (timezone !== undefined) settings.timezone = timezone;
    if (dateFormat !== undefined) settings.dateFormat = dateFormat;
    if (timeFormat !== undefined) settings.timeFormat = timeFormat;

    await settings.save();

    return res.json({
      success: true,
      message: 'System settings updated successfully',
      settings: {
        defaultCurrency: settings.defaultCurrency,
        defaultLanguage: settings.defaultLanguage,
        timezone: settings.timezone,
        dateFormat: settings.dateFormat,
        timeFormat: settings.timeFormat
      }
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating system settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update rate limiting
export const updateRateLimiting = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      requestsPerMinute,
      requestsPerHour,
      requestsPerDay
    } = req.body;

    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = new AdminSettings();
    }

    // Update rate limiting
    if (requestsPerMinute !== undefined) settings.apiRateLimit.requestsPerMinute = requestsPerMinute;
    if (requestsPerHour !== undefined) settings.apiRateLimit.requestsPerHour = requestsPerHour;
    if (requestsPerDay !== undefined) settings.apiRateLimit.requestsPerDay = requestsPerDay;

    await settings.save();

    return res.json({
      success: true,
      message: 'Rate limiting settings updated successfully',
      settings: {
        apiRateLimit: settings.apiRateLimit
      }
    });
  } catch (error) {
    console.error('Error updating rate limiting settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating rate limiting settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get settings by category
export const getSettingsByCategory = async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    
    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = new AdminSettings();
      await settings.save();
    }

    let settingsData: any = {};

    switch (category) {
      case 'commission':
        settingsData = {
          commissionRate: settings.commissionRate,
          commissionType: settings.commissionType,
          fixedCommissionAmount: settings.fixedCommissionAmount,
          commissionOnCleaningFee: settings.commissionOnCleaningFee,
          commissionOnExtraGuests: settings.commissionOnExtraGuests
        };
        break;
      case 'gst':
        settingsData = {
          gstEnabled: settings.gstEnabled,
          gstRate: settings.gstRate,
          gstNumber: settings.gstNumber,
          gstOnCommission: settings.gstOnCommission,
          gstInclusive: settings.gstInclusive
        };
        break;
      case 'tcs':
        settingsData = {
          tcsEnabled: settings.tcsEnabled,
          tcsRate: settings.tcsRate,
          tcsThreshold: settings.tcsThreshold
        };
        break;
      case 'platform_fee':
        settingsData = {
          platformFeeEnabled: settings.platformFeeEnabled,
          platformFeeRate: settings.platformFeeRate,
          platformFeeType: settings.platformFeeType,
          fixedPlatformFee: settings.fixedPlatformFee
        };
        break;
      case 'cancellation':
        settingsData = {
          cancellationPolicy: settings.cancellationPolicy
        };
        break;
      case 'auto_confirm':
        settingsData = {
          autoConfirmEnabled: settings.autoConfirmEnabled,
          autoConfirmHours: settings.autoConfirmHours,
          minimumRating: settings.minimumRating,
          instantBookingEnabled: settings.instantBookingEnabled
        };
        break;
      case 'refund':
        settingsData = {
          refundWindow: settings.refundWindow,
          autoRefundEnabled: settings.autoRefundEnabled,
          refundProcessingTime: settings.refundProcessingTime,
          partialRefundEnabled: settings.partialRefundEnabled
        };
        break;
      case 'security':
        settingsData = {
          maxLoginAttempts: settings.maxLoginAttempts,
          lockoutDuration: settings.lockoutDuration,
          passwordComplexityEnabled: settings.passwordComplexityEnabled,
          sessionTimeout: settings.sessionTimeout,
          twoFactorAuthEnabled: settings.twoFactorAuthEnabled
        };
        break;
      case 'notifications':
        settingsData = {
          emailNotificationsEnabled: settings.emailNotificationsEnabled,
          smsNotificationsEnabled: settings.smsNotificationsEnabled,
          pushNotificationsEnabled: settings.pushNotificationsEnabled,
          adminAlertsEnabled: settings.adminAlertsEnabled
        };
        break;
      case 'maintenance':
        settingsData = {
          maintenanceMode: settings.maintenanceMode,
          maintenanceMessage: settings.maintenanceMessage,
          maintenanceStartTime: settings.maintenanceStartTime,
          maintenanceEndTime: settings.maintenanceEndTime
        };
        break;
      case 'system':
        settingsData = {
          defaultCurrency: settings.defaultCurrency,
          defaultLanguage: settings.defaultLanguage,
          timezone: settings.timezone,
          dateFormat: settings.dateFormat,
          timeFormat: settings.timeFormat
        };
        break;
      default:
        settingsData = {};
    }

    return res.json({
      success: true,
      settings: settingsData
    });
  } catch (error) {
    console.error('Error fetching settings by category:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching settings by category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Reset settings to defaults
export const resetSettingsToDefaults = async (req: Request, res: Response) => {
  try {
    const { confirm } = req.body;
    
    if (!confirm) {
      return res.status(400).json({
        success: false,
        message: 'Confirmation required to reset settings'
      });
    }

    // Delete existing settings
    await AdminSettings.deleteMany({});
    
    // Create new default settings
    const defaultSettings = new AdminSettings();
    await defaultSettings.save();

    return res.json({
      success: true,
      message: 'Settings reset to defaults successfully',
      settings: defaultSettings
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error resetting settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Export all settings as JSON
export const exportSettings = async (req: Request, res: Response) => {
  try {
    const settings = await AdminSettings.findOne();
    
    if (!settings) {
      const newSettings = new AdminSettings();
      await newSettings.save();
      return res.json({
        success: true,
        settings: newSettings
      });
    }

    return res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error exporting settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error exporting settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
