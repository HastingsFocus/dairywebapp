
import express from "express";
import {
  createBuyer,
  createFarmer,
  getBuyers,
  getBuyerById,
  updateBuyerStatus,
  getFarmers,
  getFarmerById,
} from "../controllers/userController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Owner manages their own buyers.
router.get("/buyers", protect, authorize("owner"), getBuyers);
router.get("/buyers/:id", protect, authorize("owner"), getBuyerById);
router.patch("/buyers/:id/status", protect, authorize("owner"), updateBuyerStatus);
router.post("/buyers", protect, authorize("owner"), createBuyer);

// Buyer manages farmer creation.
router.post("/farmers", protect, authorize("buyer"), createFarmer);
router.get("/farmers", protect, authorize("buyer"), getFarmers);
router.get("/farmers/:id", protect, authorize("buyer"), getFarmerById);

export default router;
