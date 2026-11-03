
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Milk,
  ArrowRight,
  ShieldCheck,
  Leaf,
  UserRound,
  Mail,
  LockKeyhole,
} from "lucide-react";

import { registerOwner } from "../../services/authService";

const OwnerSignUp = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const fullName = formData.fullName.trim();
    const email = formData.email.trim().toLowerCase();

    if (!fullName) {
      setError("Please enter your full name.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    setSubmitting(true);

    try {
      await registerOwner({
        fullName,
        email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      navigate("/login", {
        replace: true,
        state: {
          message:
            "Your owner account has been created successfully. Please sign in.",
          email,
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create your account. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-[#404040] bg-[#1B1B1B] py-3.5 pl-11 pr-4 text-sm text-[#E7E7E7] outline-none transition placeholder:text-[#696969] focus:border-[#86efac] focus:ring-2 focus:ring-[#86efac]/10 disabled:cursor-not-allowed disabled:opacity-60";

  const labelClass =
    "mb-2 block text-sm font-medium text-[#D4D4D4]";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#181818] px-4 py-10 text-[#E7E7E7] sm:px-6">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#86efac]/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-[#86efac]/[0.05] blur-3xl" />

      <div className="relative z-10 w-full max-w-[460px]">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#86efac] text-[#181818] shadow-xl shadow-green-950/20">
            <Milk size={34} strokeWidth={2} />
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Dairy<span className="text-[#86efac]">Flow</span>
          </h1>

          <p className="mt-2 text-sm text-[#A3A3A3]">
            Dairy Records Management System
          </p>
        </div>

        {/* Registration card */}
        <div className="rounded-2xl border border-[#383838] bg-[#222222] p-6 shadow-2xl shadow-black/20 sm:p-9">
          <div className="mb-7">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#86efac]">
              Get started
            </p>

            <h2 className="text-2xl font-bold tracking-tight">
              Create an owner account
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#A3A3A3]">
              Set up your account to manage your dairy operations.
            </p>
          </div>

          {/* Security note */}
          <div className="mb-6 flex gap-3 rounded-lg border border-[#86efac]/20 bg-[#86efac]/[0.06] p-3.5">
            <ShieldCheck
              size={20}
              className="mt-0.5 shrink-0 text-[#86efac]"
            />

            <p className="text-xs leading-5 text-[#B7B7B7]">
              Enter your full name, use an email address you can
              access, and create a password with at least 8 characters.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-sm leading-5 text-red-300"
            >
              {error}
            </div>
          )}

          {/* Registration form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full name */}
            <div>
              <label htmlFor="fullName" className={labelClass}>
                Full name
              </label>

              <div className="relative">
                <UserRound
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#858585]"
                />

                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  autoComplete="name"
                  maxLength={100}
                  required
                  disabled={submitting}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className={labelClass}>
                Email address
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#858585]"
                />

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                  disabled={submitting}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className={labelClass}>
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#858585]"
                />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={submitting}
                  className="w-full rounded-lg border border-[#404040] bg-[#1B1B1B] py-3.5 pl-11 pr-12 text-sm text-[#E7E7E7] outline-none transition placeholder:text-[#696969] focus:border-[#86efac] focus:ring-2 focus:ring-[#86efac]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  disabled={submitting}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  className="absolute inset-y-0 right-0 flex items-center justify-center px-4 text-[#888888] transition hover:text-[#86efac]"
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className={labelClass}
              >
                Confirm password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#858585]"
                />

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={submitting}
                  className="w-full rounded-lg border border-[#404040] bg-[#1B1B1B] py-3.5 pl-11 pr-12 text-sm text-[#E7E7E7] outline-none transition placeholder:text-[#696969] focus:border-[#86efac] focus:ring-2 focus:ring-[#86efac]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((current) => !current)
                  }
                  disabled={submitting}
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  className="absolute inset-y-0 right-0 flex items-center justify-center px-4 text-[#888888] transition hover:text-[#86efac]"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-[#86efac] px-4 py-3.5 text-sm font-bold text-[#181818] transition duration-200 hover:bg-[#a7f3c0] focus:outline-none focus:ring-2 focus:ring-[#86efac]/50 focus:ring-offset-2 focus:ring-offset-[#222222] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#181818]/30 border-t-[#181818]" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Owner Account
                  <ArrowRight
                    size={18}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </>
              )}
            </button>
          </form>

          {/* Sign in link */}
          <div className="mt-7 border-t border-[#383838] pt-6 text-center">
            <p className="text-sm text-[#A3A3A3]">
              Already have an account?
            </p>

            <Link
              to="/login"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#86efac] transition hover:text-[#bbf7d0]"
            >
              Sign in
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#777777]">
          <Leaf size={14} className="text-[#86efac]" />
          <span>Build a smarter dairy operation with DairyFlow.</span>
        </div>
      </div>
    </div>
  );
};

export default OwnerSignUp;

