
import { useCallback, useEffect, useState } from "react";
import {
  HandCoins,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Wallet,
  Banknote,
  TrendingUp,
  AlertCircle,
  UserRound,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  History,
  ShieldCheck,
  Loader2,
} from "lucide-react";

import ownerLoanService from "../../services/ownerLoanService";

const formatMoney = (value) => {
  const amount = Number(value || 0);

  return `K${amount.toLocaleString("en-MW", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (date) => {
  if (!date) return "Not available";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const statusStyles = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  approved: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
  disbursed: "bg-green-500/10 text-green-400 border-green-500/20",
  repaid: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium capitalize ${
      statusStyles[status] ||
      "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }`}
  >
    {status}
  </span>
);

const SummaryCard = ({
  title,
  value,
  description,
  icon: Icon,
}) => (
  <div className="rounded-xl border border-[#383838] bg-[#222222] p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-[#A3A3A3]">{title}</p>
        <h3 className="mt-2 text-xl font-semibold text-[#E7E7E7]">
          {value}
        </h3>
      </div>

      <div className="rounded-lg bg-[#86efac]/10 p-3">
        <Icon size={21} className="text-[#86efac]" />
      </div>
    </div>

    <p className="mt-3 text-xs text-[#A3A3A3]">
      {description}
    </p>
  </div>
);

const LoanManagement = () => {
  const [loans, setLoans] = useState([]);
  const [summary, setSummary] = useState({});
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [expandedLoan, setExpandedLoan] = useState(null);
  const [actionLoan, setActionLoan] = useState(null);
  const [actionType, setActionType] = useState("");

  const [approvedAmount, setApprovedAmount] = useState("");
  const [ownerNotes, setOwnerNotes] = useState("");

  const fetchLoans = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await ownerLoanService.getLoans(statusFilter);

      setLoans(data.loans || []);
      setSummary(data.summary || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const closeAction = () => {
    setActionLoan(null);
    setActionType("");
    setApprovedAmount("");
    setOwnerNotes("");
  };

  const openAction = (loan, type) => {
    setActionLoan(loan._id);
    setActionType(type);
    setApprovedAmount(
      type === "approve"
        ? String(loan.requestedAmount || "")
        : ""
    );
    setOwnerNotes("");
    setError("");
    setSuccess("");
  };

  const handleApprove = async (loan) => {
    const amount = Number(approvedAmount);
    const eligibility = Number(
      loan.farmerFinancials?.availableEligibility || 0
    );

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid approved amount.");
      return;
    }

    if (amount > Number(loan.requestedAmount)) {
      setError("The approved amount cannot exceed the requested amount.");
      return;
    }

    if (amount > eligibility) {
      setError(
        "The approved amount exceeds the farmer's currently displayed eligibility. Refresh the applications and review the updated figures."
      );
      return;
    }

    try {
      setProcessingId(loan._id);
      setError("");
      setSuccess("");

      const result = await ownerLoanService.approveLoan(
        loan._id,
        amount,
        ownerNotes
      );

      setSuccess(result.message || "Loan approved successfully.");
      closeAction();

      await fetchLoans(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (loan) => {
    try {
      setProcessingId(loan._id);
      setError("");
      setSuccess("");

      const result = await ownerLoanService.rejectLoan(
        loan._id,
        ownerNotes
      );

      setSuccess(result.message || "Loan application rejected.");
      closeAction();

      await fetchLoans(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDisbursement = async (loan) => {
    const confirmed = window.confirm(
      `Confirm that ${loan.farmer?.fullName || "the farmer"} has actually received ${formatMoney(loan.approvedAmount)}? This will create an outstanding loan balance.`
    );

    if (!confirmed) return;

    try {
      setProcessingId(loan._id);
      setError("");
      setSuccess("");

      const result = await ownerLoanService.disburseLoan(
        loan._id
      );

      setSuccess(
        result.message || "Loan disbursement confirmed."
      );

      await fetchLoans(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const toggleExpanded = (loanId) => {
    setExpandedLoan((current) =>
      current === loanId ? null : loanId
    );
  };

  const filterOptions = [
    { value: "all", label: "All Applications" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "disbursed", label: "Disbursed" },
    { value: "repaid", label: "Repaid" },
    { value: "rejected", label: "Rejected" },
  ];

  return (
    <div className="space-y-6 text-[#E7E7E7]">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#86efac]/10 p-3">
              <HandCoins
                size={25}
                className="text-[#86efac]"
              />
            </div>

            <div>
              <h1 className="text-2xl font-semibold">
                Loan Management
              </h1>
              <p className="mt-1 text-sm text-[#A3A3A3]">
                Review farmer applications and manage loan repayments.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => fetchLoans(true)}
          disabled={refreshing || loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#383838] bg-[#222222] px-4 py-2.5 text-sm transition hover:bg-[#2b2b2b] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Feedback */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Pending Applications"
          value={summary.pendingApplications || 0}
          description={`${formatMoney(summary.pendingRequestedAmount)} requested`}
          icon={Clock}
        />

        <SummaryCard
          title="Approved Awaiting Disbursement"
          value={summary.approvedAwaitingDisbursement || 0}
          description={`${formatMoney(summary.approvedAmount)} approved`}
          icon={CheckCircle2}
        />

        <SummaryCard
          title="Total Disbursed"
          value={formatMoney(summary.totalDisbursed)}
          description="Loans actually released to farmers"
          icon={Banknote}
        />

        <SummaryCard
          title="Outstanding Balance"
          value={formatMoney(summary.outstandingBalance)}
          description={`${formatMoney(summary.totalRepaid)} repaid so far`}
          icon={Wallet}
        />
      </div>

      {/* Loan management information */}
      <div className="rounded-xl border border-[#86efac]/20 bg-[#86efac]/5 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck
            size={20}
            className="mt-0.5 shrink-0 text-[#86efac]"
          />

          <div>
            <h3 className="font-medium text-[#86efac]">
              Loan approval and disbursement
            </h3>
            <p className="mt-1 text-sm leading-6 text-[#A3A3A3]">
              Approving an application does not create a debt.
              The outstanding balance is created only after you
              confirm that the approved money has actually been
              disbursed to the farmer. Loans carry 0% interest.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            Loan Applications
          </h2>
          <p className="mt-1 text-sm text-[#A3A3A3]">
            {loans.length} application{loans.length === 1 ? "" : "s"} displayed
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="loan-status-filter"
            className="text-sm text-[#A3A3A3]"
          >
            Status
          </label>

          <select
            id="loan-status-filter"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setExpandedLoan(null);
              closeAction();
            }}
            className="rounded-lg border border-[#383838] bg-[#222222] px-3 py-2 text-sm text-[#E7E7E7] outline-none focus:border-[#86efac]"
          >
            {filterOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Applications */}
      {loading ? (
        <div className="flex min-h-56 items-center justify-center gap-3 text-[#A3A3A3]">
          <Loader2 size={22} className="animate-spin" />
          Loading loan applications...
        </div>
      ) : loans.length === 0 ? (
        <div className="rounded-xl border border-[#383838] bg-[#222222] px-5 py-16 text-center">
          <HandCoins
            size={40}
            className="mx-auto text-[#A3A3A3]"
          />
          <h3 className="mt-4 text-lg font-medium">
            No loan applications found
          </h3>
          <p className="mt-2 text-sm text-[#A3A3A3]">
            There are no applications matching this status.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {loans.map((loan) => {
            const farmer = loan.farmer || {};
            const buyer = loan.buyer || {};
            const financials = loan.farmerFinancials || {};

            const isExpanded = expandedLoan === loan._id;
            const isActionOpen = actionLoan === loan._id;
            const isProcessing = processingId === loan._id;

            return (
              <div
                key={loan._id}
                className="overflow-hidden rounded-xl border border-[#383838] bg-[#222222]"
              >
                {/* Loan header */}
                <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-[#86efac]/10 p-3">
                      <UserRound
                        size={22}
                        className="text-[#86efac]"
                      />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">
                          {farmer.fullName || "Farmer information unavailable"}
                        </h3>

                        <StatusBadge status={loan.status} />
                      </div>

                      <p className="mt-1 text-sm text-[#A3A3A3]">
                        {farmer.email || "No email available"}
                      </p>

                      <p className="mt-1 text-xs text-[#777777]">
                        Applied {formatDate(loan.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-5">
                    <div>
                      <p className="text-xs text-[#A3A3A3]">
                        Requested Amount
                      </p>
                      <p className="mt-1 font-semibold">
                        {formatMoney(loan.requestedAmount)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#A3A3A3]">
                        {loan.status === "pending"
                          ? "Available Eligibility"
                          : "Approved Amount"}
                      </p>
                      <p className="mt-1 font-semibold text-[#86efac]">
                        {loan.status === "pending"
                          ? formatMoney(financials.availableEligibility)
                          : formatMoney(loan.approvedAmount)}
                      </p>
                    </div>

                    <button
                      onClick={() => toggleExpanded(loan._id)}
                      className="flex items-center gap-2 rounded-lg border border-[#383838] px-3 py-2 text-sm hover:bg-[#2b2b2b]"
                    >
                      {isExpanded ? "Hide details" : "View details"}
                      {isExpanded ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-[#383838] p-5">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                      {/* Farmer details */}
                      <div className="space-y-3">
                        <h4 className="font-medium">
                          Farmer Information
                        </h4>

                        <div className="space-y-2 rounded-lg bg-[#181818] p-4 text-sm">
                          <p className="flex justify-between gap-4">
                            <span className="text-[#A3A3A3]">Phone</span>
                            <span>{farmer.phone || "Not provided"}</span>
                          </p>

                          <p className="flex justify-between gap-4">
                            <span className="text-[#A3A3A3]">Location</span>
                            <span>{farmer.location || "Not provided"}</span>
                          </p>

                          <p className="flex justify-between gap-4">
                            <span className="text-[#A3A3A3]">Buyer</span>
                            <span>{buyer.fullName || "Not available"}</span>
                          </p>
                        </div>

                        <h4 className="pt-2 font-medium">
                          Application Reason
                        </h4>

                        <p className="rounded-lg bg-[#181818] p-4 text-sm leading-6 text-[#A3A3A3]">
                          {loan.reason || "No reason provided."}
                        </p>

                        {loan.ownerNotes && (
                          <>
                            <h4 className="font-medium">
                              Owner Notes
                            </h4>
                            <p className="rounded-lg bg-[#181818] p-4 text-sm leading-6 text-[#A3A3A3]">
                              {loan.ownerNotes}
                            </p>
                          </>
                        )}
                      </div>

                      {/* Financial position */}
                      <div className="space-y-3">
                        <h4 className="font-medium">
                          Current Financial Position
                        </h4>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="rounded-lg bg-[#181818] p-4">
                            <p className="text-xs text-[#A3A3A3]">
                              Accrued Net Earnings
                            </p>
                            <p className="mt-2 font-semibold">
                              {formatMoney(financials.accruedNetEarnings)}
                            </p>
                          </div>

                          <div className="rounded-lg bg-[#181818] p-4">
                            <p className="text-xs text-[#A3A3A3]">
                              Maximum Eligibility
                            </p>
                            <p className="mt-2 font-semibold">
                              {formatMoney(financials.maximumLoan)}
                            </p>
                          </div>

                          <div className="rounded-lg bg-[#181818] p-4">
                            <p className="text-xs text-[#A3A3A3]">
                              Existing Commitments
                            </p>
                            <p className="mt-2 font-semibold">
                              {formatMoney(financials.committedLoanAmount)}
                            </p>
                          </div>

                          <div className="rounded-lg bg-[#181818] p-4">
                            <p className="text-xs text-[#A3A3A3]">
                              Available Eligibility
                            </p>
                            <p className="mt-2 font-semibold text-[#86efac]">
                              {formatMoney(financials.availableEligibility)}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-[#777777]">
                          Eligibility month: {financials.month || "Not available"}.
                          Eligibility is based on 50% of current-month
                          accrued net milk earnings, less existing
                          commitments.
                        </p>
                      </div>
                    </div>

                    {/* Loan repayment information */}
                    <div className="mt-6 border-t border-[#383838] pt-5">
                      <h4 className="mb-4 flex items-center gap-2 font-medium">
                        <History
                          size={18}
                          className="text-[#86efac]"
                        />
                        Loan Financial History
                      </h4>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-lg bg-[#181818] p-4">
                          <p className="text-xs text-[#A3A3A3]">
                            Disbursed
                          </p>
                          <p className="mt-2 font-semibold">
                            {formatMoney(loan.disbursedAmount)}
                          </p>
                        </div>

                        <div className="rounded-lg bg-[#181818] p-4">
                          <p className="text-xs text-[#A3A3A3]">
                            Repaid
                          </p>
                          <p className="mt-2 font-semibold text-green-400">
                            {formatMoney(
                              (loan.repayments || []).reduce(
                                (total, repayment) =>
                                  total + Number(repayment.amount || 0),
                                0
                              )
                            )}
                          </p>
                        </div>

                        <div className="rounded-lg bg-[#181818] p-4">
                          <p className="text-xs text-[#A3A3A3]">
                            Outstanding Balance
                          </p>
                          <p className="mt-2 font-semibold text-yellow-400">
                            {formatMoney(loan.outstandingBalance)}
                          </p>
                        </div>
                      </div>

                      {(loan.repayments || []).length > 0 ? (
                        <div className="mt-4 overflow-x-auto">
                          <table className="w-full min-w-[450px] text-left text-sm">
                            <thead className="text-xs text-[#A3A3A3]">
                              <tr className="border-b border-[#383838]">
                                <th className="px-3 py-3">Month</th>
                                <th className="px-3 py-3">Payment Date</th>
                                <th className="px-3 py-3 text-right">
                                  Amount Repaid
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {loan.repayments.map((repayment, index) => (
                                <tr
                                  key={`${repayment.month}-${index}`}
                                  className="border-b border-[#383838]/60"
                                >
                                  <td className="px-3 py-3">
                                    {repayment.month}
                                  </td>
                                  <td className="px-3 py-3">
                                    {formatDate(repayment.paidAt)}
                                  </td>
                                  <td className="px-3 py-3 text-right font-medium text-green-400">
                                    {formatMoney(repayment.amount)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-[#777777]">
                          No repayments have been recorded for this loan.
                        </p>
                      )}
                    </div>

                    {/* Approval and disbursement information */}
                    <div className="mt-5 flex flex-wrap gap-5 border-t border-[#383838] pt-5 text-xs text-[#A3A3A3]">
                      {loan.reviewedAt && (
                        <span className="flex items-center gap-2">
                          <CalendarDays size={14} />
                          Reviewed {formatDate(loan.reviewedAt)}
                          {loan.reviewedBy?.fullName
                            ? ` by ${loan.reviewedBy.fullName}`
                            : ""}
                        </span>
                      )}

                      {loan.disbursedAt && (
                        <span className="flex items-center gap-2">
                          <Banknote size={14} />
                          Disbursed {formatDate(loan.disbursedAt)}
                          {loan.disbursedBy?.fullName
                            ? ` by ${loan.disbursedBy.fullName}`
                            : ""}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Pending application actions */}
                {loan.status === "pending" && (
                  <div className="border-t border-[#383838] p-5">
                    {isActionOpen ? (
                      <div className="space-y-4 rounded-lg bg-[#181818] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="font-medium">
                            {actionType === "approve"
                              ? "Review and approve application"
                              : "Reject loan application"}
                          </h4>

                          <button
                            onClick={closeAction}
                            className="text-sm text-[#A3A3A3] hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>

                        {actionType === "approve" && (
                          <div>
                            <label className="mb-2 block text-sm text-[#A3A3A3]">
                              Approved Amount (MWK)
                            </label>

                            <input
                              type="number"
                              min="0.01"
                              max={Math.min(
                                Number(loan.requestedAmount || 0),
                                Number(financials.availableEligibility || 0)
                              )}
                              step="0.01"
                              value={approvedAmount}
                              onChange={(event) =>
                                setApprovedAmount(event.target.value)
                              }
                              className="w-full rounded-lg border border-[#383838] bg-[#222222] px-4 py-3 text-sm outline-none focus:border-[#86efac]"
                            />

                            <p className="mt-2 text-xs text-[#777777]">
                              Requested: {formatMoney(loan.requestedAmount)}
                              {" · "}
                              Available eligibility: {formatMoney(financials.availableEligibility)}
                            </p>
                          </div>
                        )}

                        <div>
                          <label className="mb-2 block text-sm text-[#A3A3A3]">
                            Owner Notes
                          </label>

                          <textarea
                            rows={3}
                            maxLength={500}
                            value={ownerNotes}
                            onChange={(event) =>
                              setOwnerNotes(event.target.value)
                            }
                            placeholder={
                              actionType === "approve"
                                ? "Optional approval notes..."
                                : "Explain why this application is being rejected..."
                            }
                            className="w-full resize-y rounded-lg border border-[#383838] bg-[#222222] px-4 py-3 text-sm outline-none focus:border-[#86efac]"
                          />
                        </div>

                        <div className="flex flex-wrap gap-3">
                          {actionType === "approve" ? (
                            <button
                              onClick={() => handleApprove(loan)}
                              disabled={isProcessing}
                              className="inline-flex items-center gap-2 rounded-lg bg-[#86efac] px-4 py-2.5 text-sm font-semibold text-[#181818] hover:bg-[#6fe394] disabled:opacity-50"
                            >
                              {isProcessing && (
                                <Loader2 size={16} className="animate-spin" />
                              )}
                              Confirm Approval
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReject(loan)}
                              disabled={isProcessing}
                              className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                            >
                              {isProcessing && (
                                <Loader2 size={16} className="animate-spin" />
                              )}
                              Confirm Rejection
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => openAction(loan, "approve")}
                          className="inline-flex items-center gap-2 rounded-lg bg-[#86efac] px-4 py-2.5 text-sm font-semibold text-[#181818] hover:bg-[#6fe394]"
                        >
                          <CheckCircle2 size={16} />
                          Approve
                        </button>

                        <button
                          onClick={() => openAction(loan, "reject")}
                          className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10"
                        >
                          <XCircle size={16} />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Approved loan disbursement action */}
                {loan.status === "approved" && (
                  <div className="flex flex-col gap-3 border-t border-[#383838] bg-blue-500/5 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-400">
                        Awaiting disbursement
                      </p>
                      <p className="mt-1 text-xs text-[#A3A3A3]">
                        The approved amount is {formatMoney(loan.approvedAmount)}.
                        Confirm only after the farmer has actually received it.
                      </p>
                    </div>

                    <button
                      onClick={() => handleDisbursement(loan)}
                      disabled={isProcessing}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#86efac] px-4 py-2.5 text-sm font-semibold text-[#181818] hover:bg-[#6fe394] disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Banknote size={16} />
                      )}
                      Confirm Disbursement
                    </button>
                  </div>
                )}

                {/* Disbursed loan status */}
                {loan.status === "disbursed" && (
                  <div className="border-t border-[#383838] bg-green-500/5 px-5 py-4">
                    <p className="text-sm text-green-400">
                      Loan disbursed. Outstanding balance:{" "}
                      <strong>
                        {formatMoney(loan.outstandingBalance)}
                      </strong>
                    </p>
                  </div>
                )}

                {loan.status === "repaid" && (
                  <div className="border-t border-[#383838] bg-purple-500/5 px-5 py-4">
                    <p className="text-sm text-purple-400">
                      This loan has been fully repaid.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LoanManagement;
