import { Request, Response } from 'express';
import UserSignUp from '../models/UserSignUp';
import { validationResult } from 'express-validator';

// Generate OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Sign In - Check Phone and Send OTP
export const signInWithPhone = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { phoneNumber } = req.body;

    // Check if user exists
    const user = await UserSignUp.findOne({ phoneNumber });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Phone number not registered. Please sign up first.',
        redirectTo: 'signup'
      });
      return;
    }

    // Check if registration is completed
    if (!user.registrationCompleted) {
      res.status(400).json({
        success: false,
        message: 'Please complete your registration first.',
        redirectTo: 'signup'
      });
      return;
    }

    // Check if account is active
    if (user.status !== 'active') {
      res.status(403).json({
        success: false,
        message: 'Your account is not active. Please contact support.'
      });
      return;
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // In production, send OTP via SMS
    console.log(`📱 Sign-In OTP for ${phoneNumber}: ${otp}`);

    res.status(200).json({
      success: true,
      message: 'OTP sent to your phone',
      userId: user._id,
      otp: otp // Only for development, remove in production
    });
  } catch (error: any) {
    console.error('Error in signInWithPhone:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing sign in',
      error: error.message
    });
  }
};

// Verify Sign In OTP
export const verifySignInOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      res.status(400).json({
        success: false,
        message: 'User ID and OTP are required'
      });
      return;
    }

    const user = await UserSignUp.findById(userId).select('+otp +otpExpires');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Check OTP expiry
    if (user.otpExpires && user.otpExpires < new Date()) {
      res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
      return;
    }

    // Verify OTP
    if (user.otp !== otp) {
      res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
      return;
    }

    // Clear OTP and mark as verified
    user.otp = '';
    user.otpExpires = undefined;
    await user.save();

    // In production, generate JWT token here
    res.status(200).json({
      success: true,
      message: 'Sign in successful',
      userId: user._id,
      user: {
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber
      }
      // token: generateJWT(user._id) // Add in production
    });
  } catch (error: any) {
    console.error('Error in verifySignInOTP:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying OTP',
      error: error.message
    });
  }
};

// Resend Sign In OTP
export const resendSignInOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
      return;
    }

    const user = await UserSignUp.findById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // In production, send OTP via SMS
    console.log(`📱 Resend Sign-In OTP for ${user.phoneNumber}: ${otp}`);

    res.status(200).json({
      success: true,
      message: 'OTP resent successfully',
      userId: user._id,
      otp: otp // Only for development, remove in production
    });
  } catch (error: any) {
    console.error('Error in resendSignInOTP:', error);
    res.status(500).json({
      success: false,
      message: 'Error resending OTP',
      error: error.message
    });
  }
};
