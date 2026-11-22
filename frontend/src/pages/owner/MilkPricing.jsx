
import { useEffect, useState } from "react";
import {
  Banknote,
  Clock,
  RefreshCw,
  Save,
  TrendingUp,
} from "lucide-react";

import api from "../../services/api";

const formatMWK = (amount) => {
  if (amount === null || amount === undefined) return "—";

  return `K${Number(amount).toLocaleString("en-MW", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const MilkPricing = () => {
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [priceInput, setPriceInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchMilkPrice = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/milk-prices/current");
      const data = response.data;

      if (data.configured) {
        setCurrentPrice(Number(data.pricePerLitre));
        setPriceInput(String(data.pricePerLitre));
        setPriceHistory(data.priceHistory || []);
      } else {
        setCurrentPrice(null);
        setPriceInput("");
        setPriceHistory([]);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load the current milk buying price."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilkPrice();
  }, []);

  const handleUpdatePrice = async (event) => {
    event.preventDefault();

    const newPrice = Number(priceInput);

    if (!Number.isFinite(newPrice) || newPrice <= 0) {
      setError("Please enter a valid price greater than zero.");
      setSuccess("");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await api.put("/milk-prices/current", {
        pricePerLitre: newPrice,
      });

      const data = response.data;

      setCurrentPrice(Number(data.pricePerLitre));
      setPriceInput(String(data.pricePerLitre));
      setPriceHistory(data.priceHistory || []);

      setSuccess(data.message || "Milk buying price updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update the milk buying price."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-[#E7E7E7]">
      {/* Page heading */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Milk Pricing</h1>
          <p className="mt-1 text-sm text-[#A3A3A3]">
            Manage the price paid to farmers for every litre of milk.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchMilkPrice}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#383838] px-4 py-2.5 text-sm text-[#E7E7E7] transition hover:bg-[#2A2A2A] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          {success}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-[#383838] bg-[#222222] p-10 text-center text-sm text-[#A3A3A3]">
          Loading milk pricing information...
        </div>
      ) : (
        <>
          {/* Current price card */}
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-[#383838] bg-[#222222] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#A3A3A3]">
                    Current buying price
                  </p>

                  <h2 className="mt-3 text-3xl font-bold text-[#86efac]">
                    {currentPrice !== null
                      ? formatMWK(currentPrice)
                      : "Not configured"}
                  </h2>

                  <p className="mt-1 text-sm text-[#A3A3A3]">
                    Per litre of milk
                  </p>
                </div>

                <div className="rounded-xl bg-[#86efac]/10 p-4 text-[#86efac]">
                  <Banknote size={28} />
                </div>
              </div>

              <div className="mt-6 border-t border-[#383838] pt-4">
                <div className="flex items-center gap-2 text-sm text-[#A3A3A3]">
                  <TrendingUp size={16} />
                  <span>
                    {priceHistory.length} price change
                    {priceHistory.length === 1 ? "" : "s"} recorded
                  </span>
                </div>
              </div>
            </div>

            {/* Update price form */}
            <div className="rounded-xl border border-[#383838] bg-[#222222] p-6">
              <h2 className="text-lg font-semibold">
                Update buying price
              </h2>

              <p className="mt-1 text-sm text-[#A3A3A3]">
                Set the new amount the dairy will pay per litre.
              </p>

              <form onSubmit={handleUpdatePrice} className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="pricePerLitre"
                    className="mb-2 block text-sm font-medium text-[#E7E7E7]"
                  >
                    New price per litre (MWK)
                  </label>

                  <div className="flex items-center rounded-lg border border-[#383838] bg-[#181818] focus-within:border-[#86efac]">
                    <span className="border-r border-[#383838] px-4 py-3 text-sm text-[#A3A3A3]">
                      MWK
                    </span>

                    <input
                      id="pricePerLitre"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={priceInput}
                      onChange={(event) => setPriceInput(event.target.value)}
                      placeholder="Enter price per litre"
                      required
                      className="w-full bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-[#666666]"
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-[#181818] p-3 text-xs leading-5 text-[#A3A3A3]">
                  Changing the buying price affects new milk records only.
                  Previously recorded milk keeps its original saved price.
                </div>

                <button
                  type="submit"
                  disabled={saving || !priceInput}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#86efac] px-4 py-3 text-sm font-semibold text-[#181818] transition hover:bg-[#6ee7a0] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={17} />
                  {saving ? "Saving price..." : "Update buying price"}
                </button>
              </form>
            </div>
          </div>

          {/* Price history */}
          <div className="overflow-hidden rounded-xl border border-[#383838] bg-[#222222]">
            <div className="flex items-center gap-3 border-b border-[#383838] p-5">
              <div className="rounded-lg bg-[#86efac]/10 p-2 text-[#86efac]">
                <Clock size={20} />
              </div>

              <div>
                <h2 className="font-semibold">Price history</h2>
                <p className="text-xs text-[#A3A3A3]">
                  A record of previous milk buying prices.
                </p>
              </div>
            </div>

            {priceHistory.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#A3A3A3]">
                No price changes have been recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[550px] text-left text-sm">
                  <thead className="bg-[#181818] text-xs uppercase text-[#A3A3A3]">
                    <tr>
                      <th className="px-5 py-4 font-medium">#</th>
                      <th className="px-5 py-4 font-medium">
                        Buying price
                      </th>
                      <th className="px-5 py-4 font-medium">
                        Effective date
                      </th>
                      <th className="px-5 py-4 font-medium">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#383838]">
                    {[...priceHistory].reverse().map((item, index) => {
                      const isCurrent =
                        Number(item.pricePerLitre) === currentPrice &&
                        index === 0;

                      return (
                        <tr
                          key={`${item.effectiveFrom}-${index}`}
                          className="transition hover:bg-[#292929]"
                        >
                          <td className="px-5 py-4 text-[#A3A3A3]">
                            {index + 1}
                          </td>

                          <td className="px-5 py-4 font-medium">
                            {formatMWK(item.pricePerLitre)}
                          </td>

                          <td className="px-5 py-4 text-[#A3A3A3]">
                            {formatDate(item.effectiveFrom)}
                          </td>

                          <td className="px-5 py-4">
                            {isCurrent ? (
                              <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                                Current
                              </span>
                            ) : (
                              <span className="text-xs text-[#A3A3A3]">
                                Previous
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
        </>
      )}
    </div>
  );
};

export default MilkPricing;
