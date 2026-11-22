
import mongoose from "mongoose";

const priceHistorySchema = new mongoose.Schema(
  {
    pricePerLitre: {
      type: Number,
      required: true,
      min: 0.01,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const milkPriceSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "default",
      unique: true,
    },
    pricePerLitre: {
      type: Number,
      required: true,
      min: 0.01,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    priceHistory: {
      type: [priceHistorySchema],
      default: [],
    },
  },
  { timestamps: true }
);

const MilkPrice = mongoose.model("MilkPrice", milkPriceSchema);

export default MilkPrice;
