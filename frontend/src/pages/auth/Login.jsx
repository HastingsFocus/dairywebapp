
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Milk } from "lucide-react";

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
      // Send one login request to the backend.
      const data = await loginUser({
        email: email.trim().toLowerCase(),
        password,
      });

      // Save the response without making another API request.
      const loggedInUser = login(data);

      // Redirect based on the normalized user's role.
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
    <div className="login-page">
      <div className="login-card">
        {/* Logo / Heading */}
        <div className="login-header">
          <div className="login-logo">
            <Milk size={28} />
          </div>

          <h1>Dairy Records System</h1>

          <p>Sign in to access your account</p>
        </div>

        {/* Error */}
        {error && (
          <div className="login-error" role="alert">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email address</label>

            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              disabled={submitting}
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">Password</label>

            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                disabled={submitting}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((current) => !current)
                }
                className="password-toggle"
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>
          </div>

          {/* Forgot password */}
          <div className="forgot-password">
            <Link to="/forgot-password">
              Forgot your password?
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="login-button"
            disabled={submitting}
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Owner signup */}
        <div className="signup-section">
          <p>Don't have an owner account?</p>

          <Link to="/owner/signup">
            Create an owner account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
