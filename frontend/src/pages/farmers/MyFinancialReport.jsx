
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Banknote,
  CalendarDays,
  Droplets,
  Receipt,
  Wallet,
  UserRound,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Milk,
  HandCoins,
  CircleCheck,
  Clock3,
  ArrowDownCircle,
  Landmark,
  History,
  BadgeCheck,
} from "lucide-react";

import farmerFinancialReportService from "../../services/farmerFinancialReportService";

const getCurrentMonth = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Blantyre",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year").value;
  const month = parts.find((part) => part.type === "month").value;

  return `${year}-${month}`;
};

const formatCurrency = (amount) =>
  `K${Number(amount || 0).toLocaleString("en-MW", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatNumber = (number) =>
  Number(number || 0).toLocaleString("en-MW", {
    maximumFractionDigits: 2,
  });

const formatDate = (date) => {
  if (!date) return "-";

  // Milk record dates are stored as YYYY-MM-DD.
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split("-");

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    ).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "-";

  return parsedDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatMonth = (month) => {
  if (!month) return "";

  const [year, monthNumber] = month.split("-");

  return new Date(
    Number(year),
    Number(monthNumber) - 1,
    1
  ).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
};

const getLoanStatus = (status) => {
  const styles = {
    pending: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
    approved: "bg-blue-500/10 text-blue-300 border-blue-500/20",
    rejected: "bg-red-500/10 text-red-300 border-red-500/20",
    disbursed: "bg-green-500/10 text-green-300 border-green-500/20",
    repaid: "bg-[#86efac]/10 text-[#86efac] border-[#86efac]/20",
  };

  return styles[status] || "bg-[#303030] text-[#A3A3A3] border-[#383838]";
};

const SummaryCard = ({ title, value, subtitle, icon: Icon }) => (
  <div className="bg-[#222222] border border-[#383838] rounded-xl p-5">
    <div className="flex items-center justify-between mb-4">
      <p className="text-sm text-[#A3A3A3]">{title}</p>

      <div className="w-10 h-10 rounded-lg bg-[#303030] flex items-center justify-center">
        <Icon size={20} className="text-[#86efac]" />
      </div>
    </div>

    <h3 className="text-2xl font-semibold text-[#E7E7E7] break-words">
      {value}
    </h3>

    <p className="text-xs text-[#A3A3A3] mt-2">{subtitle}</p>
  </div>
);

const DetailCard = ({ title, value, description, icon: Icon }) => (
  <div className="bg-[#222222] border border-[#383838] rounded-xl p-5">
    <div className="flex items-center gap-2 text-sm text-[#A3A3A3]">
      <Icon size={17} className="text-[#86efac]" />
      {title}
    </div>

    <p className="text-2xl font-semibold mt-3">
      {value}
    </p>

    {description && (
      <p className="text-xs text-[#A3A3A3] mt-2">
        {description}
      </p>
    )}
  </div>
);

const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="p-8 text-center">
    <Icon size={32} className="text-[#666666] mx-auto mb-3" />
    <p className="font-medium">{title}</p>
    <p className="text-sm text-[#A3A3A3] mt-1">{description}</p>
  </div>
);

const MyFinancialReport = () => {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);

  const [records, setRecords] = useState([]);
  const [farmer, setFarmer] = useState(null);
  const [loans, setLoans] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [eligibility, setEligibility] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchReport = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const data =
          await farmerFinancialReportService.getMyFinancialReport(
            selectedMonth
          );

        const farmerRecords = Array.isArray(data.records)
          ? data.records
          : [];

        setRecords(farmerRecords);
        setFarmer(farmerRecords[0]?.farmer || null);
        setLoans(Array.isArray(data.loans) ? data.loans : []);
        setSettlements(
          Array.isArray(data.settlements) ? data.settlements : []
        );
        setEligibility(data.eligibility || null);
      } catch (err) {
        setError(
          err.message || "Unable to load your financial report."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedMonth]
  );

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Only records with complete saved financial values are included.
  const financialRecords = useMemo(
    () =>
      records.filter(
        (record) =>
          Number(record.pricePerLitre) > 0 &&
          record.grossAmount !== undefined &&
          record.grossAmount !== null &&
          record.taxAmount !== undefined &&
          record.taxAmount !== null &&
          record.welfareDeduction !== undefined &&
          record.welfareDeduction !== null &&
          record.netAmount !== undefined &&
          record.netAmount !== null
      ),
    [records]
  );

  const unpricedRecords = useMemo(
    () => records.filter((record) => !financialRecords.includes(record)),
    [records, financialRecords]
  );

  const summary = useMemo(
    () =>
      financialRecords.reduce(
        (totals, record) => ({
          totalLitres:
            totals.totalLitres + Number(record.quantityLitres || 0),

          grossAmount:
            totals.grossAmount + Number(record.grossAmount || 0),

          taxAmount:
            totals.taxAmount + Number(record.taxAmount || 0),

          welfareDeduction:
            totals.welfareDeduction +
            Number(record.welfareDeduction || 0),

          netAmount:
            totals.netAmount + Number(record.netAmount || 0),
        }),
        {
          totalLitres: 0,
          grossAmount: 0,
          taxAmount: 0,
          welfareDeduction: 0,
          netAmount: 0,
        }
      ),
    [financialRecords]
  );

  const totalLitres = records.reduce(
    (total, record) =>
      total + Number(record.quantityLitres || 0),
    0
  );

  // A loan is borrowed money only after it has been disbursed.
  const loanSummary = useMemo(() => {
    return loans.reduce(
      (totals, loan) => {
        const isBorrowed =
          loan.status === "disbursed" || loan.status === "repaid";

        const repayments = Array.isArray(loan.repayments)
          ? loan.repayments
          : [];

        return {
          totalDisbursed:
            totals.totalDisbursed +
            (isBorrowed ? Number(loan.disbursedAmount || 0) : 0),

          totalRepaid:
            totals.totalRepaid +
            repayments.reduce(
              (total, repayment) =>
                total + Number(repayment.amount || 0),
              0
            ),

          outstandingBalance:
            totals.outstandingBalance +
            (isBorrowed ? Number(loan.outstandingBalance || 0) : 0),

          pendingAmount:
            totals.pendingAmount +
            (loan.status === "pending"
              ? Number(loan.requestedAmount || 0)
              : 0),

          approvedAmount:
            totals.approvedAmount +
            (loan.status === "approved"
              ? Number(loan.approvedAmount || 0)
              : 0),

          loanCount: totals.loanCount + 1,
        };
      },
      {
        totalDisbursed: 0,
        totalRepaid: 0,
        outstandingBalance: 0,
        pendingAmount: 0,
        approvedAmount: 0,
        loanCount: 0,
      }
    );
  }, [loans]);

  const selectedSettlement = useMemo(
    () =>
      settlements.find(
        (settlement) => settlement.month === selectedMonth
      ) || null,
    [settlements, selectedMonth]
  );

  // Repayment history is read from each loan's repayment array.
  // Settlement allocations are not added again, preventing double-counting.
  const repaymentHistory = useMemo(() => {
    return loans
      .flatMap((loan) =>
        (Array.isArray(loan.repayments) ? loan.repayments : []).map(
          (repayment, index) => ({
            ...repayment,
            loanId: loan._id,
            loanReason: loan.reason || "Farmer loan",
            loanStatus: loan.status,
            repaymentId: `${loan._id}-${repayment.month}-${index}`,
          })
        )
      )
      .sort((a, b) => {
        const dateA = new Date(a.paidAt || `${a.month}-01`).getTime();
        const dateB = new Date(b.paidAt || `${b.month}-01`).getTime();

        return dateB - dateA;
      });
  }, [loans]);

  const monthlyRepayments = repaymentHistory.filter(
    (repayment) => repayment.month === selectedMonth
  );

  const monthlyRepaymentTotal = monthlyRepayments.reduce(
    (total, repayment) =>
      total + Number(repayment.amount || 0),
    0
  );

  const sortedSettlements = [...settlements].sort((a, b) =>
    String(b.month).localeCompare(String(a.month))
  );

  return (
    <div className="space-y-7 text-[#E7E7E7]">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#86efac] text-sm mb-2">
            <Wallet size={17} />
            <span>My Finances</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-semibold">
            My Financial Report
          </h1>

          <p className="text-sm text-[#A3A3A3] mt-2">
            Track your milk earnings, loans, repayments and monthly payments.
          </p>
        </div>

        <button
          onClick={() => fetchReport(true)}
          disabled={loading || refreshing}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#383838] bg-[#222222] hover:bg-[#303030] transition disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* MONTH SELECTOR */}
      <div className="bg-[#222222] border border-[#383838] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#303030] flex items-center justify-center">
            <CalendarDays size={20} className="text-[#86efac]" />
          </div>

          <div>
            <p className="font-medium">Reporting Period</p>
            <p className="text-xs text-[#A3A3A3]">
              Choose the month you want to review.
            </p>
          </div>
        </div>

        <input
          type="month"
          value={selectedMonth}
          max={getCurrentMonth()}
          onChange={(event) => setSelectedMonth(event.target.value)}
          className="w-full sm:w-auto bg-[#181818] border border-[#383838] rounded-lg px-4 py-2.5 text-[#E7E7E7] outline-none focus:border-[#86efac] [color-scheme:dark]"
        />
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle
            size={20}
            className="text-red-400 shrink-0 mt-0.5"
          />

          <div className="flex-1">
            <p className="font-medium text-red-400">
              Unable to load financial report
            </p>
            <p className="text-sm text-red-300 mt-1">{error}</p>
          </div>

          <button
            onClick={() => fetchReport(true)}
            className="text-sm text-red-300 hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* LOADING */}
      {loading ? (
        <div className="bg-[#222222] border border-[#383838] rounded-xl p-12 text-center">
          <RefreshCw
            size={30}
            className="animate-spin text-[#86efac] mx-auto mb-4"
          />

          <p className="font-medium">
            Loading your financial statement...
          </p>

          <p className="text-sm text-[#A3A3A3] mt-2">
            Retrieving your milk deliveries, loans and settlements.
          </p>
        </div>
      ) : (
        <>
          {/* FARMER PROFILE */}
          <div className="bg-[#222222] border border-[#383838] rounded-xl p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-[#303030] flex items-center justify-center">
                <UserRound size={25} className="text-[#86efac]" />
              </div>

              <div>
                <h2 className="font-semibold text-lg">
                  Farmer Information
                </h2>
                <p className="text-xs text-[#A3A3A3]">
                  Your registered account details
                </p>
              </div>
            </div>

            {farmer ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div>
                  <p className="text-xs text-[#A3A3A3] mb-1">
                    Full Name
                  </p>
                  <p className="font-medium">
                    {farmer.fullName || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#A3A3A3] mb-1 flex items-center gap-1">
                    <Mail size={13} /> Email
                  </p>
                  <p className="font-medium break-all">
                    {farmer.email || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#A3A3A3] mb-1 flex items-center gap-1">
                    <Phone size={13} /> Phone
                  </p>
                  <p className="font-medium">
                    {farmer.phone || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#A3A3A3] mb-1 flex items-center gap-1">
                    <MapPin size={13} /> Location
                  </p>
                  <p className="font-medium">
                    {farmer.location || "-"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#A3A3A3]">
                Your profile information is not available in these milk records.
              </p>
            )}
          </div>

          {/* MONTHLY MILK STATEMENT */}
          <div>
            <h2 className="text-lg font-semibold">
              {formatMonth(selectedMonth)} Statement
            </h2>

            <p className="text-sm text-[#A3A3A3] mt-1">
              Your milk deliveries and earnings for this reporting period.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <SummaryCard
              title="Milk Delivered"
              value={`${formatNumber(totalLitres)} L`}
              subtitle={`${records.length} delivery record(s)`}
              icon={Droplets}
            />

            <SummaryCard
              title="Gross Milk Value"
              value={formatCurrency(summary.grossAmount)}
              subtitle="Value before deductions"
              icon={TrendingUp}
            />

            <SummaryCard
              title="Milk Deductions"
              value={formatCurrency(
                summary.taxAmount + summary.welfareDeduction
              )}
              subtitle="Tax and welfare contributions"
              icon={Receipt}
            />

            <SummaryCard
              title="Net Milk Earnings"
              value={formatCurrency(summary.netAmount)}
              subtitle="After tax and welfare deductions"
              icon={Wallet}
            />
          </div>

          {/* MILK DEDUCTIONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailCard
              title="Tax deduction (1%)"
              value={formatCurrency(summary.taxAmount)}
              description="Deducted from gross milk value"
              icon={Receipt}
            />

            <DetailCard
              title="Welfare contributions"
              value={formatCurrency(summary.welfareDeduction)}
              description="K350 per recorded delivery day"
              icon={Banknote}
            />
          </div>

          {/* LOAN OVERVIEW */}
          <div className="pt-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#222222] border border-[#383838] flex items-center justify-center">
                <HandCoins size={20} className="text-[#86efac]" />
              </div>

              <div>
                <h2 className="text-lg font-semibold">
                  My Loan Overview
                </h2>
                <p className="text-sm text-[#A3A3A3]">
                  Your borrowing, repayments and remaining debt.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <SummaryCard
                title="Total Borrowed"
                value={formatCurrency(loanSummary.totalDisbursed)}
                subtitle="Loans actually disbursed to you"
                icon={Banknote}
              />

              <SummaryCard
                title="Total Repaid"
                value={formatCurrency(loanSummary.totalRepaid)}
                subtitle="Repayments recorded against your loans"
                icon={ArrowDownCircle}
              />

              <SummaryCard
                title="Outstanding Balance"
                value={formatCurrency(loanSummary.outstandingBalance)}
                subtitle="Remaining balance on disbursed loans"
                icon={Landmark}
              />

              <SummaryCard
                title="Approved Awaiting Disbursement"
                value={formatCurrency(loanSummary.approvedAmount)}
                subtitle="Approved, but not yet counted as borrowed"
                icon={Clock3}
              />
            </div>

            {(loanSummary.pendingAmount > 0 || eligibility) && (
              <div className="mt-4 bg-[#222222] border border-[#383838] rounded-xl p-5">
                <h3 className="font-semibold mb-3">
                  Loan Request and Eligibility Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-[#A3A3A3]">
                      Pending loan requests
                    </p>
                    <p className="text-lg font-semibold mt-1">
                      {formatCurrency(loanSummary.pendingAmount)}
                    </p>
                  </div>

                  {eligibility && (
                    <>
                      <div>
                        <p className="text-xs text-[#A3A3A3]">
                          Current month's accrued net earnings
                        </p>
                        <p className="text-lg font-semibold mt-1">
                          {formatCurrency(eligibility.accruedNetEarnings)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-[#A3A3A3]">
                          Available loan eligibility
                        </p>
                        <p className="text-lg font-semibold text-[#86efac] mt-1">
                          {formatCurrency(eligibility.availableEligibility)}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <p className="text-xs text-[#A3A3A3] mt-4">
                  Pending requests and approved loans are not included in
                  your outstanding debt. A loan becomes borrowed money only
                  after the owner confirms its disbursement.
                </p>
              </div>
            )}
          </div>

          {/* MONTHLY SETTLEMENT */}
          <div className="bg-[#222222] border border-[#383838] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#383838] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#303030] flex items-center justify-center">
                  <BadgeCheck size={21} className="text-[#86efac]" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold">
                    Monthly Payment Settlement
                  </h2>
                  <p className="text-sm text-[#A3A3A3] mt-1">
                    Final payment and loan deductions for {formatMonth(selectedMonth)}.
                  </p>
                </div>
              </div>

              {selectedSettlement ? (
                <span className="inline-flex items-center gap-2 w-fit px-3 py-1.5 rounded-full text-xs border border-[#86efac]/20 bg-[#86efac]/10 text-[#86efac]">
                  <CircleCheck size={14} />
                  Settled
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 w-fit px-3 py-1.5 rounded-full text-xs border border-yellow-500/20 bg-yellow-500/10 text-yellow-300">
                  <Clock3 size={14} />
                  Not yet settled
                </span>
              )}
            </div>

            {selectedSettlement ? (
              <>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                  <div>
                    <p className="text-xs text-[#A3A3A3]">
                      Milk net earnings
                    </p>
                    <p className="text-xl font-semibold mt-2">
                      {formatCurrency(selectedSettlement.milkNetEarnings)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#A3A3A3]">
                      Loan deduction
                    </p>
                    <p className="text-xl font-semibold mt-2 text-orange-300">
                      {formatCurrency(selectedSettlement.loanDeduction)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#A3A3A3]">
                      Final payment
                    </p>
                    <p className="text-xl font-semibold mt-2 text-[#86efac]">
                      {formatCurrency(selectedSettlement.finalPayment)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#A3A3A3]">
                      Settlement date
                    </p>
                    <p className="text-xl font-semibold mt-2">
                      {formatDate(selectedSettlement.settledAt)}
                    </p>
                  </div>
                </div>

                <div className="border-t border-[#383838] p-5">
                  <h3 className="font-medium mb-4">
                    Loan Balance Movement
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-[#181818] rounded-lg p-4">
                      <p className="text-xs text-[#A3A3A3]">
                        Balance before settlement
                      </p>
                      <p className="text-lg font-semibold mt-2">
                        {formatCurrency(selectedSettlement.outstandingBefore)}
                      </p>
                    </div>

                    <div className="bg-[#181818] rounded-lg p-4">
                      <p className="text-xs text-[#A3A3A3]">
                        Amount repaid
                      </p>
                      <p className="text-lg font-semibold mt-2 text-orange-300">
                        {formatCurrency(selectedSettlement.loanDeduction)}
                      </p>
                    </div>

                    <div className="bg-[#181818] rounded-lg p-4">
                      <p className="text-xs text-[#A3A3A3]">
                        Balance carried forward
                      </p>
                      <p className="text-lg font-semibold mt-2 text-[#86efac]">
                        {formatCurrency(selectedSettlement.outstandingAfter)}
                      </p>
                    </div>
                  </div>
                </div>

                {Array.isArray(selectedSettlement.repaymentAllocations) &&
                  selectedSettlement.repaymentAllocations.length > 0 && (
                    <div className="border-t border-[#383838] p-5">
                      <h3 className="font-medium mb-3">
                        How This Month's Repayment Was Allocated
                      </h3>

                      <div className="space-y-3">
                        {selectedSettlement.repaymentAllocations.map(
                          (allocation, index) => {
                            const loan = allocation.loan;
                            const loanLabel =
                              loan && typeof loan === "object"
                                ? loan.reason || `Loan ${index + 1}`
                                : `Loan ${index + 1}`;

                            return (
                              <div
                                key={`${loan?._id || index}-${index}`}
                                className="flex items-center justify-between gap-4 text-sm border-b border-[#383838] last:border-0 pb-3 last:pb-0"
                              >
                                <div>
                                  <p className="font-medium">
                                    {loanLabel}
                                  </p>
                                  <p className="text-xs text-[#A3A3A3] mt-1">
                                    Loan repayment allocation
                                  </p>
                                </div>

                                <p className="font-semibold text-orange-300">
                                  {formatCurrency(allocation.amount)}
                                </p>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}
              </>
            ) : (
              <div className="p-5">
                <p className="text-sm text-[#A3A3A3]">
                  No finalized settlement is available for this month yet.
                  Your milk earnings and outstanding loan balance are shown
                  separately above. No repayment is treated as completed
                  until a settlement has been finalized.
                </p>
              </div>
            )}
          </div>

          {/* REPAYMENT HISTORY */}
          <div className="bg-[#222222] border border-[#383838] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#383838]">
              <div className="flex items-center gap-3">
                <History size={21} className="text-[#86efac]" />

                <div>
                  <h2 className="text-lg font-semibold">
                    Loan Repayment History
                  </h2>
                  <p className="text-sm text-[#A3A3A3] mt-1">
                    All repayments recorded against your disbursed loans.
                  </p>
                </div>
              </div>
            </div>

            {repaymentHistory.length === 0 ? (
              <EmptyState
                icon={HandCoins}
                title="No repayments recorded"
                description="Your loan repayments will appear here after monthly settlements."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-sm">
                  <thead className="bg-[#181818] text-[#A3A3A3]">
                    <tr>
                      <th className="text-left p-4 font-medium">Payment date</th>
                      <th className="text-left p-4 font-medium">Repayment month</th>
                      <th className="text-left p-4 font-medium">Loan</th>
                      <th className="text-right p-4 font-medium">Amount repaid</th>
                    </tr>
                  </thead>

                  <tbody>
                    {repaymentHistory.map((repayment) => (
                      <tr
                        key={repayment.repaymentId}
                        className="border-t border-[#383838] hover:bg-[#292929] transition"
                      >
                        <td className="p-4">
                          {formatDate(repayment.paidAt)}
                        </td>

                        <td className="p-4">
                          {formatMonth(repayment.month)}
                        </td>

                        <td className="p-4">
                          <p className="font-medium">
                            {repayment.loanReason}
                          </p>
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 rounded-full border text-xs capitalize ${getLoanStatus(
                              repayment.loanStatus
                            )}`}
                          >
                            {repayment.loanStatus}
                          </span>
                        </td>

                        <td className="p-4 text-right font-semibold text-[#86efac]">
                          {formatCurrency(repayment.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ALL SETTLEMENTS */}
          <div className="bg-[#222222] border border-[#383838] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#383838]">
              <div className="flex items-center gap-3">
                <CalendarDays size={21} className="text-[#86efac]" />

                <div>
                  <h2 className="text-lg font-semibold">
                    Monthly Settlement History
                  </h2>
                  <p className="text-sm text-[#A3A3A3] mt-1">
                    Previous finalized monthly payments and carried-forward balances.
                  </p>
                </div>
              </div>
            </div>

            {sortedSettlements.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No settlement history yet"
                description="Your finalized monthly settlements will appear here."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-sm">
                  <thead className="bg-[#181818] text-[#A3A3A3]">
                    <tr>
                      <th className="text-left p-4 font-medium">Month</th>
                      <th className="text-right p-4 font-medium">Net earnings</th>
                      <th className="text-right p-4 font-medium">Loan deduction</th>
                      <th className="text-right p-4 font-medium">Final payment</th>
                      <th className="text-right p-4 font-medium">Balance carried forward</th>
                      <th className="text-right p-4 font-medium">Settled date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {sortedSettlements.map((settlement) => (
                      <tr
                        key={settlement._id}
                        className="border-t border-[#383838] hover:bg-[#292929] transition"
                      >
                        <td className="p-4 font-medium">
                          {formatMonth(settlement.month)}
                        </td>

                        <td className="p-4 text-right">
                          {formatCurrency(settlement.milkNetEarnings)}
                        </td>

                        <td className="p-4 text-right text-orange-300">
                          {formatCurrency(settlement.loanDeduction)}
                        </td>

                        <td className="p-4 text-right font-semibold text-[#86efac]">
                          {formatCurrency(settlement.finalPayment)}
                        </td>

                        <td className="p-4 text-right">
                          {formatCurrency(settlement.outstandingAfter)}
                        </td>

                        <td className="p-4 text-right">
                          {formatDate(settlement.settledAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* UNPRICED RECORDS NOTICE */}
          {unpricedRecords.length > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex gap-3">
              <AlertTriangle
                size={21}
                className="text-orange-400 shrink-0"
              />

              <div>
                <p className="font-medium text-orange-300">
                  Some deliveries need financial review
                </p>

                <p className="text-sm text-orange-200/80 mt-1">
                  {unpricedRecords.length} record(s), representing{" "}
                  {formatNumber(
                    unpricedRecords.reduce(
                      (total, record) =>
                        total + Number(record.quantityLitres || 0),
                      0
                    )
                  )}{" "}
                  litres, do not have complete saved financial details.
                  They are not included in your milk earnings totals.
                </p>
              </div>
            </div>
          )}

          {/* MILK DELIVERY HISTORY */}
          <div className="bg-[#222222] border border-[#383838] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#383838]">
              <div className="flex items-center gap-3">
                <Milk size={21} className="text-[#86efac]" />

                <div>
                  <h2 className="text-lg font-semibold">
                    My Milk Delivery History
                  </h2>

                  <p className="text-sm text-[#A3A3A3] mt-1">
                    Your recorded deliveries and their saved financial calculations.
                  </p>
                </div>
              </div>
            </div>

            {records.length === 0 ? (
              <EmptyState
                icon={Droplets}
                title="No milk deliveries found"
                description="No deliveries have been recorded for this month."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-sm">
                  <thead className="bg-[#181818] text-[#A3A3A3]">
                    <tr>
                      <th className="text-left p-4 font-medium">Date</th>
                      <th className="text-right p-4 font-medium">Litres</th>
                      <th className="text-right p-4 font-medium">Price / Litre</th>
                      <th className="text-right p-4 font-medium">Gross Value</th>
                      <th className="text-right p-4 font-medium">Tax</th>
                      <th className="text-right p-4 font-medium">Welfare</th>
                      <th className="text-right p-4 font-medium">Net Earnings</th>
                      <th className="text-right p-4 font-medium">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {[...records]
                      .sort((a, b) =>
                        b.recordDate.localeCompare(a.recordDate)
                      )
                      .map((record) => {
                        const hasFinancialData =
                          financialRecords.includes(record);

                        return (
                          <tr
                            key={record._id}
                            className="border-t border-[#383838] hover:bg-[#292929] transition"
                          >
                            <td className="p-4 font-medium">
                              {formatDate(record.recordDate)}
                            </td>

                            <td className="p-4 text-right">
                              {formatNumber(record.quantityLitres)} L
                            </td>

                            <td className="p-4 text-right">
                              {hasFinancialData
                                ? formatCurrency(record.pricePerLitre)
                                : "-"}
                            </td>

                            <td className="p-4 text-right">
                              {hasFinancialData
                                ? formatCurrency(record.grossAmount)
                                : "-"}
                            </td>

                            <td className="p-4 text-right text-orange-300">
                              {hasFinancialData
                                ? formatCurrency(record.taxAmount)
                                : "-"}
                            </td>

                            <td className="p-4 text-right">
                              {hasFinancialData
                                ? formatCurrency(record.welfareDeduction)
                                : "-"}
                            </td>

                            <td className="p-4 text-right text-[#86efac] font-semibold">
                              {hasFinancialData
                                ? formatCurrency(record.netAmount)
                                : "-"}
                            </td>

                            <td className="p-4 text-right">
                              {hasFinancialData ? (
                                <span className="text-xs text-[#86efac]">
                                  Calculated
                                </span>
                              ) : (
                                <span className="text-xs text-orange-300">
                                  Review needed
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* CALCULATION INFORMATION */}
          <div className="bg-[#222222] border border-[#383838] rounded-xl p-5">
            <h3 className="font-semibold mb-3">
              How Your Earnings and Repayments Work
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-[#A3A3A3]">Gross milk value</span>
                <span>Litres × saved price per litre</span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-[#A3A3A3]">Tax deduction</span>
                <span>1% of gross milk value</span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-[#A3A3A3]">Welfare deduction</span>
                <span>K350 per recorded delivery day</span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-[#A3A3A3]">Loan repayment</span>
                <span>Deducted during monthly settlement</span>
              </div>

              <div className="border-t border-[#383838] pt-3 flex justify-between gap-4 font-semibold">
                <span>Final payment</span>
                <span className="text-[#86efac]">
                  Net milk earnings − loan deduction
                </span>
              </div>
            </div>

            <p className="text-xs text-[#A3A3A3] mt-4">
              Your milk records retain the price that applied when each
              delivery was recorded. Loan balances are reduced only when a
              monthly settlement is finalized. Any unpaid loan balance
              carries forward to the next month.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default MyFinancialReport;
