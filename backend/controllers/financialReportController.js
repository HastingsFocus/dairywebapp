
import MilkRecord from "../models/MilkRecord.js";
import User from "../models/User.js";
import Loan from "../models/Loan.js";
import MonthlySettlement from "../models/MonthlySettlement.js";

// Get the current month using Malawi's timezone.
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

// Safely convert values to numbers.
const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

// Round monetary values to two decimal places.
const roundMoney = (value) =>
  Number(toNumber(value).toFixed(2));

export const getFinancialReport = async (req, res) => {
  try {
    const month = req.query.month || getCurrentMalawiMonth();

    // Validate requested month.
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid month. Use YYYY-MM format, for example 2026-11.",
      });
    }

    // Find buyers registered under this owner.
    const buyers = await User.find({
      role: "buyer",
      createdBy: req.user._id,
    }).select("_id");

    const buyerIds = buyers.map((buyer) => buyer._id);

    // Find farmers registered under those buyers.
    const farmers = await User.find({
      role: "farmer",
      createdBy: { $in: buyerIds },
    }).select("_id fullName email phone");

    const farmerIds = farmers.map((farmer) => farmer._id);

    // Retrieve milk records for the selected month.
    const records = await MilkRecord.find({
      farmer: { $in: farmerIds },
      recordDate: {
        $regex: `^${month}`,
      },
    })
      .populate("farmer", "fullName email phone")
      .sort({ recordDate: 1 });

    // Retrieve loan information and settlements.
    const [loans, settlements] = await Promise.all([
      Loan.find({
        farmer: { $in: farmerIds },
        owner: req.user._id,
      }).select(
        "farmer requestedAmount approvedAmount disbursedAmount outstandingBalance status repayments"
      ),

      MonthlySettlement.find({
        farmer: { $in: farmerIds },
        owner: req.user._id,
        month,
      }).select(
        "farmer milkNetEarnings loanDeduction finalPayment outstandingBefore outstandingAfter settledAt"
      ),
    ]);

    // Overall financial summary.
    const summary = {
      totalFarmers: farmers.length,
      totalRecords: records.length,
      totalLitres: 0,
      pricedLitres: 0,
      unpricedLitres: 0,
      grossAmount: 0,
      taxAmount: 0,
      welfareDeduction: 0,
      netAmount: 0,
      unpricedRecords: 0,

      pendingLoanAmount: 0,
      approvedAwaitingDisbursement: 0,
      totalDisbursed: 0,
      totalRepaid: 0,
      outstandingLoanBalance: 0,
      loanDeduction: 0,
      finalPayment: 0,
    };

    const farmerReports = new Map();
    const dailyReports = new Map();
    const loansByFarmer = new Map();
    const settlementsByFarmer = new Map();

    // Initialize every farmer, including those without milk records.
    farmers.forEach((farmer) => {
      const farmerId = farmer._id.toString();

      farmerReports.set(farmerId, {
        farmerId,
        farmerName: farmer.fullName || "Unknown farmer",
        email: farmer.email || "",
        phone: farmer.phone || "",

        totalRecords: 0,
        totalLitres: 0,
        pricedLitres: 0,
        unpricedLitres: 0,
        grossAmount: 0,
        taxAmount: 0,
        welfareDeduction: 0,
        netAmount: 0,
        unpricedRecords: 0,

        pendingLoanAmount: 0,
        approvedAwaitingDisbursement: 0,
        totalDisbursed: 0,
        totalRepaid: 0,
        outstandingLoanBalance: 0,
        loanDeduction: 0,
        finalPayment: 0,
        settlementStatus: "pending",
        settledAt: null,
      });
    });

    // Group loans by farmer.
    loans.forEach((loan) => {
      const farmerId = loan.farmer.toString();

      if (!loansByFarmer.has(farmerId)) {
        loansByFarmer.set(farmerId, {
          pendingLoanAmount: 0,
          approvedAwaitingDisbursement: 0,
          totalDisbursed: 0,
          totalRepaid: 0,
          outstandingLoanBalance: 0,
        });
      }

      const data = loansByFarmer.get(farmerId);

      if (loan.status === "pending") {
        data.pendingLoanAmount += toNumber(
          loan.requestedAmount
        );
      }

      if (loan.status === "approved") {
        data.approvedAwaitingDisbursement += toNumber(
          loan.approvedAmount
        );
      }

      if (
        loan.status === "disbursed" ||
        loan.status === "repaid"
      ) {
        data.totalDisbursed += toNumber(
          loan.disbursedAmount
        );

        data.outstandingLoanBalance += toNumber(
          loan.outstandingBalance
        );

        data.totalRepaid += (loan.repayments || []).reduce(
          (total, repayment) =>
            total + toNumber(repayment.amount),
          0
        );
      }
    });

    // Group monthly settlements by farmer.
    settlements.forEach((settlement) => {
      settlementsByFarmer.set(
        settlement.farmer.toString(),
        settlement
      );
    });

    // Process each milk record.
    records.forEach((record) => {
      const farmerId = record.farmer?._id?.toString();

      if (!farmerId) return;

      const farmerReport = farmerReports.get(farmerId);

      if (!farmerReport) return;

      const litres = toNumber(record.quantityLitres);
      const date = record.recordDate;

      summary.totalLitres += litres;

      farmerReport.totalRecords += 1;
      farmerReport.totalLitres += litres;

      // Initialize daily report.
      if (!dailyReports.has(date)) {
        dailyReports.set(date, {
          date,
          totalFarmers: 0,
          totalRecords: 0,
          totalLitres: 0,
          pricedLitres: 0,
          unpricedLitres: 0,
          grossAmount: 0,
          taxAmount: 0,
          welfareDeduction: 0,
          netAmount: 0,
          unpricedRecords: 0,
          farmerIds: new Set(),
        });
      }

      const dailyReport = dailyReports.get(date);

      // Count each farmer once per day, including unpriced records.
      dailyReport.farmerIds.add(farmerId);

      dailyReport.totalRecords += 1;
      dailyReport.totalLitres += litres;

      // Check whether this record has saved financial information.
      const hasSavedFinancialData =
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
        ].every((value) => Number.isFinite(Number(value)));

      // Track records without saved financial calculations.
      if (!hasSavedFinancialData) {
        summary.unpricedRecords += 1;
        summary.unpricedLitres += litres;

        farmerReport.unpricedRecords += 1;
        farmerReport.unpricedLitres += litres;

        dailyReport.unpricedRecords += 1;
        dailyReport.unpricedLitres += litres;

        return;
      }

      // Use financial values saved on the original record.
      const gross = toNumber(record.grossAmount);
      const tax = toNumber(record.taxAmount);
      const welfare = toNumber(record.welfareDeduction);
      const net = toNumber(record.netAmount);

      // Update overall summary.
      summary.pricedLitres += litres;
      summary.grossAmount += gross;
      summary.taxAmount += tax;
      summary.welfareDeduction += welfare;
      summary.netAmount += net;

      // Update farmer totals.
      farmerReport.pricedLitres += litres;
      farmerReport.grossAmount += gross;
      farmerReport.taxAmount += tax;
      farmerReport.welfareDeduction += welfare;
      farmerReport.netAmount += net;

      // Update daily totals.
      dailyReport.pricedLitres += litres;
      dailyReport.grossAmount += gross;
      dailyReport.taxAmount += tax;
      dailyReport.welfareDeduction += welfare;
      dailyReport.netAmount += net;
    });

    // Attach loan and settlement information to each farmer.
    farmerReports.forEach((farmerReport, farmerId) => {
      const loanData = loansByFarmer.get(farmerId) || {
        pendingLoanAmount: 0,
        approvedAwaitingDisbursement: 0,
        totalDisbursed: 0,
        totalRepaid: 0,
        outstandingLoanBalance: 0,
      };

      const settlement = settlementsByFarmer.get(farmerId);

      // This is a projected deduction until the owner settles the month.
      const projectedLoanDeduction = roundMoney(
        Math.min(
          Math.max(0, farmerReport.netAmount),
          loanData.outstandingLoanBalance
        )
      );

      farmerReport.pendingLoanAmount = roundMoney(
        loanData.pendingLoanAmount
      );

      farmerReport.approvedAwaitingDisbursement = roundMoney(
        loanData.approvedAwaitingDisbursement
      );

      farmerReport.totalDisbursed = roundMoney(
        loanData.totalDisbursed
      );

      farmerReport.totalRepaid = roundMoney(
        loanData.totalRepaid
      );

      farmerReport.outstandingLoanBalance = roundMoney(
        loanData.outstandingLoanBalance
      );

      farmerReport.loanDeduction = settlement
        ? roundMoney(settlement.loanDeduction)
        : projectedLoanDeduction;

      farmerReport.finalPayment = settlement
        ? roundMoney(settlement.finalPayment)
        : roundMoney(
            Math.max(
              0,
              farmerReport.netAmount - projectedLoanDeduction
            )
          );

      farmerReport.settlementStatus = settlement
        ? "settled"
        : "pending";

      farmerReport.settledAt = settlement?.settledAt || null;

      // Add farmer loan figures to the overall summary.
      summary.pendingLoanAmount += farmerReport.pendingLoanAmount;

      summary.approvedAwaitingDisbursement +=
        farmerReport.approvedAwaitingDisbursement;

      summary.totalDisbursed += farmerReport.totalDisbursed;
      summary.totalRepaid += farmerReport.totalRepaid;

      summary.outstandingLoanBalance +=
        farmerReport.outstandingLoanBalance;

      summary.loanDeduction += farmerReport.loanDeduction;
      summary.finalPayment += farmerReport.finalPayment;
    });

    // Prepare daily breakdown.
    const dailyBreakdown = Array.from(
      dailyReports.values()
    ).map((day) => {
      const {
        farmerIds: dayFarmerIds,
        ...dailyData
      } = day;

      return {
        ...dailyData,
        totalFarmers: dayFarmerIds.size,
        totalLitres: roundMoney(day.totalLitres),
        pricedLitres: roundMoney(day.pricedLitres),
        unpricedLitres: roundMoney(day.unpricedLitres),
        grossAmount: roundMoney(day.grossAmount),
        taxAmount: roundMoney(day.taxAmount),
        welfareDeduction: roundMoney(day.welfareDeduction),
        netAmount: roundMoney(day.netAmount),
      };
    });

    // Prepare farmer breakdown.
    const farmerBreakdown = Array.from(
      farmerReports.values()
    )
      .map((farmer) => ({
        ...farmer,
        totalLitres: roundMoney(farmer.totalLitres),
        pricedLitres: roundMoney(farmer.pricedLitres),
        unpricedLitres: roundMoney(farmer.unpricedLitres),
        grossAmount: roundMoney(farmer.grossAmount),
        taxAmount: roundMoney(farmer.taxAmount),
        welfareDeduction: roundMoney(
          farmer.welfareDeduction
        ),
        netAmount: roundMoney(farmer.netAmount),

        pendingLoanAmount: roundMoney(
          farmer.pendingLoanAmount
        ),
        approvedAwaitingDisbursement: roundMoney(
          farmer.approvedAwaitingDisbursement
        ),
        totalDisbursed: roundMoney(farmer.totalDisbursed),
        totalRepaid: roundMoney(farmer.totalRepaid),
        outstandingLoanBalance: roundMoney(
          farmer.outstandingLoanBalance
        ),
        loanDeduction: roundMoney(farmer.loanDeduction),
        finalPayment: roundMoney(farmer.finalPayment),
      }))
      .sort((a, b) =>
        a.farmerName.localeCompare(b.farmerName)
      );

    // Prepare final overall summary.
    const finalSummary = {
      ...summary,
      totalLitres: roundMoney(summary.totalLitres),
      pricedLitres: roundMoney(summary.pricedLitres),
      unpricedLitres: roundMoney(summary.unpricedLitres),
      grossAmount: roundMoney(summary.grossAmount),
      taxAmount: roundMoney(summary.taxAmount),
      welfareDeduction: roundMoney(
        summary.welfareDeduction
      ),
      netAmount: roundMoney(summary.netAmount),

      pendingLoanAmount: roundMoney(
        summary.pendingLoanAmount
      ),
      approvedAwaitingDisbursement: roundMoney(
        summary.approvedAwaitingDisbursement
      ),
      totalDisbursed: roundMoney(summary.totalDisbursed),
      totalRepaid: roundMoney(summary.totalRepaid),
      outstandingLoanBalance: roundMoney(
        summary.outstandingLoanBalance
      ),
      loanDeduction: roundMoney(summary.loanDeduction),
      finalPayment: roundMoney(summary.finalPayment),
    };

    // Return final report.
    return res.status(200).json({
      success: true,
      month,
      summary: finalSummary,
      farmerBreakdown,
      dailyBreakdown,
    });
  } catch (error) {
    console.error("Financial report error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate financial report.",
    });
  }
};
