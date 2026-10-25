import User from "../models/User.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email !== process.env.ADMIN_EMAIL) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken("admin", "admin");

    return res.json({
      id: "admin",
      email: process.env.ADMIN_EMAIL,
      role: "admin",
      token,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


export const registerOwner = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    // 1. Validate required fields
    if (!email || !password || !confirmPassword) {
      return res.status(400).json({
        message: "Email, password and confirm password are required.",
      });
    }

    // 2. Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // 3. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Please provide a valid email address.",
      });
    }

    // 4. Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long.",
      });
    }

    // 5. Confirm passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Password and confirm password do not match.",
      });
    }

    // 6. Check whether the email is already registered
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    // 7. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 8. Create the owner account
    const owner = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      role: "owner",
      isActive: true,
      passwordSet: true,
    });

    // 9. Generate authentication token
    const token = generateToken(owner._id, owner.role);

    // 10. Return the safe user details and token
    return res.status(201).json({
      message: "Owner account created successfully.",
      user: {
        id: owner._id,
        email: owner.email,
        role: owner.role,
      },
      token,
    });
  } catch (error) {
    // Handle duplicate email race conditions
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    console.error("Owner registration error:", error);

    return res.status(500).json({
      message: "Unable to create the owner account. Please try again.",
    });
  }
};


export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message:
          "Your account is not active. Please contact the dairy owner.",
      });
    }

    if (!user.password) {
      return res.status(403).json({
        message:
          "Your password has not been set. Please complete your account setup.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Unable to sign in. Please try again.",
    });
  }
};