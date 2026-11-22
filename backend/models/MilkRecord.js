
import mongoose from "mongoose";

const milkRecordSchema = new mongoose.Schema(
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

    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Malawi calendar date: YYYY-MM-DD.
    recordDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    quantityLitres: {
      type: Number,
      required: true,
      min: 0.01,
    },

    // Financial snapshots captured when this record is created.
    pricePerLitre: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    grossAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    taxRate: {
      type: Number,
      required: true,
      default: 0.01,
    },

    taxAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    welfareDeduction: {
      type: Number,
      required: true,
      min: 0,
      default: 350,
    },

    netAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    sodaTest: {
      type: String,
      enum: ["pass", "fail"],
      required: true,
    },

    temperatureC: {
      type: Number,
      required: true,
      min: -100,
      max: 200,
    },

    sourTest: {
      type: String,
      enum: ["yes", "no"],
      required: true,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  { timestamps: true }
);

// One milk entry per farmer per calendar date.
milkRecordSchema.index(
  { farmer: 1, recordDate: 1 },
  { unique: true }
);

milkRecordSchema.index({ buyer: 1, recordDate: 1 });

milkRecordSchema.index({ recordDate: 1 });

const MilkRecord = mongoose.model("MilkRecord", milkRecordSchema);

export default MilkRecord;
