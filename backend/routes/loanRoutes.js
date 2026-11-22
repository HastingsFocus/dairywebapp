
import express from "express";

import {
  requestLoan,
  getMyLoans,
  getOwnerLoans,
  approveLoan,
  rejectLoan,
  disburseLoan,
} from "../controllers/loanController.js";

import {
  protect,
  authorize,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Farmer endpoints
router.post(
  "/",
  protect,
  authorize("farmer"),
  requestLoan
);

router.get(
  "/my-loans",
  protect,
  authorize("farmer"),
  getMyLoans
);

// Owner endpoints
router.get(
  "/",
  protect,
  authorize("owner"),
  getOwnerLoans
);

router.patch(
  "/:id/approve",
  protect,
  authorize("owner"),
  approveLoan
);

router.patch(
  "/:id/reject",
  protect,
  authorize("owner"),
  rejectLoan
);

router.patch(
  "/:id/disburse",
  protect,
  authorize("owner"),
  disburseLoan
);

export default router;
