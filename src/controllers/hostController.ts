import { Request, Response } from "express";

import mongoose from "mongoose";

import { validationResult } from "express-validator";

import { randomUUID } from "crypto";



import HostSignUp from "../models/HostSignUp";



/**

 * In-memory temp storage for OTP flow (DEV ONLY).

 */

type TempHost = {

  fullName: string;

  email: string;

  phoneNumber: string;

  dateOfBirth: string;

  state?: string;

  city?: string;

  pincode?: string;

  otp: string;

  otpExpires: Date;

  createdAt: Date;

  idType?: string;

  idProofPath?: string;

  idFileName?: string;

};



const tempStorage = (() => {

  const store = new Map<string, TempHost>();

  return {

    setHost: (id: string, data: TempHost) => store.set(id, data),

    getHost: (id: string) => store.get(id),

    updateHost: (id: string, patch: Partial<TempHost>) => {

      const cur = store.get(id);

      if (!cur) return false;

      store.set(id, { ...cur, ...patch });

      return true;

    },

    deleteHost: (id: string) => store.delete(id),

  };

})();



const generateOTP = (): string => Math.floor(100000 + Math.random() * 900000).toString();



/**

 * State codes mapping (2-letter codes)

 */

const STATE_CODES: Record<string, string> = {

  'andhra pradesh': 'AP',

  'arunachal pradesh': 'AR',

  'assam': 'AS',

  'bihar': 'BR',

  'chhattisgarh': 'CG',

  'goa': 'GA',

  'gujarat': 'GJ',

  'haryana': 'HR',

  'himachal pradesh': 'HP',

  'jharkhand': 'JH',

  'karnataka': 'KA',

  'kerala': 'KL',

  'madhya pradesh': 'MP',

  'maharashtra': 'MH',

  'manipur': 'MN',

  'meghalaya': 'ML',

  'mizoram': 'MZ',

  'nagaland': 'NL',

  'odisha': 'OD',

  'punjab': 'PB',

  'rajasthan': 'RJ',

  'sikkim': 'SK',

  'tamil nadu': 'TN',

  'telangana': 'TS',

  'tripura': 'TR',

  'uttar pradesh': 'UP',

  'uttarakhand': 'UK',

  'west bengal': 'WB',

  'delhi': 'DL',

  'jammu and kashmir': 'JK',

  'ladakh': 'LA',

};



/**

 * Generate city code from city name (first 2 letters)

 */

function getCityCode(city?: string): string {

  if (!city) return 'XX';

  const normalized = city.trim().toLowerCase();

  // Return first 2 letters, uppercase

  return normalized.slice(0, 2).toUpperCase().padEnd(2, 'X');

}



/**

 * Get state code from state name

 */

function getStateCode(state?: string): string {

  if (!state) return 'XX';

  const normalized = state.trim().toLowerCase();

  return STATE_CODES[normalized] || normalized.slice(0, 2).toUpperCase().padEnd(2, 'X');

}



/**

 * 10-digit unique Host ID generator.

 * Format: StateCode(2) + CityCode(2) + MobileLast3(3) + Random3(3) = 10 digits

 */

async function generateUniqueHostId(

  Model: mongoose.Model<any>,

  state?: string,

  city?: string,

  phoneNumber?: string

): Promise<string> {

  const stateCode = getStateCode(state);

  const cityCode = getCityCode(city);

  const digits = (phoneNumber || "").replace(/\D/g, "");

  const last3 = digits.slice(-3).padStart(3, "0");

  const rand3 = Math.floor(100 + Math.random() * 900).toString();

  

  const candidate = `${stateCode}${cityCode}${last3}${rand3}`;



  const exists = await Model.findOne({ hostId: candidate }).lean();

  if (!exists) return candidate;



  // If exists, try again with new random

  return generateUniqueHostId(Model, state, city, phoneNumber);

}



/**

 * Register Host with Password

 */

export const registerHostWithPassword = async (req: Request, res: Response): Promise<void> => {

  try {

    // Check database connection

    if (mongoose.connection.readyState !== 1) {

      res.status(503).json({

        success: false,

        message: 'Database connection unavailable. Please try again later.'

      });

      return;

    }



    const errors = validationResult(req);

    if (!errors.isEmpty()) {

      res.status(400).json({ success: false, errors: errors.array() });

      return;

    }



    const { fullName, email, phoneNumber, referralCode, dateOfBirth, state, city, pincode, password, firebaseUid } = req.body;



    const existingHost = await HostSignUp.findOne({

      $or: [{ email }, { phoneNumber }],

    });



    if (existingHost) {

      res.status(409).json({

        success: false,

        message: "Host already exists with this email or phone number",

      });

      return;

    }



    const age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear();

    if (age < 18) {

      res.status(400).json({ success: false, message: "Host must be at least 18 years old" });

      return;

    }



    const host = new HostSignUp({

      fullName,

      email,

      phoneNumber,

      dateOfBirth,

      state,

      city,

      pincode,

      password,

      firebaseUid,

      termsAccepted: false,

      status: "pending",

    });



    await host.save();



    // Track referral signup if referral code provided
    if (referralCode) {
      try {
        const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3001'}/api/referral/track-signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            referralCode,
            userId: host._id.toString(),
            email,
            phoneNumber,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          })
        });
        
        if (response.ok) {
          console.log('Referral signup tracked successfully');
        } else {
          console.log('Failed to track referral signup:', await response.text());
        }
      } catch (error) {
        console.error('Error tracking referral signup:', error);
        // Don't fail registration if referral tracking fails
      }
    }



    // Generate unique Host ID after successful registration

    const uniqueHostId = await generateUniqueHostId(

      HostSignUp as any,

      state,

      city,

      phoneNumber

    );

    

    host.hostId = uniqueHostId;

    await host.save();



    res.status(201).json({

      success: true,

      message: "Host registered successfully",

      userId: host._id,

      hostId: uniqueHostId,

      host: {

        id: host._id,

        fullName: host.fullName,

        email: host.email,

        phoneNumber: host.phoneNumber,

        hostId: uniqueHostId,

      },

    });

  } catch (error) {

    console.error("Host registration error:", error);

    res.status(500).json({

      success: false,

      message: "Error registering host",

      error: error instanceof Error ? error.message : "Unknown error",

    });

  }

};



/**

 * Host Login

 */

export const loginHost = async (req: Request, res: Response): Promise<void> => {

  try {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {

      res.status(400).json({ success: false, errors: errors.array() });

      return;

    }



    const { emailOrMobile, password } = req.body;



    const isEmail = String(emailOrMobile).includes("@");

    const query = isEmail

      ? { email: String(emailOrMobile).toLowerCase() }

      : { phoneNumber: String(emailOrMobile).replace(/\D/g, "") };



    const host = await HostSignUp.findOne(query).select("+password");



    if (!host) {

      res.status(401).json({ success: false, message: "Invalid credentials" });

      return;

    }



    const isMatch = await host.comparePassword(password);



    if (!isMatch) {

      res.status(401).json({ success: false, message: "Invalid credentials" });

      return;

    }



    res.json({

      success: true,

      message: "Login successful",

      userId: host._id,

      hostId: host.hostId,

      host: {

        id: host._id,

        fullName: host.fullName,

        email: host.email,

        phoneNumber: host.phoneNumber,

        firebaseUid: host.firebaseUid,

        hostId: host.hostId,

      },

    });

  } catch (error) {

    console.error("Host login error:", error);

    res.status(500).json({

      success: false,

      message: "Error logging in",

      error: error instanceof Error ? error.message : "Unknown error",

    });

  }

};



/**

 * OTP Flow - Register personal details (temp)

 */

export const registerHostPersonal = async (req: Request, res: Response): Promise<void> => {

  try {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {

      res.status(400).json({ success: false, errors: errors.array() });

      return;

    }



    const { fullName, email, phoneNumber, dateOfBirth, state, city, pincode } = req.body;



    // Optional DB duplicate check

    try {

      const existingHost = await Promise.race([

        HostSignUp.findOne({ $or: [{ email }, { phoneNumber }] }),

        new Promise((_, reject) => setTimeout(() => reject(new Error("DB timeout")), 5000)),

      ]);



      if (existingHost) {

        res.status(400).json({ success: false, message: "Email or phone number already registered" });

        return;

      }

    } catch (dbError: any) {

      console.warn("Database check skipped:", dbError?.message || dbError);

    }



    const age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear();

    if (age < 18) {

      res.status(400).json({ success: false, message: "You must be at least 18 years old" });

      return;

    }



    const otp = generateOTP();

    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    const tempId = randomUUID();



    tempStorage.setHost(tempId, {

      fullName,

      email,

      phoneNumber,

      dateOfBirth,

      state,

      city,

      pincode,

      otp,

      otpExpires,

      createdAt: new Date(),

    });



    console.log(`📱 OTP for ${phoneNumber}: ${otp}`);



    res.status(201).json({

      success: true,

      message: "OTP sent to your phone",

      hostId: tempId,

      otp, // dev-only

    });

  } catch (error: any) {

    console.error("Error in registerHostPersonal:", error);

    res.status(500).json({

      success: false,

      message: "Error registering host",

      error: error?.message || "Unknown error",

    });

  }

};



/**

 * OTP Flow - Verify OTP and Save to DB

 */

export const verifyHostOTP = async (req: Request, res: Response): Promise<void> => {

  try {

    const { hostId, otp } = req.body;



    if (!hostId || !otp) {

      res.status(400).json({ success: false, message: "Host ID and OTP are required" });

      return;

    }



    const tempHostData = tempStorage.getHost(hostId);

    if (!tempHostData) {

      res.status(404).json({ success: false, message: "Registration session not found or expired" });

      return;

    }



    if (tempHostData.otpExpires < new Date()) {

      tempStorage.deleteHost(hostId);

      res.status(400).json({ success: false, message: "OTP has expired" });

      return;

    }



    if (tempHostData.otp !== otp) {

      res.status(400).json({ success: false, message: "Invalid OTP" });

      return;

    }



    const hostSignUp = new HostSignUp({

      fullName: tempHostData.fullName,

      email: tempHostData.email,

      phoneNumber: tempHostData.phoneNumber,

      dateOfBirth: tempHostData.dateOfBirth,

      state: tempHostData.state,

      city: tempHostData.city,

      pincode: tempHostData.pincode,

      otpVerified: true,

      status: "pending",

      termsAccepted: false,

    });



    await hostSignUp.save();

    tempStorage.deleteHost(hostId);



    res.status(200).json({

      success: true,

      message: "OTP verified and account created successfully",

      hostId: hostSignUp._id,

    });

  } catch (error: any) {

    console.error("Error in verifyHostOTP:", error);

    res.status(500).json({ success: false, message: "Error verifying OTP", error: error?.message || "Unknown error" });

  }

};



export const resendHostOTP = async (req: Request, res: Response): Promise<void> => {

  try {

    const { hostId } = req.body;



    if (!hostId) {

      res.status(400).json({ success: false, message: "Host ID is required" });

      return;

    }



    const tempHostData = tempStorage.getHost(hostId);

    if (!tempHostData) {

      res.status(404).json({ success: false, message: "Registration session not found or expired" });

      return;

    }



    const otp = generateOTP();

    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);



    tempStorage.updateHost(hostId, { otp, otpExpires });



    console.log(`📱 New OTP for ${tempHostData.phoneNumber}: ${otp}`);



    res.status(200).json({ success: true, message: "OTP resent successfully", otp });

  } catch (error: any) {

    console.error("Error in resendHostOTP:", error);

    res.status(500).json({ success: false, message: "Error resending OTP", error: error?.message || "Unknown error" });

  }

};



export const submitHostIDProof = async (req: Request, res: Response): Promise<void> => {

  try {

    const { hostId, idType } = req.body;



    if (!hostId || !idType) {

      res.status(400).json({ success: false, message: "Host ID and ID type are required" });

      return;

    }



    if (!req.file) {

      res.status(400).json({ success: false, message: "ID proof file is required" });

      return;

    }



    const tempHostData = tempStorage.getHost(hostId);

    if (!tempHostData) {

      res.status(404).json({ success: false, message: "Registration session not found or expired" });

      return;

    }



    tempStorage.updateHost(hostId, {

      idType,

      idProofPath: req.file.path,

      idFileName: req.file.filename,

    });



    res.status(200).json({ success: true, message: "ID proof submitted successfully", hostId });

  } catch (error: any) {

    console.error("Error in submitHostIDProof:", error);

    res.status(500).json({ success: false, message: "Error submitting ID proof", error: error?.message || "Unknown error" });

  }

};



export const submitHostDocuments = async (req: Request, res: Response): Promise<void> => {

  try {

    const { hostId, aadharNumber, panNumber, licenseNumber } = req.body;



    // avoid Express namespace typing issues

    const files = req.files as Record<string, any>;



    if (!hostId) {

      res.status(400).json({ success: false, message: "Host ID is required" });

      return;

    }



    // Validate mandatory documents: Aadhar and PAN
    if (!files?.aadhar?.[0]) {
      res.status(400).json({ success: false, message: "Aadhar document is required" });
      return;
    }

    if (!files?.pan?.[0]) {
      res.status(400).json({ success: false, message: "PAN document is required" });
      return;
    }

    // Validate mandatory document numbers
    if (!aadharNumber) {
      res.status(400).json({ success: false, message: "Aadhar number is required" });
      return;
    }

    if (!panNumber) {
      res.status(400).json({ success: false, message: "PAN number is required" });
      return;
    }

    // Validate Aadhar number format (12 digits with hyphens)
    if (!/^\d{4}-\d{4}-\d{4}$/.test(aadharNumber)) {
      res.status(400).json({ success: false, message: "Please enter a valid Aadhar number (e.g., 0000-0000-0000)" });
      return;
    }

    // Validate PAN number format (10 characters: 5 letters, 4 digits, 1 letter)
    if (!/^[A-Z]{5}\d{4}[A-Z]{1}$/.test(panNumber.toUpperCase().replace(/\s/g, ''))) {
      res.status(400).json({ success: false, message: "Please enter a valid PAN number (e.g., ELDPK0667G)" });
      return;
    }

    // Optional: Validate license number if provided
    if (licenseNumber && !/^[A-Z]{2}\d{2}\d{4}\d{7}$/.test(licenseNumber.toUpperCase().replace(/\s/g, ''))) {
      res.status(400).json({ success: false, message: "Please enter a valid driving license number" });
      return;
    }



    const hostSignUp = await HostSignUp.findById(hostId);

    if (!hostSignUp) {

      res.status(404).json({ success: false, message: "Host registration not found" });

      return;

    }



    // Store document paths and numbers
    if (files?.aadhar?.[0]) hostSignUp.aadharPath = files.aadhar[0].path;
    if (files?.pan?.[0]) hostSignUp.panPath = files.pan[0].path;
    if (files?.license?.[0]) hostSignUp.licensePath = files.license[0].path;

    // Store document numbers
    hostSignUp.aadharNumber = aadharNumber.replace(/[-\s]/g, '');
    hostSignUp.panNumber = panNumber.toUpperCase().replace(/\s/g, '');
    if (licenseNumber) {
      hostSignUp.licenseNumber = licenseNumber.toUpperCase().replace(/\s/g, '');
    }



    const uniqueHostId = await generateUniqueHostId(

      HostSignUp as any,

      hostSignUp.state,

      hostSignUp.city,

      hostSignUp.phoneNumber

    );



    hostSignUp.hostId = uniqueHostId;

    hostSignUp.registrationCompleted = true;

    hostSignUp.termsAccepted = true;

    hostSignUp.status = "pending";



    await hostSignUp.save();



    res.status(200).json({

      success: true,

      message: "Documents submitted successfully",

      hostId: hostSignUp._id,

      hostUniqueId: uniqueHostId,

      message_detail: `Your Host ID is ${uniqueHostId}. Please save it for future reference.`,

    });

  } catch (error: any) {

    console.error("Error in submitHostDocuments:", error);

    res.status(500).json({ success: false, message: "Error submitting documents", error: error?.message || "Unknown error" });

  }

};



export const submitHostLocation = async (req: Request, res: Response): Promise<void> => {

  try {

    const { hostId, fullAddress, city, state, postalCode, latitude, longitude, landmarks } = req.body;



    if (!hostId) {

      res.status(400).json({ success: false, message: "Host ID is required" });

      return;

    }



    const hostSignUp = await HostSignUp.findById(hostId);

    if (!hostSignUp) {

      res.status(404).json({ success: false, message: "Host registration not found" });

      return;

    }



    hostSignUp.propertyFullAddress = fullAddress;

    hostSignUp.propertyCity = city;

    hostSignUp.propertyState = state;

    hostSignUp.propertyPostalCode = postalCode;

    hostSignUp.latitude = latitude;

    hostSignUp.longitude = longitude;

    hostSignUp.landmarks = landmarks || "";



    await hostSignUp.save();



    res.status(200).json({ success: true, message: "Location details submitted successfully", hostId: hostSignUp._id });

  } catch (error: any) {

    console.error("Error in submitHostLocation:", error);

    res.status(500).json({ success: false, message: "Error submitting location", error: error?.message || "Unknown error" });

  }

};



export const completeHostRegistration = async (req: Request, res: Response): Promise<void> => {

  try {

    const { hostId, termsAccepted } = req.body;



    if (!hostId) {

      res.status(400).json({ success: false, message: "Host ID is required" });

      return;

    }



    const hostSignUp = await HostSignUp.findById(hostId);

    if (!hostSignUp) {

      res.status(404).json({ success: false, message: "Host registration not found" });

      return;

    }



    if (!termsAccepted) {

      res.status(400).json({ success: false, message: "You must accept terms and conditions" });

      return;

    }



    hostSignUp.termsAccepted = true;

    hostSignUp.registrationCompleted = true;

    hostSignUp.status = "pending";



    await hostSignUp.save();



    res.status(200).json({

      success: true,

      message: "Host registration completed successfully",

      hostId: hostSignUp._id,

      message_detail: "Your registration is under review. We will notify you once approved.",

    });

  } catch (error: any) {

    console.error("Error in completeHostRegistration:", error);

    res.status(500).json({ success: false, message: "Error completing registration", error: error?.message || "Unknown error" });

  }

};



export const getHostDetails = async (req: Request, res: Response): Promise<void> => {

  try {

    const { hostId } = req.params;



    const hostSignUp = await HostSignUp.findById(hostId);

    if (!hostSignUp) {

      res.status(404).json({ success: false, message: "Host registration not found" });

      return;

    }



    res.status(200).json({ success: true, data: hostSignUp });

  } catch (error: any) {

    console.error("Error in getHostDetails:", error);

    res.status(500).json({ success: false, message: "Error fetching host details", error: error?.message || "Unknown error" });

  }

};

