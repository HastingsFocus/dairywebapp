
import express from "express";

import {
  setUssdPin,
  changeUssdPin,
  loginFarmerUssd,
} from "../controllers/ussdAuthController.js";

import {
  handleUssdCallback,
} from "../controllers/ussdController.js";

import {
  protect,
  authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// USSD GATEWAY CALLBACK
// ==========================================

router.post(
  "/callback",
  handleUssdCallback
);

// ==========================================
// FARMER USSD PIN MANAGEMENT
// ==========================================

// Farmer sets their first USSD PIN
router.post(
  "/pin/set",
  protect,
  authorize("farmer"),
  setUssdPin
);

// Farmer changes their existing USSD PIN
router.put(
  "/pin/change",
  protect,
  authorize("farmer"),
  changeUssdPin
);

// Farmer authenticates using phone number and PIN
router.post(
  "/login",
  loginFarmerUssd
);

export default router;
