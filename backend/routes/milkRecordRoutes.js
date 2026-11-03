import express from "express";
import {
  createMilkRecord,
  getMilkRecords,
  getMilkSummary,
  updateMilkRecord,
  deleteMilkRecord,
} from "../controllers/milkRecordController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Buyers create records for their assigned farmers.
router.post(
  "/",
  protect,
  authorize("buyer"),
  createMilkRecord
);

// Owners, buyers, and farmers can view records within their own scope.
router.get(
  "/",
  protect,
  authorize("owner", "buyer", "farmer"),
  getMilkRecords
);

router.get(
  "/summary",
  protect,
  authorize("owner", "buyer", "farmer"),
  getMilkSummary
);

// Buyers can edit or delete their own records from the current month.
router.put(
  "/:id",
  protect,
  authorize("buyer"),
  updateMilkRecord
);

router.delete(
  "/:id",
  protect,
  authorize("buyer"),
  deleteMilkRecord
);

export default router;
