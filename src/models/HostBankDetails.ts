import mongoose, { Schema, Document } from "mongoose";

export interface IHostBankDetails extends Document {
  hostId: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  upiId: string;
  autoWithdraw: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HostBankDetailsSchema = new Schema<IHostBankDetails>(
  {
    hostId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    bankName: {
      type: String,
      required: false,
      trim: true,
    },
    accountNumber: {
      type: String,
      required: false,
      trim: true,
    },
    ifscCode: {
      type: String,
      required: false,
      trim: true,
    },
    accountHolderName: {
      type: String,
      required: false,
      trim: true,
    },
    upiId: {
      type: String,
      required: false,
      trim: true,
    },
    autoWithdraw: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const HostBankDetails = mongoose.model<IHostBankDetails>(
  "HostBankDetails",
  HostBankDetailsSchema
);

export default HostBankDetails;
