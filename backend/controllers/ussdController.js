
import User from "../models/User.js";
import MilkRecord from "../models/MilkRecord.js";
import bcrypt from "bcryptjs";
import normalizeMalawiPhone from "../utils/normalizePhone.js";
import Loan from "../models/Loan.js";

const MAX_PIN_ATTEMPTS = 5;
const PIN_LOCK_DURATION = 15 * 60 * 1000;

// ==========================================
// GENERAL USSD HELPERS
// ==========================================

// Send a USSD response
const sendUssdResponse = (res, message) => {
  return res.status(200).type("text/plain").send(message);
};

// Main farmer menu
const getMainMenu = () => {
  return `CON Welcome to DairyFlow!
1. My Milk Records
2. My Earnings
3. Loan Eligibility
4. Request a Loan
5. My Loan Balance
6. Help`;
};

// Get the current month using Malawi's timezone
const getCurrentMalawiMonth = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Blantyre",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find(
    (part) => part.type === "year"
  ).value;

  const month = parts.find(
    (part) => part.type === "month"
  ).value;

  return `${year}-${month}`;
};

// Safely convert values to numbers
const toNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

// Round money to two decimal places
const roundMoney = (value) => {
  return Number(toNumber(value).toFixed(2));
};

// Format Malawi Kwacha amounts
const formatMWK = (amount) => {
  return roundMoney(amount).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

// Check whether a milk record has complete saved
// financial calculations, using the same rules
// as financialReportController.js.
const hasSavedFinancialData = (record) => {
  return (
    toNumber(record.pricePerLitre) > 0 &&
    record.grossAmount !== undefined &&
    record.grossAmount !== null &&
    record.taxAmount !== undefined &&
    record.taxAmount !== null &&
    record.welfareDeduction !== undefined &&
    record.welfareDeduction !== null &&
    record.netAmount !== undefined &&
    record.netAmount !== null &&
    [
      record.grossAmount,
      record.taxAmount,
      record.welfareDeduction,
      record.netAmount,
    ].every((value) => Number.isFinite(Number(value)))
  );
};

// ==========================================
// FARMER MONTHLY EARNINGS
// ==========================================

const getFarmerEarnings = async (farmerId) => {
  const month = getCurrentMalawiMonth();

  const records = await MilkRecord.find({
    farmer: farmerId,
    recordDate: {
      $regex: `^${month}`,
    },
  })
    .sort({ recordDate: 1 })
    .lean();

  const earnings = {
    totalRecords: records.length,
    totalLitres: 0,
    pricedLitres: 0,
    unpricedLitres: 0,
    grossAmount: 0,
    taxAmount: 0,
    welfareDeduction: 0,
    netAmount: 0,
    unpricedRecords: 0,
  };

  records.forEach((record) => {
    const litres = toNumber(record.quantityLitres);

    // All supplied milk contributes to total litres
    earnings.totalLitres += litres;

    // Exclude incomplete or unpriced records
    // from financial calculations
    if (!hasSavedFinancialData(record)) {
      earnings.unpricedLitres += litres;
      earnings.unpricedRecords += 1;

      return;
    }

    earnings.pricedLitres += litres;

    earnings.grossAmount += toNumber(
      record.grossAmount
    );

    earnings.taxAmount += toNumber(
      record.taxAmount
    );

    earnings.welfareDeduction += toNumber(
      record.welfareDeduction
    );

    earnings.netAmount += toNumber(
      record.netAmount
    );
  });

  // Round the final figures
  earnings.totalLitres = roundMoney(
    earnings.totalLitres
  );

  earnings.pricedLitres = roundMoney(
    earnings.pricedLitres
  );

  earnings.unpricedLitres = roundMoney(
    earnings.unpricedLitres
  );

  earnings.grossAmount = roundMoney(
    earnings.grossAmount
  );

  earnings.taxAmount = roundMoney(
    earnings.taxAmount
  );

  earnings.welfareDeduction = roundMoney(
    earnings.welfareDeduction
  );

  earnings.netAmount = roundMoney(
    earnings.netAmount
  );

  return {
    month,
    earnings,
  };
};


// ==========================================
// FARMER LOAN ELIGIBILITY
// Uses the same rules as loanController.js
// ==========================================

const LOAN_ELIGIBILITY_RATE = 0.5;

const calculateFarmerLoanEligibility = async (farmerId) => {
  const month = getCurrentMalawiMonth();

  // Get priced milk records for the current month
  const records = await MilkRecord.find({
    farmer: farmerId,
    recordDate: {
      $regex: `^${month}`,
    },
    pricePerLitre: {
      $gt: 0,
    },
  }).select(
    "netAmount pricePerLitre grossAmount taxAmount welfareDeduction"
  );

  // Calculate accrued net earnings
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
        ? total + toNumber(record.netAmount)
        : total;
    }, 0)
  );

  // Find approved and disbursed loans
  const existingLoans = await Loan.find({
    farmer: farmerId,
    status: {
      $in: ["approved", "disbursed"],
    },
  }).select(
    "status approvedAmount outstandingBalance"
  );

  // Calculate committed loan amount
  const committedLoanAmount = roundMoney(
    existingLoans.reduce((total, loan) => {
      if (loan.status === "approved") {
        return (
          total + toNumber(loan.approvedAmount)
        );
      }

      return (
        total + toNumber(loan.outstandingBalance)
      );
    }, 0)
  );

  // Calculate maximum loan
  const maximumLoan = roundMoney(
    Math.max(
      0,
      accruedNetEarnings * LOAN_ELIGIBILITY_RATE
    )
  );

  // Calculate available eligibility
  const availableEligibility = roundMoney(
    Math.max(
      0,
      maximumLoan - committedLoanAmount
    )
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

// ==========================================
// OPTION 3: LOAN ELIGIBILITY RESPONSE
// ==========================================

const getLoanEligibilityResponse = async (farmerId) => {
  const eligibility =
    await calculateFarmerLoanEligibility(farmerId);

  return `END LOAN ELIGIBILITY (${eligibility.month})
Net Earnings: MWK ${formatMWK(eligibility.accruedNetEarnings)}
Eligibility Rate: 50%
Maximum Loan: MWK ${formatMWK(eligibility.maximumLoan)}
Existing Commitments: MWK ${formatMWK(eligibility.committedLoanAmount)}
Available Loan: MWK ${formatMWK(eligibility.availableEligibility)}`;
};

// ==========================================
// OPTION 4: SUBMIT FARMER LOAN REQUEST
// ==========================================

const submitFarmerLoanRequest = async (
  farmer,
  requestedAmount,
  reason
) => {
  // Validate the amount
  if (
    !Number.isFinite(requestedAmount) ||
    requestedAmount <= 0
  ) {
    return "END Invalid loan amount. Please dial again.";
  }

  // Validate the reason
  if (!reason || !reason.trim()) {
    return "END Please provide a reason for your loan request.";
  }

  if (reason.trim().length > 500) {
    return "END Your loan reason is too long. Please dial again.";
  }

  // Check for an existing pending loan
  const existingPendingLoan = await Loan.findOne({
    farmer: farmer._id,
    status: "pending",
  });

  if (existingPendingLoan) {
    return "END You already have a pending loan request. Please wait for a decision.";
  }

  // Check current loan eligibility
  const eligibility =
    await calculateFarmerLoanEligibility(farmer._id);

  if (
    requestedAmount >
    eligibility.availableEligibility
  ) {
    return `END Insufficient loan eligibility.
Available: MWK ${formatMWK(eligibility.availableEligibility)}
Requested: MWK ${formatMWK(requestedAmount)}`;
  }

  // Find the buyer who registered this farmer
  const buyer = await User.findById(farmer.createdBy);

  if (!buyer || buyer.role !== "buyer") {
    return "END Unable to identify your buyer. Please contact support.";
  }

  // Find the owner responsible for the buyer
  const owner = await User.findById(buyer.createdBy);

  if (!owner || owner.role !== "owner") {
    return "END Unable to identify your dairy owner. Please contact support.";
  }

  // Create the loan request
  await Loan.create({
    farmer: farmer._id,
    buyer: buyer._id,
    owner: owner._id,
    requestedAmount,
    reason: reason.trim(),
    status: "pending",
  });

  return `END Your loan request has been submitted successfully!
Amount: MWK ${formatMWK(requestedAmount)}
Status: Pending Approval.
Please wait for your owner to review your request.`;
};

// ==========================================
// OPTION 5: MY LOAN BALANCE
// ==========================================

const getFarmerLoanBalanceResponse = async (farmerId) => {
  // Retrieve all loans belonging to this farmer
  const loans = await Loan.find({
    farmer: farmerId,
  })
    .sort({ createdAt: -1 })
    .select(
      "requestedAmount approvedAmount disbursedAmount outstandingBalance status repayments createdAt"
    )
    .lean();

  if (loans.length === 0) {
    return "END You do not have any loan requests or loans yet.";
  }

  // Calculate loan summaries
  let pendingAmount = 0;
  let approvedAmount = 0;
  let totalDisbursed = 0;
  let outstandingBalance = 0;
  let totalRepaid = 0;

  loans.forEach((loan) => {
    if (loan.status === "pending") {
      pendingAmount += toNumber(loan.requestedAmount);
    }

    if (loan.status === "approved") {
      approvedAmount += toNumber(loan.approvedAmount);
    }

    if (
      loan.status === "disbursed" ||
      loan.status === "repaid"
    ) {
      totalDisbursed += toNumber(loan.disbursedAmount);

      outstandingBalance += toNumber(
        loan.outstandingBalance
      );
    }

    // Add recorded repayments
    if (Array.isArray(loan.repayments)) {
      loan.repayments.forEach((repayment) => {
        totalRepaid += toNumber(repayment.amount);
      });
    }
  });

  // Show the latest three loan requests
  const latestLoans = loans.slice(0, 3);

  const loanLines = latestLoans.map((loan, index) => {
    let description = "";

    if (loan.status === "pending") {
      description =
        `Pending: MWK ${formatMWK(loan.requestedAmount)}`;
    } else if (loan.status === "approved") {
      description =
        `Approved: MWK ${formatMWK(loan.approvedAmount)}`;
    } else if (loan.status === "disbursed") {
      description =
        `Disbursed: MWK ${formatMWK(loan.disbursedAmount)} | Balance: MWK ${formatMWK(loan.outstandingBalance)}`;
    } else if (loan.status === "repaid") {
      description =
        `Repaid: MWK ${formatMWK(loan.disbursedAmount)}`;
    } else if (loan.status === "rejected") {
      description =
        `Rejected: MWK ${formatMWK(loan.requestedAmount)}`;
    }

    return `${index + 1}. ${description}`;
  });

  return `END MY LOAN ACCOUNT

Pending Requests: MWK ${formatMWK(pendingAmount)}
Approved Loans: MWK ${formatMWK(approvedAmount)}
Total Disbursed: MWK ${formatMWK(totalDisbursed)}
Total Repaid: MWK ${formatMWK(totalRepaid)}
Outstanding Balance: MWK ${formatMWK(outstandingBalance)}

LATEST LOANS:
${loanLines.join("\n")}`;
};


// ==========================================
// OPTION 1: MY MILK RECORDS
// ==========================================

const getFarmerMilkRecords = async (farmerId) => {
  const records = await MilkRecord.find({
    farmer: farmerId,
  })
    .sort({ recordDate: -1 })
    .limit(3)
    .select("recordDate quantityLitres netAmount")
    .lean();

  if (records.length === 0) {
    return "END You do not have any milk records yet.";
  }

  const recordLines = records.map((record) => {
    const quantity = toNumber(
      record.quantityLitres
    ).toFixed(1);

    const earnings = formatMWK(
      record.netAmount
    );

    return `${record.recordDate}: ${quantity}L, MWK ${earnings}`;
  });

  return `END Your latest milk records:
${recordLines.join("\n")}`;
};

// ==========================================
// OPTION 2: MY EARNINGS
// ==========================================

const getFarmerMonthlyEarningsResponse = async (
  farmerId
) => {
  const { month, earnings } =
    await getFarmerEarnings(farmerId);

  if (earnings.totalRecords === 0) {
    return `END No milk records found for ${month}.`;
  }

  return `END MY EARNINGS (${month})
Total Milk: ${earnings.totalLitres.toFixed(2)}L
Priced Milk: ${earnings.pricedLitres.toFixed(2)}L
Unpriced Milk: ${earnings.unpricedLitres.toFixed(2)}L
Gross: MWK ${formatMWK(earnings.grossAmount)}
Tax: MWK ${formatMWK(earnings.taxAmount)}
Welfare: MWK ${formatMWK(earnings.welfareDeduction)}
Net Earnings: MWK ${formatMWK(earnings.netAmount)}`;
};

// ==========================================
// DAIRYFLOW USSD CALLBACK
// ==========================================

export const handleUssdCallback = async (req, res) => {
  try {
    const { phoneNumber, text = "" } = req.body;

    // Check phone number
    if (!phoneNumber) {
      return sendUssdResponse(
        res,
        "END Unable to identify your phone number. Please try again."
      );
    }

    const normalizedPhone = normalizeMalawiPhone(
      phoneNumber
    );

    if (!normalizedPhone) {
      return sendUssdResponse(
        res,
        "END Invalid phone number."
      );
    }

    // Find farmer by registered phone number
    const farmer = await User.findOne({
      phone: normalizedPhone,
      role: "farmer",
    }).select("+ussdPin");

    if (!farmer) {
      return sendUssdResponse(
        res,
        "END Your phone number is not registered with DairyFlow."
      );
    }

    // Check account status
    if (!farmer.isActive || !farmer.passwordSet) {
      return sendUssdResponse(
        res,
        "END Your account is not active. Please contact your buyer."
      );
    }

    if (!farmer.phoneVerified) {
      return sendUssdResponse(
        res,
        "END Your phone number is not verified. Please contact your buyer."
      );
    }

    if (!farmer.ussdPinSet || !farmer.ussdPin) {
      return sendUssdResponse(
        res,
        "END You have not set a USSD PIN. Please set one through DairyFlow."
      );
    }

    // Check whether PIN is currently locked
    if (
      farmer.ussdPinLockedUntil &&
      farmer.ussdPinLockedUntil.getTime() > Date.now()
    ) {
      return sendUssdResponse(
        res,
        "END Your PIN is temporarily locked. Please try again later."
      );
    }

    // Reset expired lockout
    if (
      farmer.ussdPinLockedUntil &&
      farmer.ussdPinLockedUntil.getTime() <= Date.now()
    ) {
      farmer.ussdPinAttempts = 0;
      farmer.ussdPinLockedUntil = null;
    }

    // Africa's Talking sends accumulated input
    // separated by *
    const inputs = String(text)
      .split("*")
      .map((item) => item.trim());

    // First screen: ask for PIN
    if (!text.trim()) {
      return sendUssdResponse(
        res,
        "CON Welcome to DairyFlow!\nPlease enter your 4-digit PIN:"
      );
    }

    const submittedPin = inputs[0];

    if (!/^\d{4}$/.test(submittedPin)) {
      return sendUssdResponse(
        res,
        "END Invalid PIN format. Please dial again."
      );
    }

    // Verify farmer's PIN
    const pinIsCorrect = await bcrypt.compare(
      submittedPin,
      farmer.ussdPin
    );

    if (!pinIsCorrect) {
      farmer.ussdPinAttempts =
        (farmer.ussdPinAttempts || 0) + 1;

      if (
        farmer.ussdPinAttempts >= MAX_PIN_ATTEMPTS
      ) {
        farmer.ussdPinLockedUntil = new Date(
          Date.now() + PIN_LOCK_DURATION
        );

        await farmer.save();

        return sendUssdResponse(
          res,
          "END Too many incorrect attempts. Your PIN is locked for 15 minutes."
        );
      }

      await farmer.save();

      const remaining =
        MAX_PIN_ATTEMPTS - farmer.ussdPinAttempts;

      return sendUssdResponse(
        res,
        `END Incorrect PIN. ${remaining} attempts remaining.`
      );
    }

    // Correct PIN: reset failed attempts
    farmer.ussdPinAttempts = 0;
    farmer.ussdPinLockedUntil = null;

    await farmer.save();

    // Show main menu after successful PIN entry
    if (inputs.length === 1) {
      return sendUssdResponse(
        res,
        getMainMenu()
      );
    }

    const selectedOption = inputs[1];

    // ======================================
    // OPTION 1: MY MILK RECORDS
    // ======================================

    if (selectedOption === "1") {
      const response = await getFarmerMilkRecords(
        farmer._id
      );

      return sendUssdResponse(res, response);
    }

    // ======================================
    // OPTION 2: MY EARNINGS
    // ======================================

    if (selectedOption === "2") {
      const response =
        await getFarmerMonthlyEarningsResponse(
          farmer._id
        );

      return sendUssdResponse(res, response);
    }

    // ======================================
    // OPTION 3: LOAN ELIGIBILITY
    // ======================================

    if (selectedOption === "3") {
  const response = await getLoanEligibilityResponse(
    farmer._id
  );

  return sendUssdResponse(res, response);
}

    // ======================================
    // OPTION 4: REQUEST A LOAN
    // ======================================

   // ======================================
// OPTION 4: REQUEST A LOAN
// ======================================

if (selectedOption === "4") {

  // Step 1: Ask for loan amount
  if (inputs.length === 2) {
    return sendUssdResponse(
      res,
      "CON Enter the loan amount in MWK:"
    );
  }

  // Step 2: Validate amount and ask for reason
  if (inputs.length === 3) {
    const requestedAmount = Number(inputs[2]);

    if (
      !Number.isFinite(requestedAmount) ||
      requestedAmount <= 0
    ) {
      return sendUssdResponse(
        res,
        "END Invalid loan amount. Please dial again."
      );
    }

    const eligibility =
      await calculateFarmerLoanEligibility(farmer._id);

    if (
      requestedAmount >
      eligibility.availableEligibility
    ) {
      return sendUssdResponse(
        res,
        `END Your available loan eligibility is MWK ${formatMWK(eligibility.availableEligibility)}. You cannot request more than this amount.`
      );
    }

    return sendUssdResponse(
      res,
      "CON Enter the reason for your loan request:"
    );
  }

  // Step 3: Submit the request
  if (inputs.length >= 4) {
    const requestedAmount = Number(inputs[2]);

    // Rejoin additional segments if the reason
    // contains an asterisk in the input.
    const reason = inputs.slice(3).join(" ").trim();

    const response = await submitFarmerLoanRequest(
      farmer,
      requestedAmount,
      reason
    );

    return sendUssdResponse(res, response);
  }
}

    // ======================================
    // OPTION 5: MY LOAN BALANCE
    // ======================================

    // ======================================
// OPTION 5: MY LOAN BALANCE
// ======================================

if (selectedOption === "5") {
  const response = await getFarmerLoanBalanceResponse(
    farmer._id
  );

  return sendUssdResponse(res, response);
}

    // ======================================
    // OPTION 6: HELP
    // ======================================

    if (selectedOption === "6") {
      return sendUssdResponse(
        res,
        "END For assistance, please contact your buyer."
      );
    }

    return sendUssdResponse(
      res,
      "END Invalid selection. Please dial again."
    );

  } catch (error) {
    console.error("USSD callback error:", error);

    return sendUssdResponse(
      res,
      "END A system error occurred. Please try again later."
    );
  }
};
