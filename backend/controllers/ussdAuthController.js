import User from "../models/User.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";
import normalizeMalawiPhone from "../utils/normalizePhone.js";

const MAX_PIN_ATTEMPTS = 5;
const PIN_LOCK_DURATION = 15 * 60 * 1000; // 15 minutes

// Check whether a farmer is eligible to use USSD
const checkFarmerEligibility = (farmer) => {
  if (!farmer.isActive || !farmer.passwordSet) {
    return "Your account is not yet active. Please contact your buyer.";
  }

  if (!farmer.phoneVerified) {
    return "Please verify your phone number before using USSD.";
  }

  return null;
};

// ==========================================
// 1. SET USSD PIN
// ==========================================

export const setUssdPin = async (req, res) => {
  try {
    const { pin, confirmPin } = req.body;

    if (!/^\d{4}$/.test(String(pin || ""))) {
      return res.status(400).json({
        message: "Your PIN must contain exactly four digits.",
      });
    }

    if (pin !== confirmPin) {
      return res.status(400).json({
        message: "PIN confirmation does not match.",
      });
    }

    const farmer = await User.findOne({
      _id: req.user._id,
      role: "farmer",
    }).select("+ussdPin");

    if (!farmer) {
      return res.status(404).json({
        message: "Farmer account not found.",
      });
    }

    const eligibilityError = checkFarmerEligibility(farmer);

    if (eligibilityError) {
      return res.status(403).json({
        message: eligibilityError,
      });
    }

    if (farmer.ussdPinSet && farmer.ussdPin) {
      return res.status(400).json({
        message: "You already have a USSD PIN. Please change your existing PIN.",
      });
    }

    farmer.ussdPin = await bcrypt.hash(pin, 12);
    farmer.ussdPinSet = true;
    farmer.ussdPinAttempts = 0;
    farmer.ussdPinLockedUntil = null;

    await farmer.save();

    return res.status(200).json({
      message: "Your USSD PIN has been set successfully.",
      ussdPinSet: true,
    });
  } catch (error) {
    console.error("Set USSD PIN error:", error);

    return res.status(500).json({
      message: "Unable to set your USSD PIN.",
    });
  }
};

// ==========================================
// 2. CHANGE USSD PIN
// ==========================================

export const changeUssdPin = async (req, res) => {
  try {
    const { currentPin, newPin, confirmNewPin } = req.body;

    if (
      !/^\d{4}$/.test(String(currentPin || "")) ||
      !/^\d{4}$/.test(String(newPin || ""))
    ) {
      return res.status(400).json({
        message: "Your PINs must contain exactly four digits.",
      });
    }

    if (newPin !== confirmNewPin) {
      return res.status(400).json({
        message: "New PIN confirmation does not match.",
      });
    }

    if (currentPin === newPin) {
      return res.status(400).json({
        message: "Your new PIN must be different from your current PIN.",
      });
    }

    const farmer = await User.findOne({
      _id: req.user._id,
      role: "farmer",
    }).select("+ussdPin");

    if (!farmer) {
      return res.status(404).json({
        message: "Farmer account not found.",
      });
    }

    const eligibilityError = checkFarmerEligibility(farmer);

    if (eligibilityError) {
      return res.status(403).json({
        message: eligibilityError,
      });
    }

    if (!farmer.ussdPinSet || !farmer.ussdPin) {
      return res.status(400).json({
        message: "You have not set a USSD PIN yet.",
      });
    }

    if (
      farmer.ussdPinLockedUntil &&
      farmer.ussdPinLockedUntil.getTime() > Date.now()
    ) {
      return res.status(429).json({
        message: "Your PIN is temporarily locked. Please try again later.",
      });
    }

    const isCurrentPinCorrect = await bcrypt.compare(
      currentPin,
      farmer.ussdPin
    );

    if (!isCurrentPinCorrect) {
      farmer.ussdPinAttempts += 1;

      if (farmer.ussdPinAttempts >= MAX_PIN_ATTEMPTS) {
        farmer.ussdPinLockedUntil = new Date(
          Date.now() + PIN_LOCK_DURATION
        );
      }

      await farmer.save();

      return res.status(400).json({
        message: "Your current PIN is incorrect.",
        attemptsRemaining: Math.max(
          0,
          MAX_PIN_ATTEMPTS - farmer.ussdPinAttempts
        ),
      });
    }

    farmer.ussdPin = await bcrypt.hash(newPin, 12);
    farmer.ussdPinAttempts = 0;
    farmer.ussdPinLockedUntil = null;

    await farmer.save();

    return res.status(200).json({
      message: "Your USSD PIN has been changed successfully.",
    });
  } catch (error) {
    console.error("Change USSD PIN error:", error);

    return res.status(500).json({
      message: "Unable to change your USSD PIN.",
    });
  }
};

// ==========================================
// 3. USSD FARMER LOGIN
// ==========================================

export const loginFarmerUssd = async (req, res) => {
  try {
    const { phone, pin } = req.body;

    if (!phone || !pin) {
      return res.status(400).json({
        message: "Phone number and PIN are required.",
      });
    }

    if (!/^\d{4}$/.test(String(pin))) {
      return res.status(400).json({
        message: "Enter a valid four-digit PIN.",
      });
    }

    const normalizedPhone = normalizeMalawiPhone(phone);

    if (!normalizedPhone) {
      return res.status(400).json({
        message: "Enter a valid Malawi phone number.",
      });
    }

    const farmer = await User.findOne({
      phone: normalizedPhone,
      role: "farmer",
    }).select("+ussdPin");

    if (!farmer) {
      return res.status(401).json({
        message: "Invalid phone number or PIN.",
      });
    }

    const eligibilityError = checkFarmerEligibility(farmer);

    if (eligibilityError) {
      return res.status(403).json({
        message: eligibilityError,
      });
    }

    if (!farmer.ussdPinSet || !farmer.ussdPin) {
      return res.status(403).json({
        message: "You have not set up your USSD PIN yet.",
      });
    }

    if (
      farmer.ussdPinLockedUntil &&
      farmer.ussdPinLockedUntil.getTime() > Date.now()
    ) {
      return res.status(429).json({
        message: "Too many incorrect attempts. Your PIN is temporarily locked.",
        lockedUntil: farmer.ussdPinLockedUntil,
      });
    }

    // Clear an expired lockout
    if (
      farmer.ussdPinLockedUntil &&
      farmer.ussdPinLockedUntil.getTime() <= Date.now()
    ) {
      farmer.ussdPinAttempts = 0;
      farmer.ussdPinLockedUntil = null;
    }

    const isPinCorrect = await bcrypt.compare(pin, farmer.ussdPin);

    if (!isPinCorrect) {
      farmer.ussdPinAttempts += 1;

      if (farmer.ussdPinAttempts >= MAX_PIN_ATTEMPTS) {
        farmer.ussdPinLockedUntil = new Date(
          Date.now() + PIN_LOCK_DURATION
        );
      }

      await farmer.save();

      return res.status(401).json({
        message: "Invalid phone number or PIN.",
        attemptsRemaining: Math.max(
          0,
          MAX_PIN_ATTEMPTS - farmer.ussdPinAttempts
        ),
      });
    }

    // Successful login resets failed attempts
    farmer.ussdPinAttempts = 0;
    farmer.ussdPinLockedUntil = null;

    await farmer.save();

    const token = generateToken(farmer._id, farmer.role);

    return res.status(200).json({
      message: "USSD farmer authentication successful.",
      token,
      farmer: {
        id: farmer._id,
        fullName: farmer.fullName,
        phone: farmer.phone,
        role: farmer.role,
        ussdPinSet: farmer.ussdPinSet,
      },
    });
  } catch (error) {
    console.error("USSD login error:", error);

    return res.status(500).json({
      message: "Unable to authenticate farmer.",
    });
  }
};