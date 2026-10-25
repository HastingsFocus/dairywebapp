import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.json({ message: "If an account with that email exists, a password reset link has been sent." });
    }

    if (user.role === "admin") {
      return res.json({ message: "If an account with that email exists, a password reset link has been sent." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: "Dairy Records - Password Reset",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Dairy Records System</h2>
          <p>Hello ${user.fullName || "User"},</p>
          <p>We received a request to reset your password.</p>
          <p>Click the button below to create a new password.</p>
          <p>
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">
              Reset Password
            </a>
          </p>
          <p>This link will expire in 15 minutes.</p>
          <p>If you did not request this password reset, you can safely ignore this email.</p>
          <p>Dairy Records System</p>
        </div>
      `,
    });

    return res.json({ message: "If an account with that email exists, a password reset link has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Unable to process password reset request" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) return res.status(400).json({ message: "New password is required" });
    if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Password reset link is invalid or has expired" });

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.passwordSet = true;
    user.isActive = true;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.json({ message: "Password reset successfully. You can now log in." });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Unable to reset password" });
  }
};

export const setInitialPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) return res.status(400).json({ message: "Password is required" });
    if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Invitation link is invalid or has expired" });
    if (user.passwordSet) return res.status(400).json({ message: "Your password has already been set" });

    user.password = await bcrypt.hash(password, 10);
    user.passwordSet = true;
    user.isActive = true;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.json({ message: "Account activated successfully. You can now log in." });
  } catch (error) {
    console.error("Initial password error:", error);
    return res.status(500).json({ message: "Unable to activate account" });
  }
};