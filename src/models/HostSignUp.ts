import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

let hostDataConnection: mongoose.Connection;
let userDataConnection: mongoose.Connection;

export const getConnections = () => {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    throw new Error("MONGO_URI is not defined in environment variables");
  }
  if (!hostDataConnection) {
    hostDataConnection = mongoose.createConnection(MONGO_URI);
    userDataConnection = mongoose.createConnection(MONGO_URI);
  }
  return { hostDataConnection, userDataConnection };
};

export interface IHostSignUp extends Document {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  firebaseUid?: string;
  dateOfBirth: Date;
  state: string;
  city: string;
  pincode: string;
  aadharPath?: string;
  aadharNumber?: string;
  panPath?: string;
  panNumber?: string;
  licensePath?: string;
  licenseNumber?: string;
  propertyFullAddress?: string;
  propertyCity?: string;
  propertyState?: string;
  propertyPostalCode?: string;
  latitude?: number;
  longitude?: number;
  landmarks?: string;
  otpVerified?: boolean;
  termsAccepted: boolean;
  status: "pending" | "verified" | "rejected" | "approved";
  registrationCompleted: boolean;
  hostId?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const hostSignUpSchema = new Schema<IHostSignUp>({
  fullName: {
    type: String,
    required: [true, "Full name is required"],
    trim: true,
    minlength: [2, "Full name must be at least 2 characters"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
  },
  phoneNumber: {
    type: String,
    required: [true, "Phone number is required"],
    unique: true,
    match: [/^\d{10}$/, "Phone number must be 10 digits"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
    select: false,
  },
  firebaseUid: {
    type: String,
    sparse: true,
  },
  dateOfBirth: {
    type: Date,
    required: [true, "Date of birth is required"],
    validate: {
      validator: function (value: Date) {
        const age = new Date().getFullYear() - value.getFullYear();
        return age >= 18;
      },
      message: "You must be at least 18 years old",
    },
  },
  state: {
    type: String,
    required: [true, "State is required"],
    trim: true,
  },
  city: {
    type: String,
    required: [true, "City is required"],
    trim: true,
  },
  pincode: {
    type: String,
    required: [true, "Pincode is required"],
    match: [/^\d{6}$/, "Pincode must be 6 digits"],
  },
  aadharPath: { type: String, default: "" },
  aadharNumber: { type: String, default: "" },
  panPath: { type: String, default: "" },
  panNumber: { type: String, default: "" },
  licensePath: { type: String, default: "" },
  licenseNumber: { type: String, default: "" },
  propertyFullAddress: { type: String, default: "" },
  propertyCity: { type: String, default: "" },
  propertyState: { type: String, default: "" },
  propertyPostalCode: { type: String, default: "" },
  latitude: { type: Number, default: 0 },
  longitude: { type: Number, default: 0 },
  landmarks: { type: String, default: "" },
  otpVerified: { type: Boolean, default: false },
  termsAccepted: {
    type: Boolean,
    required: [true, "You must accept terms and conditions"],
    default: false,
  },
  status: {
    type: String,
    enum: ["pending", "verified", "rejected", "approved"],
    default: "pending",
  },
  registrationCompleted: { type: Boolean, default: false },
  hostId: { type: String, unique: true, sparse: true, trim: true, uppercase: true },
}, { timestamps: true });

hostSignUpSchema.pre<IHostSignUp>("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

hostSignUpSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const HostSignUp = (() => {
  const { hostDataConnection } = getConnections();
  return hostDataConnection.model<IHostSignUp>("HostSignUp", hostSignUpSchema, "hostsignupdata");
})();

export default HostSignUp;
