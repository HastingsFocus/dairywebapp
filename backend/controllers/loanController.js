
import Loan from "../models/Loan.js";
import MilkRecord from "../models/MilkRecord.js";
import User from "../models/User.js";

const LOAN_ELIGIBILITY_RATE = 0.5;

// Current month according to Malawi time.
const getCurrentMalawiMonth = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Blantyre",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year").value;
  const month = parts.find((part) => part.type === "month").value;

  return `${year}-${month}`;
};

const roundMoney = (value) =>
  Number(Number(value || 0).toFixed(2));

// Confirm that a farmer belongs to the requesting owner.
const getFarmerForOwner = async (farmerId, ownerId) => {
  const farmer = await User.findOne({
    _id: farmerId,
    role: "farmer",
  });

  if (!farmer) return null;

  const buyer = await User.findOne({
    _id: farmer.createdBy,
    role: "buyer",
    createdBy: ownerId,
  });

  if (!buyer) return null;

  return { farmer, buyer };
};

// Calculate the farmer's current loan eligibility.
const calculateLoanEligibility = async (farmerId) => {
  const month = getCurrentMalawiMonth();

  // Only use milk records with saved financial calculations.
  const records = await MilkRecord.find({
    farmer: farmerId,
    recordDate: { $regex: `^${month}` },
    pricePerLitre: { $gt: 0 },
  }).select("netAmount pricePerLitre grossAmount taxAmount welfareDeduction");

  const accruedNetEarnings = roundMoney(
    records.reduce((total, record) => {
      const hasSavedFinancialData =
        record.grossAmount !== undefined &&
        record.grossAmount !== null &&
        record.taxAmount !== undefined &&
        record.taxAmount !== null &&
        record.welfareDeduction !== undefined &&
        record.welfareDeduction !== null &&
        record.netAmount !== undefined &&
        record.netAmount !== null;

      return hasSavedFinancialData
        ? total + Number(record.netAmount)
        : total;
    }, 0)
  );

  // Approved loans reserve their approved amount.
  // Disbursed loans reserve only their outstanding balance.
  const existingLoans = await Loan.find({
    farmer: farmerId,
    status: { $in: ["approved", "disbursed"] },
  }).select("status approvedAmount outstandingBalance");

  const committedLoanAmount = roundMoney(
    existingLoans.reduce((total, loan) => {
      if (loan.status === "approved") {
        return total + Number(loan.approvedAmount || 0);
      }

      return total + Number(loan.outstandingBalance || 0);
    }, 0)
  );

  const maximumLoan = roundMoney(
    Math.max(0, accruedNetEarnings * LOAN_ELIGIBILITY_RATE)
  );

  const availableEligibility = roundMoney(
    Math.max(0, maximumLoan - committedLoanAmount)
  );

  return {
    month,
    accruedNetEarnings,
    eligibilityRate: LOAN_ELIGIBILITY_RATE,
    maximumLoan,
    committedLoanAmount,
    availableEligibility,
  };
};

// Farmer requests a loan.
export const requestLoan = async (req, res) => {
  try {
    const { amount, reason } = req.body;

    const requestedAmount = Number(amount);

    if (
      !Number.isFinite(requestedAmount) ||
      requestedAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid loan amount.",
      });
    }

    if (
      typeof reason !== "string" ||
      !reason.trim() ||
      reason.trim().length > 500
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a reason of up to 500 characters.",
      });
    }

    const farmer = await User.findOne({
      _id: req.user._id,
      role: "farmer",
    });

    if (!farmer) {
      return res.status(403).json({
        success: false,
        message: "Only registered farmers can request loans.",
      });
    }

    const buyer = await User.findOne({
      _id: farmer.createdBy,
      role: "buyer",
    });

    if (!buyer) {
      return res.status(400).json({
        success: false,
        message: "Your buyer account could not be found.",
      });
    }

    const owner = await User.findOne({
      _id: buyer.createdBy,
      role: "owner",
    });

    if (!owner) {
      return res.status(400).json({
        success: false,
        message: "Your dairy owner account could not be found.",
      });
    }

    // Prevent multiple pending requests from the same farmer.
    const pendingLoan = await Loan.findOne({
      farmer: farmer._id,
      status: "pending",
    });

    if (pendingLoan) {
      return res.status(409).json({
        success: false,
        message: "You already have a pending loan request.",
        loan: pendingLoan,
      });
    }

    const eligibility = await calculateLoanEligibility(farmer._id);

    if (requestedAmount > eligibility.availableEligibility) {
      return res.status(400).json({
        success: false,
        message: "The requested amount exceeds your current loan eligibility.",
        eligibility,
      });
    }

    const loan = await Loan.create({
      farmer: farmer._id,
      buyer: buyer._id,
      owner: owner._id,
      requestedAmount: roundMoney(requestedAmount),
      reason: reason.trim(),
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Your loan request has been submitted successfully.",
      loan,
      eligibility,
    });
  } catch (error) {
    console.error("Request loan error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit your loan request.",
    });
  }
};

// Farmer views their own loan requests and loan history.
export const getMyLoans = async (req, res) => {
  try {
    const loans = await Loan.find({
      farmer: req.user._id,
    })
      .populate("reviewedBy", "fullName email")
      .populate("disbursedBy", "fullName email")
      .sort({ createdAt: -1 });

    const eligibility = await calculateLoanEligibility(req.user._id);

    return res.status(200).json({
      success: true,
      loans,
      eligibility,
    });
  } catch (error) {
    console.error("Get farmer loans error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve your loans.",
    });
  }
};

// Owner views loan requests belonging to their dairy.

// Owner views loan requests belonging to their dairy,
// including each farmer's current financial position.
export const getOwnerLoans = async (req, res) => {
  try {
    const ownerId = req.user._id;

    const filter = {
      owner: ownerId,
    };

    if (req.query.status && req.query.status !== "all") {
      const allowedStatuses = [
        "pending",
        "approved",
        "rejected",
        "disbursed",
        "repaid",
      ];

      if (!allowedStatuses.includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid loan status filter.",
        });
      }

      filter.status = req.query.status;
    }

    // Fetch filtered applications and all owner loans.
    // The second query keeps summary figures independent
    // of whichever status filter the owner selects.
    const [loans, allOwnerLoans] = await Promise.all([
      Loan.find(filter)
        .populate("farmer", "fullName email phone location")
        .populate("buyer", "fullName email")
        .populate("reviewedBy", "fullName email")
        .populate("disbursedBy", "fullName email")
        .sort({ createdAt: -1 }),

      Loan.find({ owner: ownerId }).select(
        "status requestedAmount approvedAmount disbursedAmount outstandingBalance repayments"
      ),
    ]);

    // Calculate eligibility once per farmer.
    const farmerIds = [
      ...new Set(
        loans
          .filter((loan) => loan.farmer?._id)
          .map((loan) => loan.farmer._id.toString())
      ),
    ];

    const financialEntries = await Promise.all(
      farmerIds.map(async (farmerId) => {
        const eligibility = await calculateLoanEligibility(farmerId);

        return [farmerId, eligibility];
      })
    );

    const financialMap = new Map(financialEntries);

    // Attach the current financial position to each application.
    const enrichedLoans = loans.map((loan) => {
      const loanObject = loan.toObject();

      const farmerId = loan.farmer?._id?.toString();

      return {
        ...loanObject,
        farmerFinancials: farmerId
          ? financialMap.get(farmerId) || null
          : null,
      };
    });

    // Calculate dashboard summaries from all owner loans.
    const summary = allOwnerLoans.reduce(
      (totals, loan) => {
        const requestedAmount = Number(loan.requestedAmount || 0);
        const approvedAmount = Number(loan.approvedAmount || 0);
        const disbursedAmount = Number(loan.disbursedAmount || 0);
        const outstandingBalance = Number(
          loan.outstandingBalance || 0
        );

        const totalRepaid = (loan.repayments || []).reduce(
          (sum, repayment) =>
            sum + Number(repayment.amount || 0),
          0
        );

        if (loan.status === "pending") {
          totals.pendingApplications += 1;
          totals.pendingRequestedAmount += requestedAmount;
        }

        if (loan.status === "approved") {
          totals.approvedAwaitingDisbursement += 1;
          totals.approvedAmount += approvedAmount;
        }

        if (
          loan.status === "disbursed" ||
          loan.status === "repaid"
        ) {
          totals.totalDisbursed += disbursedAmount;
          totals.totalRepaid += totalRepaid;
          totals.outstandingBalance += outstandingBalance;
        }

        return totals;
      },
      {
        pendingApplications: 0,
        pendingRequestedAmount: 0,
        approvedAwaitingDisbursement: 0,
        approvedAmount: 0,
        totalDisbursed: 0,
        totalRepaid: 0,
        outstandingBalance: 0,
      }
    );

    Object.keys(summary).forEach((key) => {
      if (key !== "pendingApplications" &&
          key !== "approvedAwaitingDisbursement") {
        summary[key] = roundMoney(summary[key]);
      }
    });

    return res.status(200).json({
      success: true,
      count: enrichedLoans.length,
      summary,
      loans: enrichedLoans,
    });
  } catch (error) {
    console.error("Get owner loans error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve loan requests.",
    });
  }
};


// Owner approves a pending loan, optionally for a lower amount.
export const approveLoan = async (req, res) => {
  try {
    const { approvedAmount, ownerNotes = "" } = req.body;

    const loan = await Loan.findOne({
      _id: req.params.id,
      owner: req.user._id,
      status: "pending",
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Pending loan request not found.",
      });
    }

    const amount =
      approvedAmount === undefined
        ? loan.requestedAmount
        : Number(approvedAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid approved amount.",
      });
    }

    if (amount > loan.requestedAmount) {
      return res.status(400).json({
        success: false,
        message: "The approved amount cannot exceed the requested amount.",
      });
    }

    if (
      typeof ownerNotes !== "string" ||
      ownerNotes.length > 500
    ) {
      return res.status(400).json({
        success: false,
        message: "Owner notes cannot exceed 500 characters.",
      });
    }

    // Recheck eligibility at approval time.
    const eligibility = await calculateLoanEligibility(loan.farmer);

    if (amount > eligibility.availableEligibility) {
      return res.status(400).json({
        success: false,
        message: "The approved amount exceeds the farmer's current eligibility.",
        eligibility,
      });
    }

    loan.approvedAmount = roundMoney(amount);
    loan.ownerNotes = ownerNotes.trim();
    loan.status = "approved";
    loan.reviewedBy = req.user._id;
    loan.reviewedAt = new Date();

    await loan.save();

    return res.status(200).json({
      success: true,
      message: "Loan approved. It must be disbursed before repayment begins.",
      loan,
    });
  } catch (error) {
    console.error("Approve loan error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to approve the loan.",
    });
  }
};

// Owner rejects a pending loan.
export const rejectLoan = async (req, res) => {
  try {
    const { ownerNotes = "" } = req.body;

    if (
      typeof ownerNotes !== "string" ||
      ownerNotes.length > 500
    ) {
      return res.status(400).json({
        success: false,
        message: "Owner notes cannot exceed 500 characters.",
      });
    }

    const loan = await Loan.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: req.user._id,
        status: "pending",
      },
      {
        $set: {
          status: "rejected",
          ownerNotes: ownerNotes.trim(),
          reviewedBy: req.user._id,
          reviewedAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    );

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Pending loan request not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Loan request rejected.",
      loan,
    });
  } catch (error) {
    console.error("Reject loan error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reject the loan request.",
    });
  }
};

// Owner confirms that the farmer has actually received the money.
export const disburseLoan = async (req, res) => {
  try {
    const loan = await Loan.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: req.user._id,
        status: "approved",
      },
      [
        {
          $set: {
            status: "disbursed",
            disbursedAmount: "$approvedAmount",
            outstandingBalance: "$approvedAmount",
            disbursedBy: req.user._id,
            disbursedAt: "$$NOW",
          },
        },
      ],
      { new: true }
    );

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Approved loan not found. It may already have been disbursed.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Loan marked as disbursed successfully.",
      loan,
    });
  } catch (error) {
    console.error("Disburse loan error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to disburse the loan.",
    });
  }
};
