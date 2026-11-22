
import mongoose from "mongoose";

const repaymentSchema = new mongoose.Schema(
  {
    month: {
      type: String,
      required: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const loanSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    requestedAmount: {
      type: Number,
      required: true,
      min: 1,
    },

    approvedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    disbursedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    outstandingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "disbursed",
        "repaid",
      ],
      default: "pending",
      index: true,
    },

    ownerNotes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reviewedAt: {
      type: Date,
    },

    disbursedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    disbursedAt: {
      type: Date,
    },

    repayments: {
      type: [repaymentSchema],
      default: [],
    },
  },
  { timestamps: true }
);

loanSchema.index({ farmer: 1, createdAt: -1 });
loanSchema.index({ owner: 1, status: 1 });

const Loan = mongoose.model("Loan", loanSchema);

export default Loan;
