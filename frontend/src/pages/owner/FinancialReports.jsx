
import { useCallback, useEffect, useState } from "react";
import {
  Banknote,
  CalendarDays,
  Download,
  Droplets,
  RefreshCw,
  Receipt,
  TrendingUp,
  Users,
  AlertTriangle,
  Wallet,
} from "lucide-react";

import financialReportService from "../../services/financialReportService";

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

const formatCurrency = (amount) => {
  return `K${Number(amount || 0).toLocaleString("en-MW", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatNumber = (number) => {
  return Number(number || 0).toLocaleString("en-MW", {
    maximumFractionDigits: 2,
  });
};

const formatDate = (date) => {
  if (!date) return "-";

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

const SummaryCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-[#86efac]",
}) => (
  <div className="bg-[#222222] border border-[#383838] rounded-xl p-5">
    <div className="flex items-center justify-between mb-4">
      <p className="text-sm text-[#A3A3A3]">{title}</p>

      <div className="w-10 h-10 rounded-lg bg-[#303030] flex items-center justify-center">
        <Icon size={20} className={iconColor} />
      </div>
    </div>

    <h3 className="text-2xl font-semibold text-[#E7E7E7] break-words">
      {value}
    </h3>

    <p className="text-xs text-[#A3A3A3] mt-2">{subtitle}</p>
  </div>
);

const FinancialReports = () => {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth);
  const [report, setReport] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Monthly settlement states.
  const [settlingFarmerId, setSettlingFarmerId] = useState(null);
  const [settlementError, setSettlementError] = useState("");
  const [settlementSuccess, setSettlementSuccess] = useState("");

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
          await financialReportService.getFinancialReport(
            selectedMonth
          );

        setReport(data);
      } catch (err) {
        setError(
          err.message || "Unable to load financial reports."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedMonth]
  );

  // Settle an individual farmer's monthly payment.
  const handleSettlePayment = async (farmer) => {
    if (!farmer?.farmerId || !selectedMonth) return;

    if (farmer.settlementStatus === "settled") {
      return;
    }

    // Only completed months should be settled.
    if (selectedMonth >= getCurrentMonth()) {
      setSettlementError(
        "Only completed months can be settled. The selected month is still open."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to settle ${farmer.farmerName}'s payment for ${formatMonth(selectedMonth)}?\n\n` +
        `Net milk earnings: ${formatCurrency(farmer.netAmount)}\n` +
        `Loan deduction: ${formatCurrency(farmer.loanDeduction)}\n` +
        `Final payment: ${formatCurrency(farmer.finalPayment)}\n\n` +
        "This action will record the repayment and cannot be repeated for this month."
    );

    if (!confirmed) return;

    try {
      setSettlingFarmerId(farmer.farmerId);
      setSettlementError("");
      setSettlementSuccess("");

      const response =
        await financialReportService.settleFarmerMonth(
          selectedMonth,
          farmer.farmerId
        );

      setSettlementSuccess(
        response.message ||
          `${farmer.farmerName}'s payment was settled successfully.`
      );

      // Reload authoritative figures from the backend.
      await fetchReport(true);
    } catch (err) {
      setSettlementError(
        err.message || "Unable to settle this farmer's payment."
      );

      // Reload in case the backend completed the transaction
      // but the client did not receive its response.
      await fetchReport(true);
    } finally {
      setSettlingFarmerId(null);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const summary = report?.summary || {};
  const farmers = report?.farmerBreakdown || [];
  const dailyReports = report?.dailyBreakdown || [];

  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
    setSettlementError("");
    setSettlementSuccess("");
  };

  const exportFarmerReport = () => {
    if (!farmers.length) return;

    const headers = [
      "Farmer Name",
      "Email",
      "Phone",
      "Records",
      "Total Litres",
      "Priced Litres",
      "Unpriced Litres",
      "Gross Amount",
      "Tax",
      "Welfare Deduction",
      "Net Payable",
      "Pending Loan Requests",
      "Approved Awaiting Disbursement",
      "Total Disbursed",
      "Total Repaid",
      "Outstanding Loan Balance",
      "Loan Deduction",
      "Final Payment",
      "Settlement Status",
      "Unpriced Records",
    ];

    const rows = farmers.map((farmer) => [
      farmer.farmerName,
      farmer.email,
      farmer.phone,
      farmer.totalRecords,
      farmer.totalLitres,
      farmer.pricedLitres,
      farmer.unpricedLitres,
      farmer.grossAmount,
      farmer.taxAmount,
      farmer.welfareDeduction,
      farmer.netAmount,
      farmer.pendingLoanAmount,
      farmer.approvedAwaitingDisbursement,
      farmer.totalDisbursed,
      farmer.totalRepaid,
      farmer.outstandingLoanBalance,
      farmer.loanDeduction,
      farmer.finalPayment,
      farmer.settlementStatus,
      farmer.unpricedRecords,
    ]);

    const csvContent = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) => {
            const safeValue = String(value ?? "").replace(/"/g, '""');
            return `"${safeValue}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `DairyFlow-Financial-Report-${selectedMonth}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-7 text-[#E7E7E7]">
      {/* PAGE HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#86efac] text-sm mb-2">
            <TrendingUp size={17} />
            <span>Financial Management</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-semibold">
            Financial Reports
          </h1>

          <p className="text-sm text-[#A3A3A3] mt-2">
            Monitor milk revenue, farmer earnings, deductions and
            daily financial performance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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

          <button
            onClick={exportFarmerReport}
            disabled={!farmers.length || loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#86efac] text-[#181818] font-medium hover:bg-[#6ee7a0] transition disabled:opacity-50"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
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
              Select a month to view financial performance.
            </p>
          </div>
        </div>

        <div className="relative">
          <input
            type="month"
            value={selectedMonth}
            onChange={handleMonthChange}
            className="w-full sm:w-auto bg-[#181818] border border-[#383838] rounded-lg px-4 py-2.5 text-[#E7E7E7] outline-none focus:border-[#86efac] [color-scheme:dark]"
          />
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle
            size={20}
            className="text-red-400 mt-0.5 shrink-0"
          />

          <div className="flex-1">
            <p className="font-medium text-red-400">
              Unable to load financial reports
            </p>

            <p className="text-sm text-red-300 mt-1">
              {error}
            </p>
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
      {loading && !report ? (
        <div className="bg-[#222222] border border-[#383838] rounded-xl p-12 text-center">
          <RefreshCw
            size={30}
            className="animate-spin text-[#86efac] mx-auto mb-4"
          />

          <p className="font-medium">Generating financial report...</p>

          <p className="text-sm text-[#A3A3A3] mt-2">
            Retrieving milk records and calculating financial totals.
          </p>
        </div>
      ) : (
        <>
          {/* REPORT PERIOD TITLE */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {formatMonth(report?.month || selectedMonth)}
              </h2>

              <p className="text-xs text-[#A3A3A3] mt-1">
                Monthly dairy financial overview
              </p>
            </div>

            {refreshing && (
              <span className="text-xs text-[#86efac]">
                Updating report...
              </span>
            )}
          </div>

          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <SummaryCard
              title="Total Milk Delivered"
              value={`${formatNumber(summary.totalLitres)} L`}
              subtitle={`${formatNumber(summary.totalRecords)} milk records`}
              icon={Droplets}
            />

            <SummaryCard
              title="Gross Milk Value"
              value={formatCurrency(summary.grossAmount)}
              subtitle={`${formatNumber(summary.pricedLitres)} priced litres`}
              icon={TrendingUp}
            />

            <SummaryCard
              title="Tax Deduction (1%)"
              value={formatCurrency(summary.taxAmount)}
              subtitle="Calculated from gross milk value"
              icon={Receipt}
              iconColor="text-orange-400"
            />

            <SummaryCard
              title="Net Payable"
              value={formatCurrency(summary.netAmount)}
              subtitle="After tax and welfare deductions"
              icon={Wallet}
              iconColor="text-[#86efac]"
            />
          </div>

          {/* ADDITIONAL STATISTICS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#222222] border border-[#383838] rounded-xl p-5">
              <div className="flex items-center gap-2 text-[#A3A3A3] text-sm">
                <Users size={17} />
                Farmers in dairy
              </div>

              <p className="text-2xl font-semibold mt-3">
                {formatNumber(summary.totalFarmers)}
              </p>
            </div>

            <div className="bg-[#222222] border border-[#383838] rounded-xl p-5">
              <div className="flex items-center gap-2 text-[#A3A3A3] text-sm">
                <Banknote size={17} />
                Welfare deductions
              </div>

              <p className="text-2xl font-semibold mt-3">
                {formatCurrency(summary.welfareDeduction)}
              </p>
            </div>

            <div className="bg-[#222222] border border-[#383838] rounded-xl p-5">
              <div className="flex items-center gap-2 text-[#A3A3A3] text-sm">
                <AlertTriangle size={17} />
                Unpriced records
              </div>

              <p className="text-2xl font-semibold mt-3">
                {formatNumber(summary.unpricedRecords)}
              </p>

              <p className="text-xs text-[#A3A3A3] mt-1">
                {formatNumber(summary.unpricedLitres)} L require review
              </p>
            </div>
          </div>

          {/* LOAN SUMMARY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <SummaryCard
              title="Outstanding Loans"
              value={formatCurrency(summary.outstandingLoanBalance)}
              subtitle="Remaining balances across disbursed loans"
              icon={Wallet}
              iconColor="text-orange-400"
            />

            <SummaryCard
              title="Loans Disbursed"
              value={formatCurrency(summary.totalDisbursed)}
              subtitle="Total amount actually given to farmers"
              icon={Banknote}
            />

            <SummaryCard
              title="Loan Repayments"
              value={formatCurrency(summary.totalRepaid)}
              subtitle="Total repayments recorded to date"
              icon={Receipt}
            />

            <SummaryCard
              title="Expected / Actual Final Payments"
              value={formatCurrency(summary.finalPayment)}
              subtitle="After current outstanding loan deductions"
              icon={TrendingUp}
            />
          </div>

          {/* FINANCIAL REVIEW WARNING */}
          {Number(summary.unpricedRecords) > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex gap-3">
              <AlertTriangle
                size={21}
                className="text-orange-400 shrink-0 mt-0.5"
              />

              <div>
                <p className="font-medium text-orange-300">
                  Financial review required
                </p>

                <p className="text-sm text-orange-200/80 mt-1">
                  {summary.unpricedRecords} milk record(s), representing{" "}
                  {formatNumber(summary.unpricedLitres)} litres, do not
                  have complete saved financial information. They are
                  excluded from financial totals.
                </p>
              </div>
            </div>
          )}

          {/* SETTLEMENT FEEDBACK */}
          {settlementError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <p className="font-medium text-red-400">
                Settlement unsuccessful
              </p>
              <p className="text-sm text-red-300 mt-1">
                {settlementError}
              </p>
            </div>
          )}

          {settlementSuccess && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <p className="font-medium text-green-400">
                Payment settled successfully
              </p>
              <p className="text-sm text-green-300 mt-1">
                {settlementSuccess}
              </p>
            </div>
          )}

          {/* FARMER EARNINGS TABLE */}
          <div className="bg-[#222222] border border-[#383838] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#383838]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold">
                    Farmer Earnings
                  </h2>

                  <p className="text-sm text-[#A3A3A3] mt-1">
                    Monthly financial performance by farmer.
                  </p>
                </div>

                <span className="text-xs text-[#86efac]">
                  {farmers.length} farmer(s) registered
                </span>
              </div>
            </div>

            {farmers.length === 0 ? (
              <div className="p-10 text-center">
                <Users
                  size={32}
                  className="text-[#666666] mx-auto mb-3"
                />

                <p className="font-medium">No farmer records found</p>

                <p className="text-sm text-[#A3A3A3] mt-1">
                  There are no farmers registered in this dairy.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1550px] text-sm">
                  <thead className="bg-[#181818] text-[#A3A3A3]">
                    <tr>
                      <th className="text-left p-4 font-medium">
                        Farmer
                      </th>

                      <th className="text-right p-4 font-medium">
                        Records
                      </th>

                      <th className="text-right p-4 font-medium">
                        Total Litres
                      </th>

                      <th className="text-right p-4 font-medium">
                        Gross
                      </th>

                      <th className="text-right p-4 font-medium">
                        Tax
                      </th>

                      <th className="text-right p-4 font-medium">
                        Welfare
                      </th>

                      <th className="text-right p-4 font-medium">
                        Net Milk Earnings
                      </th>

                      <th className="text-right p-4 font-medium">
                        Outstanding Loan
                      </th>

                      <th className="text-right p-4 font-medium">
                        Loan Deduction
                      </th>

                      <th className="text-right p-4 font-medium">
                        Final Payment
                      </th>

                      <th className="text-center p-4 font-medium">
                        Settlement
                      </th>

                      <th className="text-right p-4 font-medium">
                        Review
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {farmers.map((farmer) => (
                      <tr
                        key={farmer.farmerId}
                        className="border-t border-[#383838] hover:bg-[#292929] transition"
                      >
                        <td className="p-4">
                          <p className="font-medium">
                            {farmer.farmerName}
                          </p>

                          <p className="text-xs text-[#A3A3A3] mt-1">
                            {farmer.phone || farmer.email || "No contact"}
                          </p>
                        </td>

                        <td className="p-4 text-right">
                          {farmer.totalRecords}
                        </td>

                        <td className="p-4 text-right">
                          {formatNumber(farmer.totalLitres)} L
                        </td>

                        <td className="p-4 text-right">
                          {formatCurrency(farmer.grossAmount)}
                        </td>

                        <td className="p-4 text-right text-orange-300">
                          {formatCurrency(farmer.taxAmount)}
                        </td>

                        <td className="p-4 text-right">
                          {formatCurrency(farmer.welfareDeduction)}
                        </td>

                        <td className="p-4 text-right text-[#86efac] font-semibold">
                          {formatCurrency(farmer.netAmount)}
                        </td>

                        <td className="p-4 text-right text-orange-300">
                          {formatCurrency(farmer.outstandingLoanBalance)}
                        </td>

                        <td className="p-4 text-right">
                          {formatCurrency(farmer.loanDeduction)}
                        </td>

                        <td className="p-4 text-right text-[#86efac] font-semibold">
                          {formatCurrency(farmer.finalPayment)}
                        </td>

                        <td className="p-4 text-center">
                          {farmer.settlementStatus === "settled" ? (
                            <div className="inline-flex flex-col items-center gap-1">
                              <span className="text-green-400 text-xs font-medium">
                                Settled
                              </span>

                              <span className="text-[10px] text-[#A3A3A3]">
                                {farmer.settledAt
                                  ? new Date(
                                      farmer.settledAt
                                    ).toLocaleDateString("en-GB")
                                  : ""}
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleSettlePayment(farmer)}
                              disabled={
                                settlingFarmerId !== null ||
                                selectedMonth >= getCurrentMonth()
                              }
                              title={
                                selectedMonth >= getCurrentMonth()
                                  ? "Only completed months can be settled"
                                  : "Settle this farmer's monthly payment"
                              }
                              className="px-3 py-2 rounded-lg bg-[#86efac] text-[#181818] text-xs font-semibold hover:bg-[#6ee7a0] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              {settlingFarmerId === farmer.farmerId
                                ? "Settling..."
                                : selectedMonth >= getCurrentMonth()
                                  ? "Month Still Open"
                                  : "Settle Payment"}
                            </button>
                          )}
                        </td>

                        <td className="p-4 text-right">
                          {farmer.unpricedRecords > 0 ? (
                            <span className="inline-flex items-center gap-1 text-orange-300 text-xs">
                              <AlertTriangle size={14} />
                              {farmer.unpricedRecords}
                            </span>
                          ) : (
                            <span className="text-[#86efac] text-xs">
                              Clear
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* DAILY BREAKDOWN */}
          <div className="bg-[#222222] border border-[#383838] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#383838]">
              <h2 className="text-lg font-semibold">
                Daily Financial Breakdown
              </h2>

              <p className="text-sm text-[#A3A3A3] mt-1">
                Daily milk deliveries and financial totals.
              </p>
            </div>

            {dailyReports.length === 0 ? (
              <div className="p-10 text-center">
                <CalendarDays
                  size={32}
                  className="text-[#666666] mx-auto mb-3"
                />

                <p className="font-medium">No daily records available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-sm">
                  <thead className="bg-[#181818] text-[#A3A3A3]">
                    <tr>
                      <th className="text-left p-4 font-medium">
                        Date
                      </th>

                      <th className="text-right p-4 font-medium">
                        Farmers
                      </th>

                      <th className="text-right p-4 font-medium">
                        Records
                      </th>

                      <th className="text-right p-4 font-medium">
                        Litres
                      </th>

                      <th className="text-right p-4 font-medium">
                        Gross
                      </th>

                      <th className="text-right p-4 font-medium">
                        Tax
                      </th>

                      <th className="text-right p-4 font-medium">
                        Welfare
                      </th>

                      <th className="text-right p-4 font-medium">
                        Net Payable
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {[...dailyReports]
                      .sort((a, b) =>
                        b.date.localeCompare(a.date)
                      )
                      .map((day) => (
                        <tr
                          key={day.date}
                          className="border-t border-[#383838] hover:bg-[#292929] transition"
                        >
                          <td className="p-4 font-medium">
                            {formatDate(day.date)}
                          </td>

                          <td className="p-4 text-right">
                            {day.totalFarmers}
                          </td>

                          <td className="p-4 text-right">
                            {day.totalRecords}
                          </td>

                          <td className="p-4 text-right">
                            {formatNumber(day.totalLitres)} L
                          </td>

                          <td className="p-4 text-right">
                            {formatCurrency(day.grossAmount)}
                          </td>

                          <td className="p-4 text-right text-orange-300">
                            {formatCurrency(day.taxAmount)}
                          </td>

                          <td className="p-4 text-right">
                            {formatCurrency(day.welfareDeduction)}
                          </td>

                          <td className="p-4 text-right text-[#86efac] font-semibold">
                            {formatCurrency(day.netAmount)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* FINANCIAL CALCULATION INFORMATION */}
          <div className="bg-[#222222] border border-[#383838] rounded-xl p-5">
            <h3 className="font-semibold mb-3">
              Financial Calculation Rules
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-[#A3A3A3]">
                  Gross Milk Value
                </p>

                <p className="font-medium mt-1">
                  Litres × Saved Milk Price
                </p>
              </div>

              <div>
                <p className="text-sm text-[#A3A3A3]">
                  Tax Deduction
                </p>

                <p className="font-medium mt-1">
                  1% of Gross Milk Value
                </p>
              </div>

              <div>
                <p className="text-sm text-[#A3A3A3]">
                  Welfare Deduction
                </p>

                <p className="font-medium mt-1">
                  K350 per farmer per day
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#383838]">
              <p className="text-sm text-[#A3A3A3]">
                Net milk earnings = Gross value − Tax − Welfare
                deduction. Final payment = Net milk earnings − Loan
                deduction. Historical records retain the milk price
                saved when they were recorded.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FinancialReports;
