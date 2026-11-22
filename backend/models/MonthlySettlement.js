
import mongoose from "mongoose";

const repaymentAllocationSchema = new mongoose.Schema(
  {
    loan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const monthlySettlementSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    month: {
      type: String,
      required: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/,
    },

    milkNetEarnings: {
      type: Number,
      required: true,
      min: 0,
    },

    loanDeduction: {
      type: Number,
      required: true,
      min: 0,
    },

    finalPayment: {
      type: Number,
      required: true,
      min: 0,
    },

    outstandingBefore: {
      type: Number,
      required: true,
      min: 0,
    },

    outstandingAfter: {
      type: Number,
      required: true,
      min: 0,
    },

    repaymentAllocations: {
      type: [repaymentAllocationSchema],
      default: [],
    },

    settledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    settledAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// One settlement per farmer per month.
// This is the main protection against duplicate deductions.
monthlySettlementSchema.index(
  { farmer: 1, month: 1 },
  { unique: true }
);

monthlySettlementSchema.index({ owner: 1, month: 1 });

const MonthlySettlement = mongoose.model(
  "MonthlySettlement",
  monthlySettlementSchema
);

export default MonthlySettlement;
