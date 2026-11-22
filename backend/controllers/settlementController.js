
import mongoose from "mongoose";
import MilkRecord from "../models/MilkRecord.js";
import Loan from "../models/Loan.js";
import User from "../models/User.js";
import MonthlySettlement from "../models/MonthlySettlement.js";

const roundMoney = (value) =>
  Number(Number(value || 0).toFixed(2));

const isValidMonth = (month) =>
  /^\d{4}-(0[1-9]|1[0-2])$/.test(month);

export const settleFarmerMonth = async (req, res) => {
  const { month, farmerId } = req.params;

  if (!isValidMonth(month)) {
    return res.status(400).json({
      success: false,
      message: "Invalid month. Use YYYY-MM format.",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(farmerId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid farmer ID.",
    });
  }

  const session = await mongoose.startSession();

  try {
    let settlementResult = null;

    await session.withTransaction(async () => {
      // Verify that the farmer belongs to this owner.
      const farmer = await User.findOne({
        _id: farmerId,
        role: "farmer",
      }).session(session);

      if (!farmer) {
        throw new Error("FARMER_NOT_FOUND");
      }

      const buyer = await User.findOne({
        _id: farmer.createdBy,
        role: "buyer",
        createdBy: req.user._id,
      }).session(session);

      if (!buyer) {
        throw new Error("FARMER_NOT_FOUND");
      }

      // Check whether this farmer has already been settled.
      const existingSettlement = await MonthlySettlement.findOne({
        farmer: farmer._id,
        month,
      }).session(session);

      if (existingSettlement) {
        throw new Error("MONTH_ALREADY_SETTLED");
      }

      // Get this month's milk records.
      const records = await MilkRecord.find({
        farmer: farmer._id,
        recordDate: { $regex: `^${month}` },
      }).session(session);

      // Only use records with complete saved financial values.
      const milkNetEarnings = roundMoney(
        records.reduce((total, record) => {
          const hasSavedFinancialData =
            Number(record.pricePerLitre) > 0 &&
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

      // A farmer cannot repay more than their positive net earnings.
      let remainingPayment = roundMoney(
        Math.max(0, milkNetEarnings)
      );

      // Only disbursed loans are eligible for repayment.
      // Oldest loans are repaid first.
      const loans = await Loan.find({
        farmer: farmer._id,
        owner: req.user._id,
        status: "disbursed",
        outstandingBalance: { $gt: 0 },
      })
        .sort({ disbursedAt: 1, createdAt: 1 })
        .session(session);

      const outstandingBefore = roundMoney(
        loans.reduce(
          (total, loan) =>
            total + Number(loan.outstandingBalance || 0),
          0
        )
      );

      const repaymentAllocations = [];
      let totalDeduction = 0;

      for (const loan of loans) {
        if (remainingPayment <= 0) break;

        const balance = roundMoney(loan.outstandingBalance);
        const repayment = roundMoney(
          Math.min(balance, remainingPayment)
        );

        if (repayment <= 0) continue;

        const updatedLoan = await Loan.findOneAndUpdate(
          {
            _id: loan._id,
            farmer: farmer._id,
            owner: req.user._id,
            status: "disbursed",
            outstandingBalance: { $gte: repayment },
          },
          {
            $inc: {
              outstandingBalance: -repayment,
            },
            $push: {
              repayments: {
                month,
                amount: repayment,
                paidAt: new Date(),
              },
            },
          },
          {
            new: true,
            session,
          }
        );

        if (!updatedLoan) {
          throw new Error("LOAN_BALANCE_CHANGED");
        }

        // Mark a fully repaid loan as repaid.
        if (updatedLoan.outstandingBalance <= 0.001) {
          updatedLoan.outstandingBalance = 0;
          updatedLoan.status = "repaid";
          await updatedLoan.save({ session });
        }

        repaymentAllocations.push({
          loan: loan._id,
          amount: repayment,
        });

        totalDeduction = roundMoney(
          totalDeduction + repayment
        );

        remainingPayment = roundMoney(
          remainingPayment - repayment
        );
      }

      const outstandingAfter = roundMoney(
        Math.max(0, outstandingBefore - totalDeduction)
      );

      const finalPayment = roundMoney(
        Math.max(0, milkNetEarnings - totalDeduction)
      );

      // Create the permanent monthly settlement.
      const [settlement] = await MonthlySettlement.create(
        [
          {
            farmer: farmer._id,
            owner: req.user._id,
            month,
            milkNetEarnings: roundMoney(
              Math.max(0, milkNetEarnings)
            ),
            loanDeduction: totalDeduction,
            finalPayment,
            outstandingBefore,
            outstandingAfter,
            repaymentAllocations,
            settledBy: req.user._id,
          },
        ],
        { session }
      );

      settlementResult = settlement;
    });

    return res.status(200).json({
      success: true,
      message: "Farmer's monthly settlement completed successfully.",
      settlement: settlementResult,
    });
  } catch (error) {
    console.error("Monthly settlement error:", error);

    if (
      error.message === "MONTH_ALREADY_SETTLED" ||
      error.code === 11000
    ) {
      return res.status(409).json({
        success: false,
        message: "This farmer's month has already been settled.",
      });
    }

    if (error.message === "FARMER_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Farmer not found under your dairy.",
      });
    }

    if (error.message === "LOAN_BALANCE_CHANGED") {
      return res.status(409).json({
        success: false,
        message: "A loan balance changed during settlement. Please try again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to settle the farmer's monthly payment.",
    });
  } finally {
    await session.endSession();
  }
};

// Retrieve a farmer's finalized settlement history.
export const getMySettlements = async (req, res) => {
  try {
    const settlements = await MonthlySettlement.find({
      farmer: req.user._id,
    })
      .populate("settledBy", "fullName email")
      .populate("repaymentAllocations.loan")
      .sort({ month: -1 });

    return res.status(200).json({
      success: true,
      count: settlements.length,
      settlements,
    });
  } catch (error) {
    console.error("Get farmer settlements error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve settlement history.",
    });
  }
};
