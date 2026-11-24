
import express from "express";

import {
  createBuyer,
  createFarmer,
  getBuyers,
  getBuyerById,
  updateBuyerStatus,
  getFarmers,
  getFarmerById,
  requestFarmerPhoneVerification,
  verifyFarmerPhone,
} from "../controllers/userController.js";

import {
  protect,
  authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// OWNER ROUTES
// ==========================================

// Owner manages their own buyers.
router.get(
  "/buyers",
  protect,
  authorize("owner"),
  getBuyers
);

router.get(
  "/buyers/:id",
  protect,
  authorize("owner"),
  getBuyerById
);

router.patch(
  "/buyers/:id/status",
  protect,
  authorize("owner"),
  updateBuyerStatus
);

router.post(
  "/buyers",
  protect,
  authorize("owner"),
  createBuyer
);

// ==========================================
// BUYER ROUTES
// ==========================================

// Buyer manages farmer accounts.
router.post(
  "/farmers",
  protect,
  authorize("buyer"),
  createFarmer
);

router.get(
  "/farmers",
  protect,
  authorize("buyer"),
  getFarmers
);

router.get(
  "/farmers/:id",
  protect,
  authorize("buyer"),
  getFarmerById
);

// ==========================================
// FARMER PHONE VERIFICATION ROUTES
// ==========================================

// Farmer requests an OTP.
router.post(
  "/farmers/phone-verification/request",
  protect,
  authorize("farmer"),
  requestFarmerPhoneVerification
);

// Farmer submits OTP for verification.
router.post(
  "/farmers/phone-verification/verify",
  protect,
  authorize("farmer"),
  verifyFarmerPhone
);

export default router;
