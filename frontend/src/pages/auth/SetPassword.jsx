import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Milk,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Leaf,
} from "lucide-react";

import { setInitialPassword } from "../../services/passwordService";

const SetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!token) {
      setError(
        "The password setup link is missing its invitation token."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    setSubmitting(true);

    try {
      const data = await setInitialPassword(token, {
        password,
        confirmPassword,
      });

      setSuccess(
        data.message ||
          "Your password has been set successfully. You can now log in."
      );

      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to set your password. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#181818] px-4 py-10 text-[#E7E7E7] sm:px-6">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#86efac]/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-[#86efac]/[0.05] blur-3xl" />

      <div className="relative z-10 w-full max-w-[440px]">
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

        {/* Main card */}
        <div className="rounded-2xl border border-[#383838] bg-[#222222] p-6 shadow-2xl shadow-black/20 sm:p-9">
          <div className="mb-7">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#86efac]">
              Account activation
            </p>

            <h2 className="text-2xl font-bold tracking-tight">
              Set your password
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#A3A3A3]">
              Create a secure password to activate your DairyFlow
              account.
            </p>
          </div>

          {/* Security note */}
          <div className="mb-6 flex gap-3 rounded-lg border border-[#383838] bg-[#1B1B1B] p-3.5">
            <ShieldCheck
              size={20}
              className="mt-0.5 shrink-0 text-[#86efac]"
            />

            <p className="text-xs leading-5 text-[#A3A3A3]">
              Choose a password with at least 8 characters and
              keep it private.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-sm leading-5 text-red-300"
            >
              {error}
            </div>
          )}

          {success ? (
            /* Success state */
            <div
              role="status"
              className="py-3 text-center"
            >
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#86efac]/30 bg-[#86efac]/10 text-[#86efac]">
                <CheckCircle size={34} />
              </div>

              <h3 className="text-xl font-bold text-[#E7E7E7]">
                Account activated!
              </h3>

              <p className="mt-3 text-sm leading-6 text-[#A3A3A3]">
                {success}
              </p>

              <button
                type="button"
                onClick={() => navigate("/login", { replace: true })}
                className="group mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#86efac] px-4 py-3.5 text-sm font-bold text-[#181818] transition hover:bg-[#a7f3c0] focus:outline-none focus:ring-2 focus:ring-[#86efac]/50"
              >
                Go to Login
                <ArrowRight
                  size={18}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </button>
            </div>
          ) : (
            /* Password form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-[#D4D4D4]"
                >
                  New password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError("");
                    }}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    disabled={submitting}
                    className="w-full rounded-lg border border-[#404040] bg-[#1B1B1B] px-4 py-3.5 pr-12 text-sm text-[#E7E7E7] outline-none transition placeholder:text-[#696969] focus:border-[#86efac] focus:ring-2 focus:ring-[#86efac]/10 disabled:cursor-not-allowed disabled:opacity-60"
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
                  className="mb-2 block text-sm font-medium text-[#D4D4D4]"
                >
                  Confirm password
                </label>

                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Enter your password again"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      setError("");
                    }}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    disabled={submitting}
                    className="w-full rounded-lg border border-[#404040] bg-[#1B1B1B] px-4 py-3.5 pr-12 text-sm text-[#E7E7E7] outline-none transition placeholder:text-[#696969] focus:border-[#86efac] focus:ring-2 focus:ring-[#86efac]/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    disabled={submitting}
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
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
                    Activating account...
                  </>
                ) : (
                  <>
                    Set Password
                    <ArrowRight
                      size={18}
                      className="transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Login link */}
          <div className="mt-7 border-t border-[#383838] pt-6 text-center">
            <p className="text-sm text-[#A3A3A3]">
              Already set up your password?
            </p>

            <Link
              to="/login"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#86efac] transition hover:text-[#bbf7d0]"
            >
              Sign in to your account
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#777777]">
          <Leaf size={14} className="text-[#86efac]" />
          <span>Your dairy operations, securely connected.</span>
        </div>
      </div>
    </div>
  );
};

export default SetPassword;