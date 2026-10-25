
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Milk } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { registerOwner } from "../../services/authService";

const OwnerSignUp = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
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

  if (formData.password !== formData.confirmPassword) {
    setError("Passwords do not match. Please try again.");
    return;
  }

  if (formData.password.length < 8) {
    setError("Password must be at least 8 characters long.");
    return;
  }

  setSubmitting(true);

  try {
    await registerOwner({
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    });

    // Registration succeeded. Redirect to the login page.
    navigate("/login", {
      replace: true,
      state: {
        message: "Your owner account has been created successfully. Please sign in.",
        email: formData.email.trim().toLowerCase(),
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

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <Milk size={28} />
          </div>

          <h1>Dairy Records System</h1>
          <p>Create your owner account</p>
        </div>

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-field">
            <label htmlFor="email">Email address</label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
              disabled={submitting}
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>

            <div className="password-input">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                minLength={6}
                required
                disabled={submitting}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword((current) => !current)
                }
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

          <div className="form-field">
            <label htmlFor="confirmPassword">
              Confirm password
            </label>

            <div className="password-input">
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
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowConfirmPassword((current) => !current)
                }
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={submitting}
          >
            {submitting
              ? "Creating account..."
              : "Create Owner Account"}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account?</p>

          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default OwnerSignUp;
