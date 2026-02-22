import { Request, Response } from 'express';
import UserSignUp from '../models/UserSignUp';
import { validationResult } from 'express-validator';
import { tempStorage } from '../utils/tempStorage';
import { randomUUID } from 'crypto';

// Generate OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register User with Password (No Firebase)
export const registerUserWithPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { fullName, email, phoneNumber, password } = req.body;

    // Check if user already exists
    const existingUser = await UserSignUp.findOne({
      $or: [{ email }, { phoneNumber }]
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'User already exists with this email or phone number'
      });
      return;
    }

    // Create new user with password
    const user = new UserSignUp({
      fullName,
      email,
      phoneNumber,
      password,
      termsAccepted: false,
      status: 'active'
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      userId: user._id,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// User Login with Email/Mobile and Password
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { emailOrMobile, password } = req.body;

    // Determine if input is email or mobile
    const isEmail = String(emailOrMobile).includes('@');

    // Find user by email or phone number (include password field)
    const query = isEmail
      ? { email: String(emailOrMobile).toLowerCase() }
      : { phoneNumber: String(emailOrMobile).replace(/\D/g, '') };

    const user = await UserSignUp.findOne(query).select('+password');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Compare password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Return success with user data (excluding password)
    res.json({
      success: true,
      message: 'Login successful',
      userId: user._id,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (error) {
    console.error('User login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};


// Register User - Send OTP (Data NOT saved to DB yet) - Legacy OTP flow
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { fullName, email, phoneNumber } = req.body;

    // Check if email or phone already registered in DB
    const existingUser = await UserSignUp.findOne({
      $or: [{ email }, { phoneNumber }]
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'Email or phone number already registered'
      });
      return;
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Generate temporary ID
    const tempId = randomUUID();

    // Store in temporary storage (NOT in database)
    tempStorage.setUser(tempId, {
      fullName,
      email,
      phoneNumber,
      otp,
      otpExpires,
      createdAt: new Date()
    });

    // In production, send OTP via SMS/Email
    console.log(`📱 OTP for ${phoneNumber}: ${otp}`);

    res.status(201).json({
      success: true,
      message: 'OTP sent to your phone',
      userId: tempId,
      otp: otp // Only for development, remove in production
    });
  } catch (error: any) {
    console.error('Error in registerUser:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

// Verify OTP and Save to Database
export const verifyUserOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      res.status(400).json({
        success: false,
        message: 'User ID and OTP are required'
      });
      return;
    }

    // Get user data from temporary storage
    const tempUserData = tempStorage.getUser(userId);

    if (!tempUserData) {
      res.status(404).json({
        success: false,
        message: 'Registration session not found or expired'
      });
      return;
    }

    // Check OTP expiry
    if (tempUserData.otpExpires < new Date()) {
      tempStorage.deleteUser(userId);
      res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
      return;
    }

    // Verify OTP
    if (tempUserData.otp !== otp) {
      res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
      return;
    }

    // OTP verified! Now save to database
    const userSignUp = new UserSignUp({
      fullName: tempUserData.fullName,
      email: tempUserData.email,
      phoneNumber: tempUserData.phoneNumber,
      otpVerified: true,
      status: 'active'
    });

    await userSignUp.save();

    // Remove from temporary storage
    tempStorage.deleteUser(userId);

    console.log(`✅ User saved to database: ${tempUserData.email}`);

    res.status(200).json({
      success: true,
      message: 'OTP verified and account created successfully',
      userId: userSignUp._id
    });
  } catch (error: any) {
    console.error('Error in verifyUserOTP:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying OTP',
      error: error.message
    });
  }
};

// Complete User Registration
export const completeUserRegistration = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, termsAccepted } = req.body;

    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
      return;
    }

    const userSignUp = await UserSignUp.findById(userId);

    if (!userSignUp) {
      res.status(404).json({
        success: false,
        message: 'User registration not found'
      });
      return;
    }

    if (!termsAccepted) {
      res.status(400).json({
        success: false,
        message: 'You must accept terms and conditions'
      });
      return;
    }

    // Mark registration as complete
    userSignUp.termsAccepted = true;
    userSignUp.registrationCompleted = true;
    userSignUp.status = 'active';

    await userSignUp.save();

    res.status(200).json({
      success: true,
      message: 'User registration completed successfully',
      userId: userSignUp._id,
      message_detail: 'Welcome to BharatStay! Your account has been created.'
    });
  } catch (error: any) {
    console.error('Error in completeUserRegistration:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing registration',
      error: error.message
    });
  }
};

// Resend OTP
export const resendUserOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
      return;
    }

    // Get user data from temporary storage
    const tempUserData = tempStorage.getUser(userId);

    if (!tempUserData) {
      res.status(404).json({
        success: false,
        message: 'Registration session not found or expired'
      });
      return;
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update temporary storage with new OTP
    tempStorage.setUser(userId, {
      ...tempUserData,
      otp,
      otpExpires
    });

    // In production, send OTP via SMS/Email
    console.log(`📱 New OTP for ${tempUserData.phoneNumber}: ${otp}`);

    res.status(200).json({
      success: true,
      message: 'OTP resent successfully',
      userId: userId,
      otp: otp // Only for development, remove in production
    });
  } catch (error: any) {
    console.error('Error in resendUserOTP:', error);
    res.status(500).json({
      success: false,
      message: 'Error resending OTP',
      error: error.message
    });
  }
};

// Get User Details
export const getUserDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const userSignUp = await UserSignUp.findById(userId);

    if (!userSignUp) {
      res.status(404).json({
        success: false,
        message: 'User registration not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: userSignUp
    });
  } catch (error: any) {
    console.error('Error in getUserDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user details',
      error: error.message
    });
  }
};
