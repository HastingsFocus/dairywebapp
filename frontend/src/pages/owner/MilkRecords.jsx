
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Milk,
  Droplets,
  CalendarDays,
  ClipboardList,
  Users,
  Thermometer,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  FlaskConical,
  TrendingUp,
  Search,
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

  return new Date(`${String(date).slice(0, 10)}T12:00:00`).toLocaleDateString(
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

const getErrorMessage = (error) =>
  error.response?.data?.message ||
  error.message ||
  "Something went wrong. Please try again.";

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

const MilkRecords = () => {
  const today = getMalawiDate();

  const [selectedMonth, setSelectedMonth] = useState(today.slice(0, 7));
  const [selectedDate, setSelectedDate] = useState("");
  const [records, setRecords] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const filters = selectedDate
        ? { date: selectedDate }
        : { month: selectedMonth };

      const response = await milkRecordService.getMilkRecords(filters);

      setRecords(response.records || []);
    } catch (err) {
      setError(getErrorMessage(err));
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedDate]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Overall statistics based on the records returned by the API.
  const summary = useMemo(() => {
    const totalLitres = records.reduce(
      (total, record) =>
        total + Number(record.quantityLitres || 0),
      0
    );

    const farmers = new Set(
      records.map((record) => record.farmer?._id).filter(Boolean)
    );

    const buyers = new Set(
      records.map((record) => record.buyer?._id).filter(Boolean)
    );

    const collectionDays = new Set(
      records.map((record) => record.recordDate?.slice(0, 10))
    );

    const todayTotal = records
      .filter(
        (record) =>
          record.recordDate?.slice(0, 10) === today
      )
      .reduce(
        (total, record) =>
          total + Number(record.quantityLitres || 0),
        0
      );

    return {
      totalLitres,
      farmerCount: farmers.size,
      buyerCount: buyers.size,
      collectionDays: collectionDays.size,
      totalRecords: records.length,
      todayTotal,
    };
  }, [records, today]);

  // Search records by farmer, buyer or email.
  const filteredRecords = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) return records;

    return records.filter((record) => {
      const farmerName = record.farmer?.fullName || "";
      const farmerEmail = record.farmer?.email || "";
      const buyerName = record.buyer?.fullName || "";
      const buyerEmail = record.buyer?.email || "";

      return (
        farmerName.toLowerCase().includes(search) ||
        farmerEmail.toLowerCase().includes(search) ||
        buyerName.toLowerCase().includes(search) ||
        buyerEmail.toLowerCase().includes(search)
      );
    });
  }, [records, searchTerm]);

  // Daily collection totals.
  const dailyTotals = useMemo(() => {
    const grouped = {};

    records.forEach((record) => {
      const date = record.recordDate?.slice(0, 10);

      if (!date) return;

      if (!grouped[date]) {
        grouped[date] = {
          date,
          totalLitres: 0,
          records: 0,
          farmers: new Set(),
        };
      }

      grouped[date].totalLitres += Number(
        record.quantityLitres || 0
      );

      grouped[date].records += 1;

      if (record.farmer?._id) {
        grouped[date].farmers.add(record.farmer._id);
      }
    });

    return Object.values(grouped)
      .map((day) => ({
        ...day,
        farmers: day.farmers.size,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [records]);

  const clearDateFilter = () => {
    setSelectedDate("");
  };

  return (
    <div className="min-h-full space-y-6 bg-[#181818] p-4 text-[#E7E7E7] sm:p-6 lg:p-8">

      {/* Heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl border border-[#3B5140] bg-[#26392B] p-2.5">
              <Milk size={23} className="text-[#86efac]" />
            </div>

            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Milk Records
            </h1>
          </div>

          <p className="mt-2 text-sm text-[#A3A3A3]">
            Monitor milk production, farmer collections and quality results across your dairy operation.
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

      {/* Error */}
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

      {/* Filters */}
      <section className="rounded-2xl border border-[#383838] bg-[#222222] p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="font-semibold">Collection Filters</h2>

            <p className="mt-1 text-sm text-[#A3A3A3]">
              Review milk collection records by month or a specific date.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div>
              <label
                htmlFor="recordMonth"
                className="text-xs font-medium text-[#A3A3A3]"
              >
                Select month
              </label>

              <input
                id="recordMonth"
                type="month"
                value={selectedMonth}
                max={today.slice(0, 7)}
                disabled={Boolean(selectedDate)}
                onChange={(event) =>
                  setSelectedMonth(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-[#383838] bg-[#181818] px-4 py-3 text-sm text-[#E7E7E7] outline-none focus:border-[#86efac] disabled:opacity-40 sm:w-auto"
              />
            </div>

            <div>
              <label
                htmlFor="recordDate"
                className="text-xs font-medium text-[#A3A3A3]"
              >
                Specific date
              </label>

              <input
                id="recordDate"
                type="date"
                max={today}
                value={selectedDate}
                onChange={(event) =>
                  setSelectedDate(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-[#383838] bg-[#181818] px-4 py-3 text-sm text-[#E7E7E7] outline-none focus:border-[#86efac] sm:w-auto"
              />
            </div>

            {selectedDate && (
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={clearDateFilter}
                  className="w-full rounded-xl border border-[#383838] px-4 py-3 text-sm text-[#D4D4D4] transition hover:bg-[#303030] sm:w-auto"
                >
                  Clear date
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Milk Collection"
          value={`${formatLitres(summary.totalLitres)} L`}
          subtitle={
            selectedDate
              ? formatDate(selectedDate)
              : getMonthLabel(selectedMonth)
          }
          icon={Droplets}
        />

        <StatCard
          title="Today's Collection"
          value={`${formatLitres(summary.todayTotal)} L`}
          subtitle={formatDate(today)}
          icon={Milk}
        />

        <StatCard
          title="Farmers Recorded"
          value={summary.farmerCount}
          subtitle="Unique farmers in this selection"
          icon={Users}
        />

        <StatCard
          title="Total Entries"
          value={summary.totalRecords}
          subtitle={`${summary.collectionDays} collection days`}
          icon={ClipboardList}
        />
      </div>

      {/* Daily collection overview */}
      <section className="overflow-hidden rounded-2xl border border-[#383838] bg-[#222222]">
        <div className="border-b border-[#383838] p-5">
          <div className="flex items-center gap-2">
            <TrendingUp size={19} className="text-[#86efac]" />

            <h2 className="text-lg font-semibold">
              Daily Collection Overview
            </h2>
          </div>

          <p className="mt-1 text-sm text-[#A3A3A3]">
            Total milk collected across all recorded farmers for each day.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw
              size={24}
              className="animate-spin text-[#86efac]"
            />
          </div>
        ) : dailyTotals.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-[#A3A3A3]">
            No daily collection data available for this selection.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left">
              <thead>
                <tr className="border-b border-[#383838] bg-[#1e1e1e]">
                  {["Date", "Total Milk", "Farmers", "Entries"].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[#A3A3A3]"
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#383838]">
                {dailyTotals.map((day) => (
                  <tr
                    key={day.date}
                    className="transition hover:bg-[#282828]"
                  >
                    <td className="px-5 py-4 font-medium">
                      {formatDate(day.date)}
                    </td>

                    <td className="px-5 py-4 font-semibold text-[#86efac]">
                      {formatLitres(day.totalLitres)} L
                    </td>

                    <td className="px-5 py-4 text-sm">
                      {day.farmers}
                    </td>

                    <td className="px-5 py-4 text-sm">
                      {day.records}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* All farmer records */}
      <section className="overflow-hidden rounded-2xl border border-[#383838] bg-[#222222]">
        <div className="flex flex-col gap-4 border-b border-[#383838] p-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              All Milk Collection Records
            </h2>

            <p className="mt-1 text-sm text-[#A3A3A3]">
              Detailed collection entries from your farmers.
            </p>
          </div>

          <div className="relative w-full xl:max-w-sm">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777]"
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search farmer or buyer..."
              className="w-full rounded-xl border border-[#383838] bg-[#181818] py-3 pl-10 pr-4 text-sm text-[#E7E7E7] outline-none placeholder:text-[#777] focus:border-[#86efac]"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16">
            <RefreshCw
              size={25}
              className="animate-spin text-[#86efac]"
            />

            <p className="text-sm text-[#A3A3A3]">
              Loading collection records...
            </p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="rounded-2xl border border-[#383838] bg-[#181818] p-4">
              <FlaskConical size={30} className="text-[#86efac]" />
            </div>

            <h3 className="mt-4 font-semibold">
              No collection records found
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-[#A3A3A3]">
              {searchTerm
                ? "No records match your search. Try another farmer or buyer name."
                : "There are no milk collection entries for the selected period."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#383838] bg-[#1e1e1e]">
                  {[
                    "Collection Date",
                    "Farmer",
                    "Buyer",
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
                {filteredRecords
                  .slice()
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
                      <td className="px-5 py-4 text-sm">
                        {formatDate(record.recordDate)}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium">
                          {record.farmer?.fullName || "Unknown farmer"}
                        </p>

                        <p className="mt-1 text-xs text-[#A3A3A3]">
                          {record.farmer?.email || "—"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-medium">
                          {record.buyer?.fullName || "—"}
                        </p>

                        <p className="mt-1 text-xs text-[#A3A3A3]">
                          {record.buyer?.email || ""}
                        </p>
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

        {!loading && filteredRecords.length > 0 && (
          <div className="border-t border-[#383838] px-5 py-4">
            <p className="text-xs text-[#A3A3A3]">
              Showing {filteredRecords.length} of {records.length} records
            </p>
          </div>
        )}
      </section>

      <p className="text-xs leading-5 text-[#777]">
        This page provides a read-only overview of milk collection records.
        Quality-test results are recorded observations and should be
        interpreted using the applicable dairy testing standards.
      </p>
    </div>
  );
};

export default MilkRecords;
