
import express from "express";

import {
  settleFarmerMonth,
  getMySettlements,
} from "../controllers/settlementController.js";

import {
  protect,
  authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Farmer views their own monthly settlement history.
router.get(
  "/my-settlements",
  protect,
  authorize("farmer"),
  getMySettlements
);

// Owner finalizes one farmer's monthly payment.
router.post(
  "/:month/farmers/:farmerId",
  protect,
  authorize("owner"),
  settleFarmerMonth
);

export default router;
