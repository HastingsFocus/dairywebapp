
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Eye, EyeOff, Milk, CheckCircle } from "lucide-react";

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
      setError("The password setup link is missing its invitation token.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Your password must contain at least 6 characters.");
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
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <Milk size={28} />
          </div>

          <h1>Set Your Password</h1>

          <p>
            Create a secure password to activate your Dairy Records
            System account.
          </p>
        </div>

        {error && (
          <div className="login-error" role="alert">
            {error}
          </div>
        )}

        {success ? (
          <div className="password-success">
            <CheckCircle size={42} />

            <h2>Account Activated!</h2>

            <p>{success}</p>

            <button
              type="button"
              className="login-button"
              onClick={() => navigate("/login", { replace: true })}
            >
              Go to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="password">New password</label>

              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                  disabled={submitting}
                />

                <button
                  type="button"
                  className="password-toggle"
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  onClick={() =>
                    setShowPassword((current) => !current)
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

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm password</label>

              <div className="password-wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Enter your password again"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  autoComplete="new-password"
                  minLength={6}
                  required
                  disabled={submitting}
                />

                <button
                  type="button"
                  className="password-toggle"
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  onClick={() =>
                    setShowConfirmPassword((current) => !current)
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
              className="login-button"
              disabled={submitting}
            >
              {submitting ? "Activating account..." : "Set Password"}
            </button>
          </form>
        )}

        <div className="signup-section">
          <p>Already set up your password?</p>

          <Link to="/login">Sign in to your account</Link>
        </div>
      </div>
    </div>
  );
};

export default SetPassword;
