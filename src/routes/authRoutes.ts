import express from 'express';
import { body } from 'express-validator';
import {
  signInWithPhone,
  verifySignInOTP,
  resendSignInOTP
} from '../controllers/authController';

const router = express.Router();

// Sign In - Send OTP
router.post(
  '/signin',
  [
    body('phoneNumber')
      .isLength({ min: 10, max: 10 })
      .withMessage('Phone number must be 10 digits')
      .isNumeric()
      .withMessage('Phone number must contain only digits')
  ],
  signInWithPhone
);

// Verify Sign In OTP
router.post('/verify-signin-otp', verifySignInOTP);

// Resend Sign In OTP
router.post('/resend-signin-otp', resendSignInOTP);

export default router;
