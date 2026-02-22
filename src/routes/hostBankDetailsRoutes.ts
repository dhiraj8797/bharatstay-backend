import { Router } from "express";
import { body } from "express-validator";
import * as hostBankDetailsController from "../controllers/hostBankDetailsController";

const router = Router();

// Get bank details for a host
router.get("/:hostId", hostBankDetailsController.getBankDetails);

// Save or update bank details
router.post(
  "/",
  [
    body("hostId").notEmpty().withMessage("Host ID is required"),
    body("bankName").optional().trim(),
    body("accountNumber").optional().trim(),
    body("ifscCode").optional().trim(),
    body("accountHolderName").optional().trim(),
    body("upiId").optional().trim(),
    body("autoWithdraw").optional().isBoolean(),
  ],
  hostBankDetailsController.saveBankDetails
);

// Update bank details (partial update)
router.put(
  "/:hostId",
  [
    body("bankName").optional().trim(),
    body("accountNumber").optional().trim(),
    body("ifscCode").optional().trim(),
    body("accountHolderName").optional().trim(),
    body("upiId").optional().trim(),
    body("autoWithdraw").optional().isBoolean(),
  ],
  hostBankDetailsController.updateBankDetails
);

// Delete bank details
router.delete("/:hostId", hostBankDetailsController.deleteBankDetails);

export default router;
