import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  X,
  CalendarDays,
  Leaf,
  Clock3,
} from "lucide-react";

import userService from "../../services/userService";

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
};

const getFarmerId = (farmer) => farmer._id || farmer.id;

const getFarmerStatus = (farmer) => {
  if (!farmer.passwordSet) return "Pending invitation";
  return farmer.isActive ? "Active" : "Deactivated";
};

const statusStyles = (farmer) => {
  if (!farmer.passwordSet) {
    return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }

  return farmer.isActive
    ? "border-[#86efac]/20 bg-[#86efac]/10 text-[#86efac]"
    : "border-red-400/20 bg-red-400/10 text-red-300";
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const Farmers = () => {
  const [farmers, setFarmers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [showDetailsLoading, setShowDetailsLoading] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadFarmers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await userService.getFarmers();
      setFarmers(response.farmers || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load farmers. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFarmers();
  }, [loadFarmers]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const openCreateForm = () => {
    setFormData(initialForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const closeCreateForm = () => {
    if (submitting) return;

    setShowForm(false);
    setError("");
  };

  const handleCreateFarmer = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.location.trim()
    ) {
      setError("Please complete all required fields.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await userService.createFarmer({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        location: formData.location.trim(),
      });

      setSuccess(
        response.message ||
          "Farmer created and invitation sent successfully."
      );

      setFormData(initialForm);
      setShowForm(false);

      await loadFarmers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create the farmer. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = async (farmer) => {
    setError("");
    setShowDetailsLoading(true);

    try {
      const response = await userService.getFarmerById(
        getFarmerId(farmer)
      );

      setSelectedFarmer(response.farmer);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load farmer details."
      );
    } finally {
      setShowDetailsLoading(false);
    }
  };

  const filteredFarmers = farmers.filter((farmer) => {
    const term = search.trim().toLowerCase();

    return (
      farmer.fullName?.toLowerCase().includes(term) ||
      farmer.email?.toLowerCase().includes(term) ||
      farmer.phone?.toLowerCase().includes(term) ||
      farmer.location?.toLowerCase().includes(term)
    );
  });

  const activeCount = farmers.filter(
    (farmer) => farmer.isActive && farmer.passwordSet
  ).length;

  const pendingCount = farmers.filter(
    (farmer) => !farmer.passwordSet
  ).length;

  const deactivatedCount = farmers.filter(
    (farmer) => farmer.passwordSet && !farmer.isActive
  ).length;

  const stats = [
    {
      title: "Total farmers",
      value: farmers.length,
      description: "Registered farmer accounts",
      icon: Users,
      iconStyle: "bg-sky-400/10 text-sky-400",
    },
    {
      title: "Active accounts",
      value: activeCount,
      description: "Farmers with access enabled",
      icon: ShieldCheck,
      iconStyle: "bg-[#86efac]/10 text-[#86efac]",
    },
    {
      title: "Pending invitations",
      value: pendingCount,
      description: "Password setup not completed",
      icon: Mail,
      iconStyle: "bg-amber-400/10 text-amber-300",
    },
    {
      title: "Deactivated",
      value: deactivatedCount,
      description: "Accounts without active access",
      icon: AlertCircle,
      iconStyle: "bg-red-400/10 text-red-300",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-7 pb-8">
      {/* Page heading */}
      <section className="relative overflow-hidden rounded-2xl border border-[#383838] bg-gradient-to-br from-[#243128] via-[#202722] to-[#222222] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full border border-[#86efac]/10" />
        <div className="pointer-events-none absolute -right-3 -top-7 h-44 w-44 rounded-full border border-[#86efac]/10" />
        <div className="pointer-events-none absolute bottom-0 right-32 h-32 w-32 rounded-full bg-[#86efac]/[0.06] blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#86efac]/20 bg-[#86efac]/[0.08] px-3 py-1.5">
              <Leaf size={14} className="text-[#86efac]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#86efac]">
                Buyer workspace / Farmers
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[#F0F0F0] sm:text-3xl">
              Farmers directory
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-[#B0B8B1] sm:text-base">
              Register farmers, send secure password invitations, and
              manage your farmer directory from one place.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-[#B0B8B1]">
              <span className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-black/10 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-[#86efac]" />
                {farmers.length} registered{" "}
                {farmers.length === 1 ? "farmer" : "farmers"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#86efac] px-5 py-3 text-sm font-bold text-[#17251b] shadow-lg shadow-green-950/20 transition duration-200 hover:-translate-y-0.5 hover:bg-[#a7f3bd] focus:outline-none focus:ring-2 focus:ring-[#86efac]/50 focus:ring-offset-2 focus:ring-offset-[#222222]"
          >
            <UserPlus size={18} />
            Add farmer
          </button>
        </div>
      </section>

      {/* Alerts */}
      {error && (
        <div
          className="flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.08] px-4 py-3.5 text-sm text-red-200"
          role="alert"
        >
          <AlertCircle size={19} className="mt-0.5 shrink-0 text-red-300" />
          <span className="min-w-0 flex-1 leading-5">{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
            className="rounded-md p-1 text-red-300 transition hover:bg-red-400/10 hover:text-red-100"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {success && (
        <div
          className="flex items-start gap-3 rounded-xl border border-[#86efac]/20 bg-[#86efac]/[0.08] px-4 py-3.5 text-sm text-[#c9f9d5]"
          role="status"
        >
          <CheckCircle2
            size={20}
            className="mt-0.5 shrink-0 text-[#86efac]"
          />
          <span className="min-w-0 flex-1 leading-5">{success}</span>
          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss success message"
            className="rounded-md p-1 text-[#86efac] transition hover:bg-[#86efac]/10"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              key={stat.title}
              className="group rounded-xl border border-[#383838] bg-[#222222] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#505050] hover:bg-[#252525] sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconStyle}`}
                >
                  <Icon size={22} strokeWidth={1.8} />
                </div>

                <span className="rounded-full border border-[#383838] bg-[#292929] px-2.5 py-1 text-[10px] font-semibold text-[#858585]">
                  Live data
                </span>
              </div>

              <p className="mt-5 text-sm font-medium text-[#A3A3A3]">
                {stat.title}
              </p>

              <h2 className="mt-1 text-3xl font-bold tracking-tight text-[#E7E7E7]">
                {loading ? "—" : stat.value}
              </h2>

              <p className="mt-3 text-xs leading-5 text-[#858585]">
                {stat.description}
              </p>
            </article>
          );
        })}
      </section>

      {/* Farmers directory */}
      <section className="overflow-hidden rounded-2xl border border-[#383838] bg-[#222222]">
        <div className="flex flex-col gap-5 border-b border-[#383838] p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#E7E7E7]">
              All farmers
            </h2>

            <p className="mt-1 text-sm text-[#A3A3A3]">
              {filteredFarmers.length}{" "}
              {filteredFarmers.length === 1 ? "farmer" : "farmers"} found
            </p>
          </div>

          <div className="flex w-full gap-2 lg:max-w-xl">
            <div className="relative min-w-0 flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777777]"
              />

              <input
                type="search"
                placeholder="Search name, email, phone or location..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search farmers"
                className="h-11 w-full rounded-xl border border-[#383838] bg-[#191919] pl-10 pr-4 text-sm text-[#E7E7E7] outline-none transition placeholder:text-[#737373] focus:border-[#86efac]/50 focus:ring-2 focus:ring-[#86efac]/10"
              />
            </div>

            <button
              type="button"
              onClick={loadFarmers}
              disabled={loading}
              aria-label="Refresh farmers"
              title="Refresh farmers"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#383838] bg-[#292929] text-[#A3A3A3] transition hover:border-[#86efac]/40 hover:text-[#86efac] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={18}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#86efac]/20 bg-[#86efac]/10">
              <RefreshCw
                size={25}
                className="animate-spin text-[#86efac]"
              />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-[#E7E7E7]">
              Loading farmers
            </h3>

            <p className="mt-1 text-sm text-[#858585]">
              Fetching your farmer directory...
            </p>
          </div>
        ) : filteredFarmers.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#383838] bg-[#292929] text-[#86efac]">
              <Users size={32} strokeWidth={1.5} />
            </div>

            <h3 className="mt-5 text-base font-bold text-[#E7E7E7]">
              {search ? "No matching farmers" : "No farmers yet"}
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-[#858585]">
              {search
                ? "Try another name, email address, phone number or location."
                : "Your farmer directory is empty. Add your first farmer to get started."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={openCreateForm}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#86efac] px-4 py-2.5 text-sm font-bold text-[#17251b] transition hover:bg-[#a7f3bd]"
              >
                <Plus size={18} />
                Add your first farmer
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[850px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#383838] bg-[#1d1d1d]">
                    {[
                      "Farmer",
                      "Contact",
                      "Location",
                      "Account status",
                      "Date added",
                      "Actions",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#858585]"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#383838]">
                  {filteredFarmers.map((farmer) => {
                    const farmerId = getFarmerId(farmer);

                    return (
                      <tr
                        key={farmerId}
                        className="transition-colors hover:bg-[#292929]/60"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#86efac]/20 bg-[#86efac]/10 text-sm font-bold text-[#86efac]">
                              {farmer.fullName
                                ?.charAt(0)
                                .toUpperCase() || "F"}
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-[200px] truncate text-sm font-semibold text-[#E7E7E7]">
                                {farmer.fullName || "Unnamed farmer"}
                              </p>

                              <p className="mt-1 max-w-[200px] truncate text-xs text-[#858585]">
                                {farmer.email || "No email"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm text-[#BDBDBD]">
                            <Phone
                              size={14}
                              className="shrink-0 text-[#777777]"
                            />
                            {farmer.phone || "Not provided"}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm text-[#BDBDBD]">
                            <MapPin
                              size={14}
                              className="shrink-0 text-[#777777]"
                            />
                            <span className="max-w-[160px] truncate">
                              {farmer.location || "Not provided"}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-[11px] font-semibold ${statusStyles(farmer)}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {getFarmerStatus(farmer)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 whitespace-nowrap text-xs text-[#A3A3A3]">
                            <CalendarDays
                              size={14}
                              className="text-[#777777]"
                            />
                            {formatDate(farmer.createdAt)}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => handleViewDetails(farmer)}
                            title={`View ${farmer.fullName || "farmer"} details`}
                            aria-label={`View ${farmer.fullName || "farmer"}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#383838] bg-[#292929] text-[#A3A3A3] transition hover:border-[#86efac]/40 hover:bg-[#86efac]/10 hover:text-[#86efac]"
                          >
                            <Eye size={17} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile and tablet farmer cards */}
            <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
              {filteredFarmers.map((farmer) => (
                <article
                  key={getFarmerId(farmer)}
                  className="rounded-xl border border-[#383838] bg-[#1d1d1d] p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#86efac]/20 bg-[#86efac]/10 text-sm font-bold text-[#86efac]">
                      {farmer.fullName?.charAt(0)?.toUpperCase() || "F"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-bold text-[#E7E7E7]">
                        {farmer.fullName || "Unnamed farmer"}
                      </h3>

                      <p className="mt-1 break-all text-xs text-[#858585]">
                        {farmer.email || "No email"}
                      </p>

                      <span
                        className={`mt-3 inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusStyles(farmer)}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {getFarmerStatus(farmer)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleViewDetails(farmer)}
                      aria-label={`View ${farmer.fullName || "farmer"}`}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#383838] bg-[#292929] text-[#A3A3A3] transition hover:border-[#86efac]/40 hover:text-[#86efac]"
                    >
                      <Eye size={17} />
                    </button>
                  </div>

                  <div className="mt-4 space-y-3 border-t border-[#383838] pt-4">
                    <div className="flex items-center gap-2.5 text-xs text-[#A3A3A3]">
                      <Phone size={15} className="shrink-0 text-[#777777]" />
                      <span className="break-all">
                        {farmer.phone || "Not provided"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs text-[#A3A3A3]">
                      <MapPin size={15} className="shrink-0 text-[#777777]" />
                      <span>{farmer.location || "Not provided"}</span>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs text-[#A3A3A3]">
                      <CalendarDays
                        size={15}
                        className="shrink-0 text-[#777777]"
                      />
                      <span>Added {formatDate(farmer.createdAt)}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Create farmer modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCreateForm();
            }
          }}
        >
          <section
            className="my-auto w-full max-w-xl overflow-hidden rounded-2xl border border-[#383838] bg-[#222222] shadow-2xl shadow-black/40"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-farmer-title"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#383838] px-5 py-5 sm:px-7">
              <div>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-[#86efac]/20 bg-[#86efac]/10 text-[#86efac]">
                  <UserPlus size={21} />
                </div>

                <h2
                  id="create-farmer-title"
                  className="text-xl font-bold text-[#E7E7E7]"
                >
                  Add a farmer
                </h2>

                <p className="mt-1.5 text-sm leading-5 text-[#A3A3A3]">
                  Enter the farmer's details to create an account invitation.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreateForm}
                disabled={submitting}
                aria-label="Close farmer form"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#383838] text-[#A3A3A3] transition hover:bg-[#303030] hover:text-[#E7E7E7] disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleCreateFarmer} className="space-y-5 p-5 sm:p-7">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="farmer-fullName"
                    className="mb-2 block text-xs font-semibold text-[#D0D0D0]"
                  >
                    Full name <span className="text-[#86efac]">*</span>
                  </label>

                  <input
                    id="farmer-fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleFormChange}
                    placeholder="Enter the farmer's full name"
                    autoComplete="name"
                    required
                    disabled={submitting}
                    className="h-11 w-full rounded-xl border border-[#383838] bg-[#191919] px-3.5 text-sm text-[#E7E7E7] outline-none transition placeholder:text-[#737373] focus:border-[#86efac]/50 focus:ring-2 focus:ring-[#86efac]/10 disabled:opacity-50"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="farmer-email"
                    className="mb-2 block text-xs font-semibold text-[#D0D0D0]"
                  >
                    Email address <span className="text-[#86efac]">*</span>
                  </label>

                  <input
                    id="farmer-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="farmer@example.com"
                    autoComplete="email"
                    required
                    disabled={submitting}
                    className="h-11 w-full rounded-xl border border-[#383838] bg-[#191919] px-3.5 text-sm text-[#E7E7E7] outline-none transition placeholder:text-[#737373] focus:border-[#86efac]/50 focus:ring-2 focus:ring-[#86efac]/10 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="farmer-phone"
                    className="mb-2 block text-xs font-semibold text-[#D0D0D0]"
                  >
                    Phone number <span className="text-[#86efac]">*</span>
                  </label>

                  <input
                    id="farmer-phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleFormChange}
                    placeholder="Enter phone number"
                    autoComplete="tel"
                    required
                    disabled={submitting}
                    className="h-11 w-full rounded-xl border border-[#383838] bg-[#191919] px-3.5 text-sm text-[#E7E7E7] outline-none transition placeholder:text-[#737373] focus:border-[#86efac]/50 focus:ring-2 focus:ring-[#86efac]/10 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="farmer-location"
                    className="mb-2 block text-xs font-semibold text-[#D0D0D0]"
                  >
                    Location <span className="text-[#86efac]">*</span>
                  </label>

                  <input
                    id="farmer-location"
                    name="location"
                    value={formData.location}
                    onChange={handleFormChange}
                    placeholder="Village, area or district"
                    autoComplete="address-level2"
                    required
                    disabled={submitting}
                    className="h-11 w-full rounded-xl border border-[#383838] bg-[#191919] px-3.5 text-sm text-[#E7E7E7] outline-none transition placeholder:text-[#737373] focus:border-[#86efac]/50 focus:ring-2 focus:ring-[#86efac]/10 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-[#86efac]/15 bg-[#86efac]/[0.06] p-4">
                <ShieldCheck
                  size={21}
                  className="mt-0.5 shrink-0 text-[#86efac]"
                />

                <p className="text-xs leading-5 text-[#B8C5BA]">
                  The farmer will set their own password using the email
                  invitation. The setup link is intended to expire after
                  24 hours.
                </p>
              </div>

              {error && (
                <div
                  className="flex items-start gap-2.5 rounded-lg border border-red-400/20 bg-red-400/[0.08] p-3 text-sm text-red-200"
                  role="alert"
                >
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-[#383838] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeCreateForm}
                  disabled={submitting}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-[#383838] px-5 text-sm font-semibold text-[#BDBDBD] transition hover:bg-[#303030] hover:text-[#E7E7E7] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#86efac] px-5 py-3 text-sm font-bold text-[#17251b] transition hover:bg-[#a7f3bd] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={17} className="animate-spin" />
                      Creating farmer...
                    </>
                  ) : (
                    <>
                      <Mail size={17} />
                      Create farmer & send invitation
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Farmer details modal */}
      {selectedFarmer && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedFarmer(null);
            }
          }}
        >
          <section
            className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-[#383838] bg-[#222222] shadow-2xl shadow-black/40"
            role="dialog"
            aria-modal="true"
            aria-labelledby="farmer-details-title"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#383838] px-5 py-5 sm:px-7">
              <div>
                <h2
                  id="farmer-details-title"
                  className="text-lg font-bold text-[#E7E7E7]"
                >
                  Farmer details
                </h2>

                <p className="mt-1 text-sm text-[#A3A3A3]">
                  Account information and access status
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFarmer(null)}
                aria-label="Close farmer details"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#383838] text-[#A3A3A3] transition hover:bg-[#303030] hover:text-[#E7E7E7]"
              >
                <X size={19} />
              </button>
            </div>

            <div className="p-5 sm:p-7">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[#86efac]/25 bg-[#86efac]/10 text-3xl font-bold text-[#86efac]">
                  {selectedFarmer.fullName
                    ?.charAt(0)
                    .toUpperCase() || "F"}
                </div>

                <h3 className="mt-4 text-lg font-bold text-[#E7E7E7]">
                  {selectedFarmer.fullName || "Unnamed farmer"}
                </h3>

                <span
                  className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${statusStyles(selectedFarmer)}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {getFarmerStatus(selectedFarmer)}
                </span>
              </div>

              <div className="mt-7 divide-y divide-[#383838] rounded-xl border border-[#383838] bg-[#1d1d1d] px-4">
                <div className="flex items-start gap-3 py-4">
                  <Mail size={18} className="mt-0.5 shrink-0 text-[#86efac]" />

                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[#858585]">Email address</p>
                    <p className="mt-1 break-all text-sm font-medium text-[#E7E7E7]">
                      {selectedFarmer.email || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 py-4">
                  <Phone size={18} className="mt-0.5 shrink-0 text-[#86efac]" />

                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[#858585]">Phone number</p>
                    <p className="mt-1 break-words text-sm font-medium text-[#E7E7E7]">
                      {selectedFarmer.phone || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 py-4">
                  <MapPin size={18} className="mt-0.5 shrink-0 text-[#86efac]" />

                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[#858585]">Location</p>
                    <p className="mt-1 text-sm font-medium text-[#E7E7E7]">
                      {selectedFarmer.location || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 py-4">
                  <ShieldCheck
                    size={18}
                    className="mt-0.5 shrink-0 text-[#86efac]"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[#858585]">Password setup</p>
                    <p className="mt-1 text-sm font-medium text-[#E7E7E7]">
                      {selectedFarmer.passwordSet
                        ? "Completed"
                        : "Pending"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 py-4">
                  <CalendarDays
                    size={18}
                    className="mt-0.5 shrink-0 text-[#86efac]"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[#858585]">Account created</p>
                    <p className="mt-1 text-sm font-medium text-[#E7E7E7]">
                      {formatDate(selectedFarmer.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#383838] bg-[#292929]/60 p-4">
                <Clock3
                  size={18}
                  className="mt-0.5 shrink-0 text-[#86efac]"
                />

                <p className="text-xs leading-5 text-[#A3A3A3]">
                  This farmer can view their own milk records after
                  logging in. Milk production summaries can be connected
                  to this profile through the records API.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFarmer(null)}
                className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#383838] text-sm font-semibold text-[#BDBDBD] transition hover:bg-[#303030] hover:text-[#E7E7E7]"
              >
                Close details
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Details request indicator */}
      {showDetailsLoading && (
        <div className="fixed bottom-5 right-5 z-[110] flex items-center gap-3 rounded-xl border border-[#383838] bg-[#222222] px-4 py-3 shadow-xl shadow-black/30">
          <RefreshCw size={17} className="animate-spin text-[#86efac]" />
          <span className="text-sm text-[#E7E7E7]">
            Loading farmer details...
          </span>
        </div>
      )}
    </div>
  );
};

export default Farmers;