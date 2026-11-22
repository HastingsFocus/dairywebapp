import express from "express";
import { getFinancialReport } from "../controllers/financialReportController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, authorize("owner"), getFinancialReport);

export default router;