import mongoose from "mongoose";
import MilkRecord from "../models/MilkRecord.js";
import User from "../models/User.js";
import MilkPrice from "../models/MilkPrice.js";

const getMalawiDate = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Blantyre",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
};

const isValidCalendarDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const isValidMonth = (value) => {
  if (!/^\d{4}-\d{2}$/.test(value || "")) {
    return false;
  }

  const [year, month] = value.split("-").map(Number);

  return year >= 1000 && month >= 1 && month <= 12;
};

const roundMoney = (amount) => Number(amount.toFixed(2));

const calculateMilkEarnings = (quantityLitres, pricePerLitre) => {
  const taxRate = 0.01;
  const welfareDeduction = 350;

  const grossAmount = roundMoney(quantityLitres * pricePerLitre);
  const taxAmount = roundMoney(grossAmount * taxRate);
  const netAmount = roundMoney(
    grossAmount - taxAmount - welfareDeduction
  );

  return {
    pricePerLitre,
    grossAmount,
    taxRate,
    taxAmount,
    welfareDeduction,
    netAmount,
  };
};

// Return the farmers the logged-in user is allowed to access.
const getAccessibleFarmers = async (user) => {
  if (user.role === "farmer") {
    return User.find({
      _id: user._id,
      role: "farmer",
    })
      .select("_id fullName email phone location createdBy")
      .lean();
  }

  if (user.role === "buyer") {
    return User.find({
      role: "farmer",
      createdBy: user._id,
    })
      .select("_id fullName email phone location createdBy")
      .lean();
  }

  if (user.role === "owner") {
    const buyers = await User.find({
      role: "buyer",
      createdBy: user._id,
    })
      .select("_id")
      .lean();

    const buyerIds = buyers.map((buyer) => buyer._id);

    return User.find({
      role: "farmer",
      createdBy: { $in: buyerIds },
    })
      .select("_id fullName email phone location createdBy")
      .lean();
  }

  return [];
};

const validRecordFields = (body) => {
  const quantity = Number(body.quantityLitres);
  const temperature = Number(body.temperatureC);

  if (
    body.quantityLitres === "" ||
    body.quantityLitres === null ||
    body.quantityLitres === undefined ||
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    return "Milk quantity must be a number greater than zero.";
  }

  if (
    body.temperatureC === "" ||
    body.temperatureC === null ||
    body.temperatureC === undefined ||
    !Number.isFinite(temperature) ||
    temperature < -100 ||
    temperature > 200
  ) {
    return "Enter a valid temperature in degrees Celsius.";
  }

  if (!["pass", "fail"].includes(body.sodaTest)) {
    return "Soda test must be pass or fail.";
  }

  if (!["yes", "no"].includes(body.sourTest)) {
    return "Sour test must be yes or no.";
  }

  if (
    body.notes !== undefined &&
    (typeof body.notes !== "string" || body.notes.length > 500)
  ) {
    return "Notes must be text no longer than 500 characters.";
  }

  return null;
};

const serializeRecord = (record) => ({
  ...record,
  quantityLitres: Number(record.quantityLitres),
  temperatureC: Number(record.temperatureC),
});

export const createMilkRecord = async (req, res) => {
  try {
    const {
      farmerId,
      recordDate,
      quantityLitres,
      sodaTest,
      temperatureC,
      sourTest,
      notes,
    } = req.body;

    if (!mongoose.isValidObjectId(farmerId)) {
      return res.status(400).json({
        message: "Please select a valid farmer.",
      });
    }

    const date = recordDate || getMalawiDate();

    if (!isValidCalendarDate(date)) {
      return res.status(400).json({
        message: "Record date must be a valid date in YYYY-MM-DD format.",
      });
    }

    const validationError = validRecordFields({
      quantityLitres,
      sodaTest,
      temperatureC,
      sourTest,
      notes,
    });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    // A buyer can only record milk for farmers assigned to that buyer.
    const farmer = await User.findOne({
      _id: farmerId,
      role: "farmer",
      createdBy: req.user._id,
    }).select("_id");

    if (!farmer) {
      return res.status(404).json({
        message: "Farmer not found in your assigned farmers.",
      });
    }

    // Get the current buying price configured by the owner.
const currentPrice = await MilkPrice.findOne({ key: "default" });

if (!currentPrice) {
  return res.status(409).json({
    message:
      "The milk buying price has not been configured. Please contact the owner.",
  });
}

const quantity = Number(quantityLitres);

const earnings = calculateMilkEarnings(
  quantity,
  currentPrice.pricePerLitre
);

const record = await MilkRecord.create({
  farmer: farmer._id,
  buyer: req.user._id,
  recordedBy: req.user._id,
  recordDate: date,
  quantityLitres: quantity,

  ...earnings,

  sodaTest,
  temperatureC: Number(temperatureC),
  sourTest,
  notes: notes?.trim() || "",
});

    const populatedRecord = await MilkRecord.findById(record._id)
      .populate("farmer", "fullName email phone location")
      .populate("recordedBy", "fullName email")
      .lean();

    return res.status(201).json({
      message: "Milk record saved successfully.",
      record: serializeRecord(populatedRecord),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "A milk record already exists for this farmer on this date. Please edit the existing record instead.",
      });
    }

    console.error("Create milk record error:", error);

    return res.status(500).json({
      message: "Unable to save the milk record.",
    });
  }
};

export const getMilkRecords = async (req, res) => {
  try {
    const date = req.query.date;
    const month = req.query.month;

    if (date && month) {
      return res.status(400).json({
        message: "Use either date or month, not both.",
      });
    }

    if (date && !isValidCalendarDate(date)) {
      return res.status(400).json({
        message: "Date must be a valid YYYY-MM-DD date.",
      });
    }

    if (month && !isValidMonth(month)) {
      return res.status(400).json({
        message: "Month must be in YYYY-MM format.",
      });
    }

    const selectedDate = date || (!month ? getMalawiDate() : null);

    const farmers = await getAccessibleFarmers(req.user);
    const farmerIds = farmers.map((farmer) => farmer._id);

    const query = {
      farmer: { $in: farmerIds },
    };

    if (selectedDate) {
      query.recordDate = selectedDate;
    } else if (month) {
      query.recordDate = {
        $gte: `${month}-01`,
        $lte: `${month}-31`,
      };
    }

    const records = await MilkRecord.find(query)
      .populate("farmer", "fullName email phone location")
      .populate("recordedBy", "fullName email")
      .sort({ recordDate: -1, createdAt: -1 })
      .lean();

    const formattedRecords = records.map(serializeRecord);

    const totalLitres = formattedRecords.reduce(
      (total, record) => total + record.quantityLitres,
      0
    );

    return res.status(200).json({
      count: formattedRecords.length,
      date: selectedDate,
      month: month || null,
      totalLitres: Number(totalLitres.toFixed(2)),
      records: formattedRecords,
    });
  } catch (error) {
    console.error("Get milk records error:", error);

    return res.status(500).json({
      message: "Unable to retrieve milk records.",
    });
  }
};

export const getMilkSummary = async (req, res) => {
  try {
    const date = req.query.date || getMalawiDate();

    if (!isValidCalendarDate(date)) {
      return res.status(400).json({
        message: "Date must be a valid YYYY-MM-DD date.",
      });
    }

    const monthStart = `${date.slice(0, 7)}-01`;
    const farmers = await getAccessibleFarmers(req.user);
    const farmerIds = farmers.map((farmer) => farmer._id);

    const monthlyRecords = await MilkRecord.find({
      farmer: { $in: farmerIds },
      recordDate: {
        $gte: monthStart,
        $lte: date,
      },
    })
      .select("farmer recordDate quantityLitres")
      .lean();

    const dailyByFarmer = new Map();
    const monthByFarmer = new Map();
    let dailyTotalLitres = 0;
    let monthToDateTotalLitres = 0;

    for (const record of monthlyRecords) {
      const quantity = Number(record.quantityLitres);
      const farmerId = record.farmer.toString();

      monthToDateTotalLitres += quantity;
      monthByFarmer.set(
        farmerId,
        (monthByFarmer.get(farmerId) || 0) + quantity
      );

      if (record.recordDate === date) {
        dailyTotalLitres += quantity;
        dailyByFarmer.set(
          farmerId,
          (dailyByFarmer.get(farmerId) || 0) + quantity
        );
      }
    }

    const farmerSummaries = farmers.map((farmer) => {
      const id = farmer._id.toString();

      return {
        farmerId: farmer._id,
        fullName: farmer.fullName,
        email: farmer.email,
        dailyTotalLitres: Number((dailyByFarmer.get(id) || 0).toFixed(2)),
        monthToDateTotalLitres: Number(
          (monthByFarmer.get(id) || 0).toFixed(2)
        ),
      };
    });

    return res.status(200).json({
      date,
      month: date.slice(0, 7),
      dailyTotalLitres: Number(dailyTotalLitres.toFixed(2)),
      monthToDateTotalLitres: Number(
        monthToDateTotalLitres.toFixed(2)
      ),
      farmerCount: farmers.length,
      farmersWithRecords: dailyByFarmer.size,
      farmers: farmerSummaries,
    });
  } catch (error) {
    console.error("Get milk summary error:", error);

    return res.status(500).json({
      message: "Unable to calculate milk totals.",
    });
  }
};


export const updateMilkRecord = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid milk record ID.",
      });
    }

    const record = await MilkRecord.findOne({
      _id: req.params.id,
      buyer: req.user._id,
    });

    if (!record) {
      return res.status(404).json({
        message: "Milk record not found in your records.",
      });
    }

    // Editing is restricted to the current Malawi calendar month.
    const currentMonth = getMalawiDate().slice(0, 7);

    if (!record.recordDate.startsWith(`${currentMonth}-`)) {
      return res.status(403).json({
        message: "Only records from the current month can be edited.",
      });
    }

    // Validate the submitted milk record fields.
    const validationError = validRecordFields(req.body);

    if (validationError) {
      return res.status(400).json({
        message: validationError,
      });
    }

    // Older records without a saved buying price cannot be
    // financially recalculated safely.
    if (
      !Number.isFinite(record.pricePerLitre) ||
      record.pricePerLitre <= 0
    ) {
      return res.status(409).json({
        message:
          "This older record has no saved buying price. Its financial details must be reviewed before editing.",
      });
    }

    // Update quantity using the original saved buying price.
    record.quantityLitres = Number(req.body.quantityLitres);

    const earnings = calculateMilkEarnings(
      record.quantityLitres,
      record.pricePerLitre
    );

    // Recalculate financial values without changing the original price.
    record.grossAmount = earnings.grossAmount;
    record.taxRate = earnings.taxRate;
    record.taxAmount = earnings.taxAmount;
    record.welfareDeduction = earnings.welfareDeduction;
    record.netAmount = earnings.netAmount;

    // Update milk quality information.
    record.sodaTest = req.body.sodaTest;
    record.temperatureC = Number(req.body.temperatureC);
    record.sourTest = req.body.sourTest;

    if (req.body.notes !== undefined) {
      record.notes = req.body.notes.trim();
    }

    await record.save();

    const updatedRecord = await MilkRecord.findById(record._id)
      .populate("farmer", "fullName email phone location")
      .populate("recordedBy", "fullName email")
      .lean();

    return res.status(200).json({
      message: "Milk record updated successfully.",
      record: serializeRecord(updatedRecord),
    });
  } catch (error) {
    console.error("Update milk record error:", error);

    return res.status(500).json({
      message: "Unable to update the milk record.",
    });
  }
};


export const deleteMilkRecord = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid milk record ID.",
      });
    }

    const record = await MilkRecord.findOne({
      _id: req.params.id,
      buyer: req.user._id,
    });

    if (!record) {
      return res.status(404).json({
        message: "Milk record not found in your records.",
      });
    }

    const currentMonth = getMalawiDate().slice(0, 7);

    if (!record.recordDate.startsWith(`${currentMonth}-`)) {
      return res.status(403).json({
        message: "Only records from the current month can be deleted.",
      });
    }

    await record.deleteOne();

    return res.status(200).json({
      message: "Milk record deleted successfully.",
      id: req.params.id,
    });
  } catch (error) {
    console.error("Delete milk record error:", error);

    return res.status(500).json({
      message: "Unable to delete the milk record.",
    });
  }
};
