import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Milk,
  ArrowRight,
  ShieldCheck,
  Leaf,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { loginUser } from "../../services/authService";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      const data = await loginUser({
        email: email.trim().toLowerCase(),
        password,
      });

      const loggedInUser = login(data);

      const destinations = {
        admin: "/admin",
        owner: "/owner",
        buyer: "/buyer",
        farmer: "/farmer",
      };

      const destination = destinations[loggedInUser.role];

      if (!destination) {
        throw new Error("Your account role is not recognized.");
      }

      navigate(destination, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Invalid email or password."
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

        {/* Login card */}
        <div className="rounded-2xl border border-[#383838] bg-[#222222] p-6 shadow-2xl shadow-black/20 sm:p-9">
          <div className="mb-7">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#86efac]">
              Welcome back
            </p>

            <h2 className="text-2xl font-bold tracking-tight">
              Sign in to your account
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#A3A3A3]">
              Enter your credentials to access your dairy operations.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="mb-5 flex gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-300"
            >
              <ShieldCheck
                size={19}
                className="mt-0.5 shrink-0"
              />
              <p>{error}</p>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-[#D4D4D4]"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                disabled={submitting}
                className="w-full rounded-lg border border-[#404040] bg-[#1B1B1B] px-4 py-3.5 text-sm text-[#E7E7E7] outline-none transition placeholder:text-[#696969] focus:border-[#86efac] focus:ring-2 focus:ring-[#86efac]/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[#D4D4D4]"
                >
                  Password
                </label>

                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-[#86efac] transition hover:text-[#bbf7d0]"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
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
                  className="absolute inset-y-0 right-0 flex items-center justify-center px-4 text-[#888888] transition hover:text-[#86efac] disabled:cursor-not-allowed"
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting}
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-[#86efac] px-4 py-3.5 text-sm font-bold text-[#181818] transition duration-200 hover:bg-[#a7f3c0] focus:outline-none focus:ring-2 focus:ring-[#86efac]/50 focus:ring-offset-2 focus:ring-offset-[#222222] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#181818]/30 border-t-[#181818]" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight
                    size={18}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </>
              )}
            </button>
          </form>

          {/* Owner registration */}
          <div className="mt-7 border-t border-[#383838] pt-6 text-center">
            <p className="text-sm text-[#A3A3A3]">
              Don't have an owner account?
            </p>

            <Link
              to="/owner/signup"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#86efac] transition hover:text-[#bbf7d0]"
            >
              Create an owner account
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#777777]">
          <Leaf size={14} className="text-[#86efac]" />
          <span>Smarter dairy management, one record at a time.</span>
        </div>
      </div>
    </div>
  );
};

export default Login;