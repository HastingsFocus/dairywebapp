
import express from "express";

import {
  getCurrentMilkPrice,
  updateMilkPrice,
} from "../controllers/milkPriceController.js";

import {
  protect,
  authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Only the owner can view or change the buying price.
router.get("/current", protect, authorize("owner"), getCurrentMilkPrice);
router.put("/current", protect, authorize("owner"), updateMilkPrice);

export default router;
