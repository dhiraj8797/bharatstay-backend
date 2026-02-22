import { Request, Response } from "express";
import { validationResult } from "express-validator";
import HostBankDetails from "../models/HostBankDetails";

/**
 * Get Bank Details for a Host
 */
export const getBankDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hostId } = req.params;

    if (!hostId) {
      res.status(400).json({ success: false, message: "Host ID is required" });
      return;
    }

    const bankDetails = await HostBankDetails.findOne({ hostId });

    if (!bankDetails) {
      res.status(404).json({
        success: false,
        message: "Bank details not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: bankDetails,
    });
  } catch (error: any) {
    console.error("Error fetching bank details:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching bank details",
      error: error?.message || "Unknown error",
    });
  }
};

/**
 * Create or Update Bank Details for a Host
 */
export const saveBankDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const {
      hostId,
      bankName,
      accountNumber,
      ifscCode,
      accountHolderName,
      upiId,
      autoWithdraw,
    } = req.body;

    if (!hostId) {
      res.status(400).json({ success: false, message: "Host ID is required" });
      return;
    }

    // Check if bank details already exist for this host
    let bankDetails = await HostBankDetails.findOne({ hostId });

    if (bankDetails) {
      // Update existing
      bankDetails.bankName = bankName || bankDetails.bankName;
      bankDetails.accountNumber = accountNumber || bankDetails.accountNumber;
      bankDetails.ifscCode = ifscCode || bankDetails.ifscCode;
      bankDetails.accountHolderName = accountHolderName || bankDetails.accountHolderName;
      bankDetails.upiId = upiId || bankDetails.upiId;
      bankDetails.autoWithdraw = autoWithdraw !== undefined ? autoWithdraw : bankDetails.autoWithdraw;
    } else {
      // Create new
      bankDetails = new HostBankDetails({
        hostId,
        bankName,
        accountNumber,
        ifscCode,
        accountHolderName,
        upiId,
        autoWithdraw: autoWithdraw || false,
      });
    }

    await bankDetails.save();

    res.status(200).json({
      success: true,
      message: "Bank details saved successfully",
      data: bankDetails,
    });
  } catch (error: any) {
    console.error("Error saving bank details:", error);
    res.status(500).json({
      success: false,
      message: "Error saving bank details",
      error: error?.message || "Unknown error",
    });
  }
};

/**
 * Update Bank Details (partial update)
 */
export const updateBankDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { hostId } = req.params;
    const { bankName, accountNumber, ifscCode, accountHolderName, upiId, autoWithdraw } = req.body;

    if (!hostId) {
      res.status(400).json({ success: false, message: "Host ID is required" });
      return;
    }

    const bankDetails = await HostBankDetails.findOneAndUpdate(
      { hostId },
      {
        $set: {
          bankName,
          accountNumber,
          ifscCode,
          accountHolderName,
          upiId,
          autoWithdraw,
        },
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Bank details updated successfully",
      data: bankDetails,
    });
  } catch (error: any) {
    console.error("Error updating bank details:", error);
    res.status(500).json({
      success: false,
      message: "Error updating bank details",
      error: error?.message || "Unknown error",
    });
  }
};

/**
 * Delete Bank Details
 */
export const deleteBankDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hostId } = req.params;

    if (!hostId) {
      res.status(400).json({ success: false, message: "Host ID is required" });
      return;
    }

    const result = await HostBankDetails.findOneAndDelete({ hostId });

    if (!result) {
      res.status(404).json({
        success: false,
        message: "Bank details not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Bank details deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting bank details:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting bank details",
      error: error?.message || "Unknown error",
    });
  }
};
