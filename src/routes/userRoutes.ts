import { Router } from 'express';
import { body } from 'express-validator';
import * as userController from '../controllers/userController';

const router = Router();

// New Routes for Password Authentication
// Route: Register User with Password
router.post(
  '/register',
  [
    body('fullName').trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phoneNumber').matches(/^\d{10}$/).withMessage('Phone number must be 10 digits'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  userController.registerUserWithPassword
);

// Route: Login User with Email/Mobile and Password
router.post(
  '/login',
  [
    body('emailOrMobile').notEmpty().withMessage('Email or mobile number is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  userController.loginUser
);

// Legacy OTP Routes (can be removed later)
// Route 1: Register User (Send OTP)
router.post(
  '/register-otp',
  [
    body('fullName').trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phoneNumber').matches(/^\d{10}$/).withMessage('Phone number must be 10 digits')
  ],
  userController.registerUser
);

// Route 2: Verify OTP
router.post('/verify-otp', userController.verifyUserOTP);

// Route 3: Complete Registration
router.post('/complete-registration', userController.completeUserRegistration);

// Route 4: Resend OTP
router.post('/resend-otp', userController.resendUserOTP);

// Route 5: Get User Details
router.get('/:userId', userController.getUserDetails);

// Route 6: Update User Profile
router.put('/:userId', userController.updateUserProfile);

// Route 7: Delete User Account
router.delete('/:userId', userController.deleteUserAccount);

export default router;
