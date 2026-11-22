
import MilkPrice from "../models/MilkPrice.js";

export const getCurrentMilkPrice = async (req, res) => {
  try {
    const settings = await MilkPrice.findOne({ key: "default" })
      .populate("updatedBy", "fullName email")
      .lean();

    if (!settings) {
      return res.status(200).json({
        configured: false,
        message: "The owner has not configured the milk buying price yet.",
        pricePerLitre: null,
        priceHistory: [],
      });
    }

    return res.status(200).json({
      configured: true,
      pricePerLitre: settings.pricePerLitre,
      updatedAt: settings.updatedAt,
      updatedBy: settings.updatedBy,
      priceHistory: settings.priceHistory,
    });
  } catch (error) {
    console.error("Get milk price error:", error);

    return res.status(500).json({
      message: "Unable to retrieve the milk buying price.",
    });
  }
};

export const updateMilkPrice = async (req, res) => {
  try {
    const price = Number(req.body.pricePerLitre);

    if (
      req.body.pricePerLitre === "" ||
      req.body.pricePerLitre === null ||
      req.body.pricePerLitre === undefined ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      return res.status(400).json({
        message: "Enter a valid milk buying price greater than zero.",
      });
    }

    const settings = await MilkPrice.findOneAndUpdate(
      { key: "default" },
      {
        $set: {
          pricePerLitre: price,
          updatedBy: req.user._id,
        },
        $setOnInsert: {
          key: "default",
        },
        $push: {
          priceHistory: {
            pricePerLitre: price,
            changedBy: req.user._id,
            effectiveFrom: new Date(),
          },
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    ).populate("updatedBy", "fullName email");

    return res.status(200).json({
      message: "Milk buying price updated successfully.",
      configured: true,
      pricePerLitre: settings.pricePerLitre,
      updatedAt: settings.updatedAt,
      updatedBy: settings.updatedBy,
      priceHistory: settings.priceHistory,
    });
  } catch (error) {
    console.error("Update milk price error:", error);

    return res.status(500).json({
      message: "Unable to update the milk buying price.",
    });
  }
};
