
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Send,
  HandCoins,
  Wallet,
  AlertTriangle,
  XCircle,
  CircleDollarSign,
  FileText,
  Info,
  TrendingUp,
  ShieldCheck,
  ArrowDownCircle,
  Landmark,
} from "lucide-react";

import loanService from "../../services/loanService";

const formatCurrency = (amount) =>
  `K${Number(amount || 0).toLocaleString("en-MW", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date) => {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "-";

  return parsedDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatMonth = (month) => {
  if (!month) return "-";

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

const statusConfig = {
  pending: {
    label: "Pending review",
    icon: Clock3,
    style: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
    description: "Your request is waiting for the owner to review it.",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle2,
    style: "bg-blue-500/10 text-blue-300 border-blue-500/20",
    description:
      "Your request has been approved. The owner still needs to confirm disbursement.",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    style: "bg-red-500/10 text-red-300 border-red-500/20",
    description: "Your loan request was not approved.",
  },
  disbursed: {
    label: "Disbursed",
    icon: Banknote,
    style: "bg-green-500/10 text-green-300 border-green-500/20",
    description: "The owner has confirmed that the loan was disbursed.",
  },
  repaid: {
    label: "Fully repaid",
    icon: ShieldCheck,
    style: "bg-[#86efac]/10 text-[#86efac] border-[#86efac]/20",
    description: "You have fully repaid this loan.",
  },
};

const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || {
    label: status || "Unknown",
    icon: Info,
    style: "bg-[#303030] text-[#A3A3A3] border-[#383838]",
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${config.style}`}
    >
      <Icon size={14} />
      {config.label}
    </span>
  );
};

const SummaryCard = ({ title, value, description, icon: Icon }) => (
  <div className="bg-[#222222] border border-[#383838] rounded-xl p-5">
    <div className="flex items-center justify-between mb-4">
      <p className="text-sm text-[#A3A3A3]">{title}</p>

      <div className="w-10 h-10 rounded-lg bg-[#303030] flex items-center justify-center">
        <Icon size={20} className="text-[#86efac]" />
      </div>
    </div>

    <h3 className="text-2xl font-semibold break-words">
      {value}
    </h3>

    <p className="text-xs text-[#A3A3A3] mt-2">
      {description}
    </p>
  </div>
);

const LoanApplication = () => {
  const [loans, setLoans] = useState([]);
  const [eligibility, setEligibility] = useState(null);

  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchLoans = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await loanService.getMyLoans();

      setLoans(Array.isArray(data.loans) ? data.loans : []);
      setEligibility(data.eligibility || null);
    } catch (err) {
      setError(err.message || "Unable to load your loan information.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const hasPendingRequest = loans.some(
    (loan) => loan.status === "pending"
  );

  const totalDisbursed = useMemo(
    () =>
      loans.reduce((total, loan) => {
        if (
          loan.status !== "disbursed" &&
          loan.status !== "repaid"
        ) {
          return total;
        }

        return total + Number(loan.disbursedAmount || 0);
      }, 0),
    [loans]
  );

  const totalOutstanding = useMemo(
    () =>
      loans.reduce((total, loan) => {
        if (
          loan.status !== "disbursed" &&
          loan.status !== "repaid"
        ) {
          return total;
        }

        return total + Number(loan.outstandingBalance || 0);
      }, 0),
    [loans]
  );

  const totalRepaid = useMemo(
    () =>
      loans.reduce(
        (total, loan) =>
          total +
          (Array.isArray(loan.repayments)
            ? loan.repayments.reduce(
                (sum, repayment) =>
                  sum + Number(repayment.amount || 0),
                0
              )
            : 0),
        0
      ),
    [loans]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const requestedAmount = Number(amount);

    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      setError("Enter a valid loan amount greater than zero.");
      return;
    }

    if (!reason.trim()) {
      setError("Please explain why you need the loan.");
      return;
    }

    if (reason.trim().length > 500) {
      setError("Your reason cannot exceed 500 characters.");
      return;
    }

    if (hasPendingRequest) {
      setError(
        "You already have a pending loan request. Wait for the owner to review it."
      );
      return;
    }

    if (
      eligibility &&
      requestedAmount > Number(eligibility.availableEligibility || 0)
    ) {
      setError(
        `Your requested amount exceeds your available eligibility of ${formatCurrency(
          eligibility.availableEligibility
        )}.`
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await loanService.requestLoan(
        requestedAmount,
        reason
      );

      setSuccess(
        response.message ||
          "Your loan request has been submitted successfully."
      );

      setAmount("");
      setReason("");

      await fetchLoans(true);
    } catch (err) {
      setError(err.message || "Failed to submit your loan request.");

      // The backend may return updated eligibility if the amount
      // is no longer available. Refresh the displayed figures.
      if (err.eligibility) {
        setEligibility(err.eligibility);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-7 text-[#E7E7E7]">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#86efac] text-sm mb-2">
            <HandCoins size={17} />
            <span>Farmer Services</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-semibold">
            Loan Centre
          </h1>

          <p className="text-sm text-[#A3A3A3] mt-2">
            Apply for a loan, monitor your application and track repayments.
          </p>
        </div>

        <button
          onClick={() => fetchLoans(true)}
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

      {/* NOTIFICATIONS */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle
            size={20}
            className="text-red-400 shrink-0 mt-0.5"
          />

          <p className="text-sm text-red-300 flex-1">{error}</p>

          <button
            onClick={() => setError("")}
            className="text-red-300 hover:text-white text-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle2
            size={20}
            className="text-green-400 shrink-0 mt-0.5"
          />

          <p className="text-sm text-green-300 flex-1">{success}</p>

          <button
            onClick={() => setSuccess("")}
            className="text-green-300 hover:text-white text-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="bg-[#222222] border border-[#383838] rounded-xl p-12 text-center">
          <RefreshCw
            size={30}
            className="animate-spin text-[#86efac] mx-auto mb-4"
          />

          <p className="font-medium">Loading your loan information...</p>

          <p className="text-sm text-[#A3A3A3] mt-2">
            Checking your eligibility and loan history.
          </p>
        </div>
      ) : (
        <>
          {/* ELIGIBILITY */}
          <div className="bg-[#222222] border border-[#383838] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#383838]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#303030] flex items-center justify-center">
                  <CircleDollarSign
                    size={23}
                    className="text-[#86efac]"
                  />
                </div>

                <div>
                  <h2 className="font-semibold text-lg">
                    Your Loan Eligibility
                  </h2>

                  <p className="text-sm text-[#A3A3A3]">
                    Based on your current month's milk earnings.
                  </p>
                </div>
              </div>
            </div>

            {eligibility ? (
              <div className="p-5">
                <div className="bg-[#181818] border border-[#383838] rounded-xl p-5 mb-5">
                  <p className="text-sm text-[#A3A3A3]">
                    Available amount you can request
                  </p>

                  <h2 className="text-3xl md:text-4xl font-bold text-[#86efac] mt-2">
                    {formatCurrency(eligibility.availableEligibility)}
                  </h2>

                  <p className="text-xs text-[#A3A3A3] mt-2">
                    Eligibility for {formatMonth(eligibility.month)}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <p className="text-xs text-[#A3A3A3]">
                      Accrued net milk earnings
                    </p>
                    <p className="text-lg font-semibold mt-1">
                      {formatCurrency(eligibility.accruedNetEarnings)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#A3A3A3]">
                      Maximum loan (50%)
                    </p>
                    <p className="text-lg font-semibold mt-1">
                      {formatCurrency(eligibility.maximumLoan)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#A3A3A3]">
                      Existing commitments
                    </p>
                    <p className="text-lg font-semibold mt-1">
                      {formatCurrency(eligibility.committedLoanAmount)}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex justify-between text-xs text-[#A3A3A3] mb-2">
                    <span>Committed eligibility</span>
                    <span>
                      {formatCurrency(eligibility.committedLoanAmount)} of{" "}
                      {formatCurrency(eligibility.maximumLoan)}
                    </span>
                  </div>

                  <div className="h-2 bg-[#383838] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#86efac] rounded-full transition-all"
                      style={{
                        width: `${
                          Number(eligibility.maximumLoan) > 0
                            ? Math.min(
                                100,
                                (Number(eligibility.committedLoanAmount) /
                                  Number(eligibility.maximumLoan)) *
                                  100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <p className="text-sm text-[#A3A3A3]">
                  Your loan eligibility information is currently unavailable.
                  Refresh the page to try again.
                </p>
              </div>
            )}
          </div>

          {/* LOAN SUMMARY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <SummaryCard
              title="Total Disbursed"
              value={formatCurrency(totalDisbursed)}
              description="Money confirmed as received"
              icon={Banknote}
            />

            <SummaryCard
              title="Total Repaid"
              value={formatCurrency(totalRepaid)}
              description="Repayments deducted through settlements"
              icon={ArrowDownCircle}
            />

            <SummaryCard
              title="Outstanding Debt"
              value={formatCurrency(totalOutstanding)}
              description="Remaining balance on your loans"
              icon={Landmark}
            />
          </div>

          {/* APPLICATION FORM */}
          <div className="bg-[#222222] border border-[#383838] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#383838]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#303030] flex items-center justify-center">
                  <FileText size={21} className="text-[#86efac]" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold">
                    Apply for a Loan
                  </h2>

                  <p className="text-sm text-[#A3A3A3] mt-1">
                    Complete the form to submit a request to your dairy owner.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {hasPendingRequest && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex gap-3">
                  <Clock3
                    size={19}
                    className="text-yellow-300 shrink-0 mt-0.5"
                  />

                  <div>
                    <p className="font-medium text-yellow-200">
                      You already have a pending application
                    </p>
                    <p className="text-sm text-yellow-200/80 mt-1">
                      You can submit another request after the owner has
                      reviewed your current application.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="loanAmount"
                  className="block text-sm font-medium mb-2"
                >
                  Amount requested (MWK)
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A3A3A3]">
                    K
                  </span>

                  <input
                    id="loanAmount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={eligibility?.availableEligibility || undefined}
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="Enter amount"
                    disabled={
                      submitting ||
                      hasPendingRequest ||
                      !eligibility ||
                      Number(eligibility.availableEligibility) <= 0
                    }
                    className="w-full bg-[#181818] border border-[#383838] rounded-lg pl-9 pr-4 py-3 text-[#E7E7E7] outline-none focus:border-[#86efac] disabled:opacity-50"
                  />
                </div>

                <p className="text-xs text-[#A3A3A3] mt-2">
                  Maximum available:{" "}
                  {formatCurrency(eligibility?.availableEligibility)}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <label
                    htmlFor="loanReason"
                    className="block text-sm font-medium"
                  >
                    Reason for requesting the loan
                  </label>

                  <span className="text-xs text-[#A3A3A3]">
                    {reason.length}/500
                  </span>
                </div>

                <textarea
                  id="loanReason"
                  rows={4}
                  maxLength={500}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Explain why you need the loan and how it will help you..."
                  disabled={submitting || hasPendingRequest}
                  className="w-full bg-[#181818] border border-[#383838] rounded-lg px-4 py-3 text-[#E7E7E7] outline-none focus:border-[#86efac] resize-y disabled:opacity-50"
                />
              </div>

              <div className="bg-[#181818] border border-[#383838] rounded-lg p-4 flex gap-3">
                <Info
                  size={19}
                  className="text-[#86efac] shrink-0 mt-0.5"
                />

                <div className="text-sm text-[#A3A3A3]">
                  <p className="text-[#E7E7E7] font-medium mb-1">
                    Important loan conditions
                  </p>

                  <ul className="list-disc pl-5 space-y-1">
                    <li>Loan eligibility is currently limited to 50% of accrued net milk earnings.</li>
                    <li>All loans have a 0% interest rate.</li>
                    <li>Your request must be reviewed by the dairy owner.</li>
                    <li>An approved loan is not considered borrowed until the owner confirms disbursement.</li>
                    <li>Repayments are deducted from your milk earnings during monthly settlement.</li>
                  </ul>
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  submitting ||
                  hasPendingRequest ||
                  !eligibility ||
                  Number(eligibility.availableEligibility) <= 0
                }
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#86efac] text-[#181818] font-semibold hover:bg-[#a7f3c2] transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={17} className="animate-spin" />
                    Submitting request...
                  </>
                ) : (
                  <>
                    <Send size={17} />
                    Submit Loan Request
                  </>
                )}
              </button>

              {!hasPendingRequest &&
                eligibility &&
                Number(eligibility.availableEligibility) <= 0 && (
                  <p className="text-sm text-orange-300">
                    You currently have no available loan eligibility. Your
                    eligibility may change as additional milk earnings are recorded
                    or existing commitments are reduced.
                  </p>
                )}
            </form>
          </div>

          {/* APPLICATION HISTORY */}
          <div className="bg-[#222222] border border-[#383838] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#383838]">
              <div className="flex items-center gap-3">
                <CalendarDays size={21} className="text-[#86efac]" />

                <div>
                  <h2 className="text-lg font-semibold">
                    My Loan Applications
                  </h2>

                  <p className="text-sm text-[#A3A3A3] mt-1">
                    Track the progress of all your loan requests.
                  </p>
                </div>
              </div>
            </div>

            {loans.length === 0 ? (
              <div className="p-10 text-center">
                <HandCoins
                  size={35}
                  className="text-[#666666] mx-auto mb-3"
                />

                <p className="font-medium">
                  No loan applications yet
                </p>

                <p className="text-sm text-[#A3A3A3] mt-1">
                  Your submitted loan requests will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#383838]">
                {loans.map((loan) => {
                  const status =
                    statusConfig[loan.status] || statusConfig.pending;

                  const StatusIcon = status.icon;

                  const repayments = Array.isArray(loan.repayments)
                    ? loan.repayments
                    : [];

                  const repaidAmount = repayments.reduce(
                    (total, repayment) =>
                      total + Number(repayment.amount || 0),
                    0
                  );

                  const isDisbursed =
                    loan.status === "disbursed" ||
                    loan.status === "repaid";

                  return (
                    <div key={loan._id} className="p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <HandCoins
                              size={18}
                              className="text-[#86efac]"
                            />
                            <h3 className="font-semibold">
                              Loan Application
                            </h3>
                          </div>

                          <p className="text-xs text-[#A3A3A3]">
                            Submitted {formatDate(loan.createdAt)}
                          </p>
                        </div>

                        <StatusBadge status={loan.status} />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-[#A3A3A3]">
                            Requested amount
                          </p>
                          <p className="font-semibold mt-1">
                            {formatCurrency(loan.requestedAmount)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-[#A3A3A3]">
                            Approved amount
                          </p>
                          <p className="font-semibold mt-1">
                            {loan.approvedAmount != null
                              ? formatCurrency(loan.approvedAmount)
                              : "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-[#A3A3A3]">
                            Amount disbursed
                          </p>
                          <p className="font-semibold mt-1">
                            {isDisbursed
                              ? formatCurrency(loan.disbursedAmount)
                              : "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-[#A3A3A3]">
                            Outstanding balance
                          </p>
                          <p className="font-semibold text-[#86efac] mt-1">
                            {isDisbursed
                              ? formatCurrency(loan.outstandingBalance)
                              : "-"}
                          </p>
                        </div>
                      </div>

                      <div className="bg-[#181818] rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <StatusIcon
                            size={19}
                            className="text-[#86efac] shrink-0 mt-0.5"
                          />

                          <div>
                            <p className="text-sm font-medium">
                              {status.label}
                            </p>

                            <p className="text-sm text-[#A3A3A3] mt-1">
                              {status.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-[#A3A3A3] mb-1">
                          Reason for request
                        </p>
                        <p className="text-sm">
                          {loan.reason || "-"}
                        </p>
                      </div>

                      {loan.ownerNotes && (
                        <div className="border-l-2 border-[#86efac] pl-3">
                          <p className="text-xs text-[#A3A3A3] mb-1">
                            Owner's feedback
                          </p>
                          <p className="text-sm">
                            {loan.ownerNotes}
                          </p>
                        </div>
                      )}

                      {loan.reviewedAt && (
                        <p className="text-xs text-[#A3A3A3]">
                          Reviewed on {formatDate(loan.reviewedAt)}
                        </p>
                      )}

                      {loan.disbursedAt && (
                        <p className="text-xs text-[#A3A3A3]">
                          Disbursed on {formatDate(loan.disbursedAt)}
                        </p>
                      )}

                      {isDisbursed && (
                        <div className="border-t border-[#383838] pt-4 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-medium">
                              Repayment progress
                            </p>

                            <p className="text-sm text-[#A3A3A3]">
                              {formatCurrency(repaidAmount)} repaid
                            </p>
                          </div>

                          <div className="h-2 bg-[#383838] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#86efac] rounded-full transition-all"
                              style={{
                                width: `${
                                  Number(loan.disbursedAmount) > 0
                                    ? Math.min(
                                        100,
                                        (repaidAmount /
                                          Number(loan.disbursedAmount)) *
                                          100
                                      )
                                    : 0
                                }%`,
                              }}
                            />
                          </div>

                          <div className="flex justify-between text-xs text-[#A3A3A3]">
                            <span>
                              {formatCurrency(repaidAmount)} repaid
                            </span>
                            <span>
                              {formatCurrency(loan.disbursedAmount)} total
                            </span>
                          </div>

                          {repayments.length > 0 && (
                            <div className="pt-2">
                              <p className="text-sm font-medium mb-3">
                                Repayment transactions
                              </p>

                              <div className="space-y-2">
                                {[...repayments]
                                  .sort(
                                    (a, b) =>
                                      new Date(b.paidAt || 0) -
                                      new Date(a.paidAt || 0)
                                  )
                                  .map((repayment, index) => (
                                    <div
                                      key={`${loan._id}-${index}`}
                                      className="flex items-center justify-between gap-3 text-sm bg-[#181818] rounded-lg p-3"
                                    >
                                      <div>
                                        <p className="font-medium">
                                          {formatMonth(repayment.month)}
                                        </p>
                                        <p className="text-xs text-[#A3A3A3] mt-1">
                                          {formatDate(repayment.paidAt)}
                                        </p>
                                      </div>

                                      <p className="font-semibold text-[#86efac]">
                                        {formatCurrency(repayment.amount)}
                                      </p>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default LoanApplication;
