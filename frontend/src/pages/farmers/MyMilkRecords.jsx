
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Milk,
  Droplets,
  Thermometer,
  CalendarDays,
  ClipboardList,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  FlaskConical,
} from "lucide-react";

import milkRecordService from "../../services/milkRecordService";

const getMalawiDate = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Blantyre",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
};

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(`${date.slice(0, 10)}T12:00:00`).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const formatLitres = (value) =>
  Number(value || 0).toLocaleString("en-GB", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const getErrorMessage = (error) =>
  error.response?.data?.message ||
  error.message ||
  "Something went wrong. Please try again.";

const getMonthLabel = (month) => {
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

const StatCard = ({ title, value, subtitle, icon: Icon }) => (
  <div className="rounded-2xl border border-[#383838] bg-[#222222] p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-[#A3A3A3]">{title}</p>

        <p className="mt-3 text-2xl font-semibold tracking-tight text-[#E7E7E7]">
          {value}
        </p>

        <p className="mt-2 text-xs text-[#A3A3A3]">{subtitle}</p>
      </div>

      <div className="rounded-xl border border-[#3B5140] bg-[#26392B] p-3">
        <Icon size={21} className="text-[#86efac]" />
      </div>
    </div>
  </div>
);

const QualityBadge = ({ value, positiveLabel, negativeLabel }) => {
  const positive = value === "pass" || value === "no";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        positive
          ? "bg-[#26392B] text-[#86efac]"
          : "bg-[#422626] text-[#fca5a5]"
      }`}
    >
      {positive ? <CheckCircle2 size={13} /> : <XCircle size={13} />}

      {positive ? positiveLabel : negativeLabel}
    </span>
  );
};

const MyMilkRecords = () => {
  const today = getMalawiDate();

  const [selectedMonth, setSelectedMonth] = useState(today.slice(0, 7));
  const [records, setRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await milkRecordService.getMilkRecords({
        month: selectedMonth,
      });

      setRecords(response.records || []);
    } catch (err) {
      setError(getErrorMessage(err));
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Calculate monthly statistics from the records returned by the API.
  const summary = useMemo(() => {
    const totalLitres = records.reduce(
      (total, record) =>
        total + Number(record.quantityLitres || 0),
      0
    );

    const recordedDays = new Set(
      records.map((record) => record.recordDate?.slice(0, 10))
    ).size;

    const averagePerDay =
      recordedDays > 0 ? totalLitres / recordedDays : 0;

    return {
      totalLitres,
      recordedDays,
      averagePerDay,
      totalRecords: records.length,
    };
  }, [records]);

  const latestRecord = useMemo(() => {
    if (records.length === 0) return null;

    return [...records].sort((a, b) =>
      String(b.recordDate).localeCompare(String(a.recordDate))
    )[0];
  }, [records]);

  const currentMonth = today.slice(0, 7);

  return (
    <div className="min-h-full space-y-6 bg-[#181818] p-4 text-[#E7E7E7] sm:p-6 lg:p-8">

      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl border border-[#3B5140] bg-[#26392B] p-2.5">
              <Milk size={23} className="text-[#86efac]" />
            </div>

            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              My Milk Records
            </h1>
          </div>

          <p className="mt-2 text-sm text-[#A3A3A3]">
            View your milk collection history, quantities and quality-test results.
          </p>
        </div>

        <button
          type="button"
          onClick={loadRecords}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#383838] bg-[#222222] px-4 py-3 text-sm font-medium transition hover:bg-[#2c2c2c] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-900/70 bg-red-950/30 p-4 text-sm text-red-300"
        >
          <AlertCircle size={19} className="mt-0.5 shrink-0" />

          <p className="flex-1">{error}</p>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* Month filter */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#383838] bg-[#222222] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[#2d2d2d] p-3">
            <CalendarDays size={21} className="text-[#86efac]" />
          </div>

          <div>
            <h2 className="font-medium">Collection period</h2>

            <p className="mt-1 text-xs text-[#A3A3A3]">
              Select a month to view your collection history.
            </p>
          </div>
        </div>

        <input
          type="month"
          value={selectedMonth}
          max={currentMonth}
          onChange={(event) => setSelectedMonth(event.target.value)}
          className="w-full rounded-xl border border-[#383838] bg-[#181818] px-4 py-3 text-sm text-[#E7E7E7] outline-none focus:border-[#86efac] sm:w-auto"
          aria-label="Select collection month"
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Milk Collected"
          value={`${formatLitres(summary.totalLitres)} L`}
          subtitle={getMonthLabel(selectedMonth)}
          icon={Droplets}
        />

        <StatCard
          title="Collection Days"
          value={summary.recordedDays}
          subtitle="Days with recorded milk collections"
          icon={CalendarDays}
        />

        <StatCard
          title="Average Daily Collection"
          value={`${formatLitres(summary.averagePerDay)} L`}
          subtitle="Average per recorded day"
          icon={ClipboardList}
        />

        <StatCard
          title="Latest Collection"
          value={
            latestRecord
              ? `${formatLitres(latestRecord.quantityLitres)} L`
              : "0 L"
          }
          subtitle={
            latestRecord
              ? formatDate(latestRecord.recordDate)
              : "No collection recorded"
          }
          icon={Milk}
        />
      </div>

      {/* Collection records */}
      <section className="overflow-hidden rounded-2xl border border-[#383838] bg-[#222222]">
        <div className="flex flex-col gap-3 border-b border-[#383838] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              My Collection History
            </h2>

            <p className="mt-1 text-sm text-[#A3A3A3]">
              {getMonthLabel(selectedMonth)} · {records.length}{" "}
              {records.length === 1 ? "record" : "records"}
            </p>
          </div>

          <div className="rounded-xl border border-[#383838] bg-[#181818] px-4 py-2.5">
            <p className="text-xs text-[#A3A3A3]">
              Monthly collection
            </p>

            <p className="mt-1 text-lg font-semibold text-[#86efac]">
              {formatLitres(summary.totalLitres)} L
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16">
            <RefreshCw
              size={25}
              className="animate-spin text-[#86efac]"
            />

            <p className="text-sm text-[#A3A3A3]">
              Loading your milk records...
            </p>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="rounded-2xl border border-[#383838] bg-[#181818] p-4">
              <FlaskConical size={30} className="text-[#86efac]" />
            </div>

            <h3 className="mt-4 font-semibold">
              No milk records found
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-[#A3A3A3]">
              You do not have any recorded milk collections for{" "}
              {getMonthLabel(selectedMonth)}. Your records will appear
              here once your buyer enters your milk collection details.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#383838] bg-[#1e1e1e]">
                  {[
                    "Collection Date",
                    "Quantity",
                    "Soda Test",
                    "Temperature",
                    "Sour Test",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[#A3A3A3]"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#383838]">
                {[...records]
                  .sort((a, b) =>
                    String(b.recordDate).localeCompare(
                      String(a.recordDate)
                    )
                  )
                  .map((record) => (
                    <tr
                      key={record._id}
                      className="transition hover:bg-[#282828]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-[#26392B] p-2">
                            <CalendarDays
                              size={17}
                              className="text-[#86efac]"
                            />
                          </div>

                          <span className="font-medium">
                            {formatDate(record.recordDate)}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-semibold text-[#86efac]">
                          {formatLitres(record.quantityLitres)} L
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <QualityBadge
                          value={record.sodaTest}
                          positiveLabel="Pass"
                          negativeLabel="Fail"
                        />
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2 text-sm">
                          <Thermometer
                            size={15}
                            className="text-[#A3A3A3]"
                          />

                          {record.temperatureC} °C
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <QualityBadge
                          value={record.sourTest}
                          positiveLabel="Not sour"
                          negativeLabel="Sour"
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Notes */}
      {records.some((record) => record.notes?.trim()) && (
        <section className="rounded-2xl border border-[#383838] bg-[#222222] p-5">
          <div className="flex items-center gap-2">
            <ClipboardList size={19} className="text-[#86efac]" />

            <h2 className="font-semibold">Collection Notes</h2>
          </div>

          <div className="mt-4 space-y-3">
            {records
              .filter((record) => record.notes?.trim())
              .sort((a, b) =>
                String(b.recordDate).localeCompare(
                  String(a.recordDate)
                )
              )
              .map((record) => (
                <div
                  key={record._id}
                  className="rounded-xl border border-[#383838] bg-[#181818] p-4"
                >
                  <p className="text-xs font-medium text-[#86efac]">
                    {formatDate(record.recordDate)}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[#D4D4D4]">
                    {record.notes}
                  </p>
                </div>
              ))}
          </div>
        </section>
      )}

      <p className="text-xs leading-5 text-[#777]">
        These records show milk collections entered by your buyer.
        Contact your buyer if you notice an incorrect entry. Quality-test
        results are recorded observations and should be interpreted using
        the applicable dairy testing standards.
      </p>
    </div>
  );
};

export default MyMilkRecords;
