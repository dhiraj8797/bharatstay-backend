import { Router } from "express";
import { body } from "express-validator";
import multer from "multer";
import * as hostController from "../controllers/hostController";
import path from "path";
import fs from "fs";

// uploads/id-proofs (relative to backend root)
const uploadDir = path.join(process.cwd(), "uploads", "id-proofs");

// Ensure upload directory exists
fs.mkdirSync(uploadDir, { recursive: true });

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});

const upload = multer({ storage });

/**
 * New Routes for Password Authentication
 */

// Route: Register Host with Password
router.post(
  "/register",
  [
    body("fullName")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Full name must be at least 2 characters"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("phoneNumber")
      .matches(/^\d{10}$/)
      .withMessage("Phone number must be 10 digits"),
    body("dateOfBirth").isISO8601().withMessage("Valid date of birth is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  hostController.registerHostWithPassword
);

// Route: Login Host with Email/Mobile and Password
router.post(
  "/login",
  [
    body("emailOrMobile").notEmpty().withMessage("Email or mobile number is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  hostController.loginHost
);

/**
 * Legacy OTP Routes (can be removed later)
 */

// Route 1: Register Host Personal Details
router.post(
  "/register-personal",
  [
    body("fullName")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Full name must be at least 2 characters"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("phoneNumber")
      .matches(/^\d{10}$/)
      .withMessage("Phone number must be 10 digits"),
    body("dateOfBirth").isISO8601().withMessage("Valid date of birth is required"),
  ],
  hostController.registerHostPersonal
);

// Route 2: Verify OTP
router.post("/verify-otp", hostController.verifyHostOTP);

// Route 3: Resend OTP
router.post("/resend-otp", hostController.resendHostOTP);

// Route 4: Submit ID Proof (legacy single file)
router.post("/submit-id-proof", upload.single("idProof"), hostController.submitHostIDProof);

// Route 5: Submit Multiple Documents (Aadhar, PAN, License)
router.post(
  "/submit-documents",
  upload.fields([
    { name: "aadhar", maxCount: 1 },
    { name: "pan", maxCount: 1 },
    { name: "license", maxCount: 1 },
  ]),
  hostController.submitHostDocuments
);

// Route 6: Submit Location Details
router.post(
  "/submit-location",
  [
    body("fullAddress").trim().isLength({ min: 5 }).withMessage("Valid address is required"),
    body("city").trim().isLength({ min: 2 }).withMessage("City is required"),
    body("state").trim().isLength({ min: 2 }).withMessage("State is required"),
    body("postalCode").matches(/^\d{6}$/).withMessage("Postal code must be 6 digits"),
    body("latitude").isFloat().withMessage("Valid latitude is required"),
    body("longitude").isFloat().withMessage("Valid longitude is required"),
  ],
  hostController.submitHostLocation
);

// Route 7: Complete Registration
router.post("/complete-registration", hostController.completeHostRegistration);

// Route 8: Get Host Details
router.get("/:hostId", hostController.getHostDetails);

export default router;
