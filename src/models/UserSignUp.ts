import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";
import { getConnections } from './HostSignUp';

export interface IUserSignUp extends Document {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  firebaseUid?: string;
  otp?: string;
  otpExpires?: Date;
  otpVerified?: boolean;
  termsAccepted: boolean;
  status: "active" | "inactive" | "suspended";
  registrationCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSignUpSchema = new Schema<IUserSignUp>(
  {
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
      default: null,
    },
    otp: { type: String, select: false },
    otpExpires: { type: Date, select: false },
    otpVerified: { type: Boolean, default: false },
    termsAccepted: {
      type: Boolean,
      required: [true, "You must accept terms and conditions"],
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    registrationCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userSignUpSchema.pre<IUserSignUp>("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

userSignUpSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const UserSignUp = (() => {
  const { userDataConnection } = getConnections();
  return userDataConnection.model<IUserSignUp>(
    "UserSignUp",
    userSignUpSchema,
    "usersignupdata"
  );
})();

export default UserSignUp;
