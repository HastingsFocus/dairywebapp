
import { useCallback, useEffect, useState } from "react";
import {
  Milk,
  Plus,
  CalendarDays,
  Droplets,
  Thermometer,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  Save,
  ClipboardList,
  AlertCircle,
  FlaskConical,
} from "lucide-react";

import milkRecordService from "../../services/milkRecordService";
import userService from "../../services/userService";

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

  return new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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

const emptyForm = {
  farmerId: "",
  quantityLitres: "",
  sodaTest: "pass",
  temperatureC: "",
  sourTest: "no",
  notes: "",
};

const inputClass =
  "mt-2 w-full rounded-xl border border-[#383838] bg-[#181818] px-4 py-3 text-sm text-[#E7E7E7] outline-none transition placeholder:text-[#777] focus:border-[#86efac] focus:ring-1 focus:ring-[#86efac]";

const labelClass = "text-sm font-medium text-[#D4D4D4]";

const MilkRecords = () => {
  const [selectedDate, setSelectedDate] = useState(getMalawiDate());
  const [farmers, setFarmers] = useState([]);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const currentMonth = getMalawiDate().slice(0, 7);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [farmerResponse, recordResponse, summaryResponse] =
        await Promise.all([
          userService.getFarmers(),
          milkRecordService.getMilkRecords({ date: selectedDate }),
          milkRecordService.getMilkSummary(selectedDate),
        ]);

      setFarmers(farmerResponse.farmers || []);
      setRecords(recordResponse.records || []);
      setSummary(summaryResponse);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormOpen(false);
  };

  const openCreateForm = () => {
    setError("");
    setSuccess("");
    setEditingId(null);
    setForm({
      ...emptyForm,
      farmerId: farmers[0]?._id || "",
    });
    setFormOpen(true);
  };

  const openEditForm = (record) => {
    setError("");
    setSuccess("");
    setEditingId(record._id);
    setForm({
      farmerId: record.farmer?._id || "",
      quantityLitres: String(record.quantityLitres ?? ""),
      sodaTest: record.sodaTest || "pass",
      temperatureC: String(record.temperatureC ?? ""),
      sourTest: record.sourTest || "no",
      notes: record.notes || "",
    });
    setFormOpen(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!editingId && !form.farmerId) {
      setError("Please select a farmer before recording milk.");
      return;
    }

    const quantity = Number(form.quantityLitres);
    const temperature = Number(form.temperatureC);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Milk quantity must be greater than zero.");
      return;
    }

    if (
      form.temperatureC === "" ||
      !Number.isFinite(temperature) ||
      temperature < -100 ||
      temperature > 200
    ) {
      setError("Please enter a valid milk temperature in °C.");
      return;
    }

    const recordData = {
      quantityLitres: quantity,
      sodaTest: form.sodaTest,
      temperatureC: temperature,
      sourTest: form.sourTest,
      notes: form.notes.trim(),
    };

    setSaving(true);

    try {
      if (editingId) {
        await milkRecordService.updateMilkRecord(
          editingId,
          recordData
        );
        setSuccess("Milk record updated successfully.");
      } else {
        await milkRecordService.createMilkRecord({
          ...recordData,
          farmerId: form.farmerId,
          recordDate: selectedDate,
        });
        setSuccess("Milk record saved successfully.");
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    const farmerName = record.farmer?.fullName || "this farmer";

    const confirmed = window.confirm(
      `Delete the milk record for ${farmerName} on ${formatDate(
        record.recordDate
      )}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingId(record._id);

    try {
      await milkRecordService.deleteMilkRecord(record._id);
      setSuccess("Milk record deleted successfully.");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  const recordedFarmerIds = new Set(
    records.map((record) => record.farmer?._id).filter(Boolean)
  );

  const availableFarmers = farmers.filter(
    (farmer) => !recordedFarmerIds.has(farmer._id)
  );

  const editableRecord = (record) =>
    record.recordDate?.startsWith(`${currentMonth}-`);

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

  return (
    <div className="min-h-full space-y-6 bg-[#181818] p-4 text-[#E7E7E7] sm:p-6 lg:p-8">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl border border-[#3B5140] bg-[#26392B] p-2.5">
              <Milk className="text-[#86efac]" size={23} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Milk Records
            </h1>
          </div>

          <p className="mt-2 text-sm text-[#A3A3A3]">
            Record daily milk collection and monitor production totals.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#383838] bg-[#222222] px-4 py-3 text-sm font-medium transition hover:bg-[#2c2c2c] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={openCreateForm}
            disabled={farmers.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#86efac] px-4 py-3 text-sm font-semibold text-[#17251a] transition hover:bg-[#a7f3bd] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={18} />
            Record Milk
          </button>
        </div>
      </div>

      {/* Feedback */}
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
            <X size={17} />
          </button>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-green-900/70 bg-green-950/30 p-4 text-sm text-[#86efac]"
        >
          <CheckCircle2 size={18} />
          <p className="flex-1">{success}</p>
          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss success message"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* Date filter */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#383838] bg-[#222222] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[#2d2d2d] p-3">
            <CalendarDays size={21} className="text-[#86efac]" />
          </div>
          <div>
            <h2 className="font-medium">Collection date</h2>
            <p className="mt-1 text-xs text-[#A3A3A3]">
              Choose a date to view its milk records and totals.
            </p>
          </div>
        </div>

        <input
          type="date"
          value={selectedDate}
          max={getMalawiDate()}
          onChange={(event) => {
            setSelectedDate(event.target.value);
            setSuccess("");
            setError("");
            resetForm();
          }}
          className="w-full rounded-xl border border-[#383838] bg-[#181818] px-4 py-3 text-sm text-[#E7E7E7] outline-none focus:border-[#86efac] sm:w-auto"
          aria-label="Select collection date"
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Daily Milk Collection"
          value={`${formatLitres(summary?.dailyTotalLitres)} L`}
          subtitle={formatDate(selectedDate)}
          icon={Droplets}
        />

        <StatCard
          title="Month-to-Date Collection"
          value={`${formatLitres(summary?.monthToDateTotalLitres)} L`}
          subtitle={`1st to ${formatDate(selectedDate)}`}
          icon={Milk}
        />

        <StatCard
          title="Farmers"
          value={summary?.farmerCount ?? farmers.length}
          subtitle="Farmers in your accessible records"
          icon={ClipboardList}
        />

        <StatCard
          title="Farmers Recorded"
          value={summary?.farmersWithRecords ?? records.length}
          subtitle="Farmers with a record on this date"
          icon={CheckCircle2}
        />
      </div>

      {/* Milk entry form */}
      {formOpen && (
        <section className="overflow-hidden rounded-2xl border border-[#3B5140] bg-[#222222]">
          <div className="flex items-center justify-between gap-3 border-b border-[#383838] p-5">
            <div>
              <h2 className="text-lg font-semibold">
                {editingId ? "Edit Milk Record" : "New Milk Collection"}
              </h2>
              <p className="mt-1 text-sm text-[#A3A3A3]">
                {editingId
                  ? "Update the existing collection details."
                  : `Recording milk for ${formatDate(selectedDate)}.`}
              </p>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg p-2 text-[#A3A3A3] transition hover:bg-[#303030] hover:text-white"
              aria-label="Close form"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 p-5">
            {!editingId && (
              <div>
                <label className={labelClass} htmlFor="farmerId">
                  Select Farmer *
                </label>

                <select
                  id="farmerId"
                  name="farmerId"
                  value={form.farmerId}
                  onChange={handleChange}
                  required
                  className={inputClass}
                >
                  <option value="">Choose a farmer</option>
                  {availableFarmers.map((farmer) => (
                    <option key={farmer._id} value={farmer._id}>
                      {farmer.fullName} — {farmer.email}
                    </option>
                  ))}
                </select>

                {availableFarmers.length === 0 && (
                  <p className="mt-2 text-xs text-amber-300">
                    All your farmers already have records for this date,
                    or no farmers are available.
                  </p>
                )}
              </div>
            )}

            {editingId && (
              <div className="rounded-xl border border-[#383838] bg-[#181818] p-4">
                <p className="text-xs text-[#A3A3A3]">Farmer</p>
                <p className="mt-1 font-medium">
                  {records.find((record) => record._id === editingId)
                    ?.farmer?.fullName || "Selected farmer"}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="quantityLitres">
                  Milk Quantity (Litres) *
                </label>

                <div className="relative">
                  <Droplets
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86efac]"
                  />
                  <input
                    id="quantityLitres"
                    name="quantityLitres"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.quantityLitres}
                    onChange={handleChange}
                    placeholder="e.g. 25.5"
                    required
                    className={`${inputClass} pl-10 pr-14`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#A3A3A3]">
                    Litres
                  </span>
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="temperatureC">
                  Milk Temperature (°C) *
                </label>

                <div className="relative">
                  <Thermometer
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86efac]"
                  />
                  <input
                    id="temperatureC"
                    name="temperatureC"
                    type="number"
                    step="0.1"
                    min="-100"
                    max="200"
                    value={form.temperatureC}
                    onChange={handleChange}
                    placeholder="e.g. 34.5"
                    required
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="sodaTest">
                  Soda Test *
                </label>

                <select
                  id="sodaTest"
                  name="sodaTest"
                  value={form.sodaTest}
                  onChange={handleChange}
                  required
                  className={inputClass}
                >
                  <option value="pass">Pass</option>
                  <option value="fail">Fail</option>
                </select>
              </div>

              <div>
                <label className={labelClass} htmlFor="sourTest">
                  Sour Test *
                </label>

                <select
                  id="sourTest"
                  name="sourTest"
                  value={form.sourTest}
                  onChange={handleChange}
                  required
                  className={inputClass}
                >
                  <option value="no">No — Not sour</option>
                  <option value="yes">Yes — Sour</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="notes">
                Notes <span className="font-normal text-[#A3A3A3]">(Optional)</span>
              </label>

              <textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                maxLength={500}
                placeholder="Add any observations about this collection..."
                className={inputClass}
              />

              <p className="mt-1 text-right text-xs text-[#777]">
                {form.notes.length}/500
              </p>
            </div>

            <div className="flex flex-col-reverse justify-end gap-3 border-t border-[#383838] pt-5 sm:flex-row">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-[#383838] px-5 py-3 text-sm font-medium transition hover:bg-[#303030]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving || (!editingId && availableFarmers.length === 0)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#86efac] px-5 py-3 text-sm font-semibold text-[#17251a] transition hover:bg-[#a7f3bd] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw size={17} className="animate-spin" />
                ) : editingId ? (
                  <Save size={17} />
                ) : (
                  <Plus size={18} />
                )}

                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save Changes"
                    : "Save Milk Record"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Records table */}
      <section className="overflow-hidden rounded-2xl border border-[#383838] bg-[#222222]">
        <div className="flex flex-col gap-3 border-b border-[#383838] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Daily Collection Records</h2>
            <p className="mt-1 text-sm text-[#A3A3A3]">
              {formatDate(selectedDate)} · {records.length}{" "}
              {records.length === 1 ? "record" : "records"}
            </p>
          </div>

          <div className="rounded-xl border border-[#383838] bg-[#181818] px-4 py-2.5">
            <p className="text-xs text-[#A3A3A3]">Total collected</p>
            <p className="mt-1 text-lg font-semibold text-[#86efac]">
              {formatLitres(
                records.reduce(
                  (total, record) =>
                    total + Number(record.quantityLitres || 0),
                  0
                )
              )}{" "}
              L
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16">
            <RefreshCw size={25} className="animate-spin text-[#86efac]" />
            <p className="text-sm text-[#A3A3A3]">
              Loading milk records...
            </p>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="rounded-2xl border border-[#383838] bg-[#181818] p-4">
              <FlaskConical size={30} className="text-[#86efac]" />
            </div>

            <h3 className="mt-4 font-semibold">No milk records yet</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-[#A3A3A3]">
              There are no milk collection entries for this date. Select
              another date or record a new collection.
            </p>

            <button
              type="button"
              onClick={openCreateForm}
              disabled={farmers.length === 0}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#86efac] px-4 py-3 text-sm font-semibold text-[#17251a] transition hover:bg-[#a7f3bd] disabled:opacity-50"
            >
              <Plus size={17} />
              Record First Collection
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#383838] bg-[#1e1e1e]">
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[#A3A3A3]">
                    Farmer
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[#A3A3A3]">
                    Quantity
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[#A3A3A3]">
                    Soda Test
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[#A3A3A3]">
                    Temperature
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[#A3A3A3]">
                    Sour Test
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[#A3A3A3]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#383838]">
                {records.map((record) => (
                  <tr
                    key={record._id}
                    className="transition hover:bg-[#282828]"
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium">
                        {record.farmer?.fullName || "Unknown farmer"}
                      </p>
                      <p className="mt-1 text-xs text-[#A3A3A3]">
                        {record.farmer?.email || "—"}
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
                        <Thermometer size={15} className="text-[#A3A3A3]" />
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

                    <td className="px-5 py-4">
                      {editableRecord(record) ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(record)}
                            title="Edit record"
                            aria-label={`Edit record for ${record.farmer?.fullName || "farmer"}`}
                            className="rounded-lg border border-[#383838] p-2.5 text-[#D4D4D4] transition hover:border-[#86efac] hover:text-[#86efac]"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(record)}
                            disabled={deletingId === record._id}
                            title="Delete record"
                            aria-label={`Delete record for ${record.farmer?.fullName || "farmer"}`}
                            className="rounded-lg border border-[#383838] p-2.5 text-[#fca5a5] transition hover:border-red-500 hover:bg-red-950/30 disabled:opacity-50"
                          >
                            {deletingId === record._id ? (
                              <RefreshCw size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-[#777]">
                          Read only
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Footer note */}
      <p className="text-xs leading-5 text-[#777]">
        Milk totals are calculated from saved records. Quality-test results
        are recorded observations and should be interpreted using your
        dairy's applicable testing standards.
      </p>
    </div>
  );
};

export default MilkRecords;
