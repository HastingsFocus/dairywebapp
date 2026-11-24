import User from "../models/User.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";
import normalizeMalawiPhone from "../utils/normalizePhone.js";



export const createFarmer = async (req, res) => {
  let farmer;

  try {
    const { fullName, email, phone, location } = req.body;

    // Validate required fields
    if (
      !fullName?.trim() ||
      !email?.trim() ||
      !phone?.trim() ||
      !location?.trim()
    ) {
      return res.status(400).json({
        message: "Full name, email, phone, and location are required.",
      });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Normalize Malawi phone number
    let normalizedPhone;

    try {
      normalizedPhone = normalizeMalawiPhone(phone);
    } catch (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    // Check existing email
    const existingEmail = await User.findOne({
      email: normalizedEmail,
    });

    if (existingEmail) {
      return res.status(409).json({
        message: "A user with this email already exists.",
      });
    }

    // Check existing farmer phone
    const existingPhone = await User.findOne({
      role: "farmer",
      phone: normalizedPhone,
    });

    if (existingPhone) {
      return res.status(409).json({
        message:
          "This phone number is already registered to another farmer.",
      });
    }

    // Get frontend URL
    const frontendUrl = process.env.FRONTEND_URL?.replace(/\/+$/, "");

    if (!frontendUrl) {
      console.error("FRONTEND_URL is missing.");

      return res.status(500).json({
        message: "Farmer invitation could not be configured.",
      });
    }

    // Generate secure password setup token
    const rawToken = crypto.randomBytes(32).toString("hex");

    // Hash token before saving to database
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    // Create farmer account
    farmer = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      phoneVerified: false,
      phoneVerifiedAt: null,
      location: location.trim(),
      role: "farmer",
      createdBy: req.user._id,
      isActive: false,
      passwordSet: false,
      resetPasswordToken: hashedToken,
      resetPasswordExpires: new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ),
    });

    // Generate frontend password setup URL
    const setupUrl = `${frontendUrl}/set-password/${rawToken}`;

    console.log("Farmer password setup URL:", setupUrl);

    // Send invitation email
    await sendEmail({
      to: normalizedEmail,
      subject: "Welcome to the Dairy Records System",
      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          padding: 20px;
          color: #333;
        ">

          <h2 style="color: #15803d;">
            Welcome to the Dairy Records System!
          </h2>

          <p>Hello ${fullName.trim()},</p>

          <p>
            A dairy buyer has created an account for you
            in the Dairy Records System.
          </p>

          <p>
            To activate your account, click the button below
            to create your password.
          </p>

          <div style="margin: 30px 0;">
            <a
              href="${setupUrl}"
              target="_blank"
              rel="noopener noreferrer"
              style="
                background-color: #15803d;
                color: #ffffff;
                padding: 14px 24px;
                text-decoration: none;
                border-radius: 6px;
                display: inline-block;
                font-weight: bold;
              "
            >
              Set My Password
            </a>
          </div>

          <p>
            This link expires in 24 hours and can only be used
            to set up your account password.
          </p>

          <p>
            If the button does not work, copy and paste this
            link into your browser:
          </p>

          <p style="word-break: break-all;">
            <a href="${setupUrl}">
              ${setupUrl}
            </a>
          </p>

          <p>
            If you were not expecting this invitation,
            please contact your dairy buyer.
          </p>

          <p>
            Regards,<br />
            Dairy Records System
          </p>

        </div>
      `,
    });

    return res.status(201).json({
      message:
        "Farmer created successfully. A password setup invitation has been sent to their email.",
      farmer: {
        _id: farmer._id,
        fullName: farmer.fullName,
        email: farmer.email,
        phone: farmer.phone,
        phoneVerified: farmer.phoneVerified,
        location: farmer.location,
        role: farmer.role,
        isActive: farmer.isActive,
        passwordSet: farmer.passwordSet,
        createdAt: farmer.createdAt,
      },
    });

  } catch (error) {
    console.error("Create farmer error:", error);

    // Clean up farmer if invitation failed
    if (farmer?._id) {
      try {
        await User.findByIdAndDelete(farmer._id);
      } catch (cleanupError) {
        console.error(
          "Failed to clean up farmer:",
          cleanupError
        );
      }
    }

    if (error.code === 11000) {
      if (error.keyPattern?.phone) {
        return res.status(409).json({
          message:
            "This phone number is already registered to another farmer.",
        });
      }

      if (error.keyPattern?.email) {
        return res.status(409).json({
          message: "A user with this email already exists.",
        });
      }

      return res.status(409).json({
        message: "A farmer with these details already exists.",
      });
    }

    return res.status(500).json({
      message:
        "Unable to create the farmer or send the invitation. Please try again.",
    });
  }
};


export const createBuyer = async (req, res) => {
  let buyer;

  try {
    const { fullName, email, phone } = req.body;

    if (!fullName?.trim() || !email?.trim()) {
      return res.status(400).json({ message: "Full name and email are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    buyer = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || "",
      role: "buyer",
      isActive: false,
      passwordSet: false,
      resetPasswordToken: hashedToken,
      resetPasswordExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdBy: req.user._id,
    });

    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) throw new Error("FRONTEND_URL is not configured.");

    const setupUrl = `${frontendUrl.replace(/\/$/, "")}/set-password/${rawToken}`;

    await sendEmail({
      to: buyer.email,
      subject: "Invitation to join Dairy Records System",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Welcome to Dairy Records System</h2>
          <p>Hello ${buyer.fullName},</p>
          <p>You have been invited by a dairy owner to join the Dairy Records System as a buyer.</p>
          <p>Click the link below to set your password and activate your account. This link expires in 24 hours.</p>
          <p>
            <a href="${setupUrl}" style="display:inline-block;padding:12px 20px;background:#0284c7;color:#ffffff;text-decoration:none;border-radius:6px;">
              Set My Password
            </a>
          </p>
          <p>If the button does not work, copy this link into your browser:</p>
          <p>${setupUrl}</p>
          <p>If you were not expecting this invitation, you can ignore it.</p>
        </div>
      `,
    });

    return res.status(201).json({
      message: "Buyer invited successfully. A password setup email has been sent.",
      buyer: {
        id: buyer._id,
        fullName: buyer.fullName,
        email: buyer.email,
        phone: buyer.phone,
        location: buyer.location,
        role: buyer.role,
        isActive: buyer.isActive,
      },
    });
  } catch (error) {
    if (buyer?._id) {
      try {
        await User.findByIdAndDelete(buyer._id);
      } catch (cleanupError) {
        console.error("Buyer cleanup failed:", cleanupError.message);
      }
    }

    console.error("Create buyer error:", error.message);

    return res.status(500).json({ message: "Unable to invite buyer. Check the server and email configuration." });
  }
};


export const getBuyers = async (req, res) => {
  try {
    const buyers = await User.find({
      role: "buyer",
      createdBy: req.user._id,
    })
      .select("fullName email phone isActive passwordSet createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      count: buyers.length,
      buyers,
    });
  } catch (error) {
    console.error("Get buyers error:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve buyers.",
    });
  }
};

export const getBuyerById = async (req, res) => {
  try {
    const buyer = await User.findOne({
      _id: req.params.id,
      role: "buyer",
      createdBy: req.user._id,
    })
      .select("fullName email phone location role isActive passwordSet createdAt updatedAt")
      .lean();

    if (!buyer) {
      return res.status(404).json({
        message: "Buyer not found.",
      });
    }

    return res.status(200).json({ buyer });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid buyer ID.",
      });
    }

    console.error("Get buyer details error:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve buyer details.",
    });
  }
};

export const updateBuyerStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        message: "isActive must be true or false.",
      });
    }

    const buyer = await User.findOne({
      _id: req.params.id,
      role: "buyer",
      createdBy: req.user._id,
    });

    if (!buyer) {
      return res.status(404).json({
        message: "Buyer not found.",
      });
    }

    // Do not activate an account until its password has been set.
    if (isActive && !buyer.passwordSet) {
      return res.status(400).json({
        message: "This buyer must complete password setup before activation.",
      });
    }

    buyer.isActive = isActive;
    await buyer.save();

    return res.status(200).json({
      message: `Buyer ${isActive ? "activated" : "deactivated"} successfully.`,
      buyer: {
        id: buyer._id,
        fullName: buyer.fullName,
        email: buyer.email,
        isActive: buyer.isActive,
        passwordSet: buyer.passwordSet,
      },
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid buyer ID.",
      });
    }

    console.error("Update buyer status error:", error.message);

    return res.status(500).json({
      message: "Unable to update buyer status.",
    });
  }
};


export const getFarmers = async (req, res) => {
  try {
    const farmers = await User.find({
      role: "farmer",
      createdBy: req.user._id,
    })
      .select(
        "fullName email phone location role isActive passwordSet createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      count: farmers.length,
      farmers,
    });
  } catch (error) {
    console.error("Get farmers error:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve farmers.",
    });
  }
};

export const getFarmerById = async (req, res) => {
  try {
    const farmer = await User.findOne({
      _id: req.params.id,
      role: "farmer",
      createdBy: req.user._id,
    })
      .select(
        "fullName email phone location role isActive passwordSet createdAt updatedAt"
      )
      .lean();

    if (!farmer) {
      return res.status(404).json({
        message: "Farmer not found.",
      });
    }

    return res.status(200).json({ farmer });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid farmer ID.",
      });
    }

    console.error("Get farmer details error:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve farmer details.",
    });
  }
};

const hashVerificationCode = (code) =>
  crypto.createHash("sha256").update(code).digest("hex");

// Request a phone verification OTP.
export const requestFarmerPhoneVerification = async (req, res) => {
  try {
    const farmer = await User.findOne({
      _id: req.user._id,
      role: "farmer",
    });

    if (!farmer) {
      return res.status(404).json({
        message: "Farmer account not found.",
      });
    }

    if (!farmer.isActive || !farmer.passwordSet) {
      return res.status(403).json({
        message: "Please activate your account before verifying your phone.",
      });
    }

    if (farmer.phoneVerified) {
      return res.status(400).json({
        message: "Your phone number is already verified.",
      });
    }

    if (!farmer.phone) {
      return res.status(400).json({
        message: "Your account does not have a registered phone number.",
      });
    }

    // Allow one OTP request every 60 seconds.
    const cooldownMs = 60 * 1000;

    if (
      farmer.phoneVerificationLastSentAt &&
      Date.now() - farmer.phoneVerificationLastSentAt.getTime() < cooldownMs
    ) {
      const secondsRemaining = Math.ceil(
        (cooldownMs -
          (Date.now() - farmer.phoneVerificationLastSentAt.getTime())) /
          1000
      );

      return res.status(429).json({
        message: `Please wait ${secondsRemaining} seconds before requesting another code.`,
      });
    }

    // Generate a six-digit OTP.
    const otp = crypto.randomInt(100000, 1000000).toString();

    farmer.phoneVerificationCode = hashVerificationCode(otp);
    farmer.phoneVerificationExpires = new Date(Date.now() + 5 * 60 * 1000);
    farmer.phoneVerificationAttempts = 0;
    farmer.phoneVerificationLastSentAt = new Date();

    await farmer.save();

    // Local testing only. We will replace this with SMS delivery.
    if (process.env.NODE_ENV !== "production") {
      return res.status(200).json({
        message: "Verification code generated. Check the development OTP.",
        ...(process.env.NODE_ENV === "development" && {
          developmentOtp: otp,
        }),
        expiresIn: 300,
      });
    }

    return res.status(503).json({
      message: "SMS delivery has not been configured yet.",
    });
  } catch (error) {
    console.error("Request phone verification error:", error);

    return res.status(500).json({
      message: "Unable to generate a phone verification code.",
    });
  }
};

// Verify the farmer's phone number using the OTP.
export const verifyFarmerPhone = async (req, res) => {
  try {
    const { code } = req.body;

    if (!/^\d{6}$/.test(String(code || ""))) {
      return res.status(400).json({
        message: "Enter a valid six-digit verification code.",
      });
    }

    const farmer = await User.findOne({
      _id: req.user._id,
      role: "farmer",
    }).select("+phoneVerificationCode");

    if (!farmer) {
      return res.status(404).json({
        message: "Farmer account not found.",
      });
    }

    if (farmer.phoneVerified) {
      return res.status(400).json({
        message: "Your phone number is already verified.",
      });
    }

    if (
      !farmer.phoneVerificationCode ||
      !farmer.phoneVerificationExpires
    ) {
      return res.status(400).json({
        message: "Request a verification code first.",
      });
    }

    if (farmer.phoneVerificationExpires.getTime() < Date.now()) {
      farmer.phoneVerificationCode = null;
      farmer.phoneVerificationExpires = null;
      farmer.phoneVerificationAttempts = 0;
      await farmer.save();

      return res.status(400).json({
        message: "Your verification code has expired. Request a new one.",
      });
    }

    if (farmer.phoneVerificationAttempts >= 5) {
      farmer.phoneVerificationCode = null;
      farmer.phoneVerificationExpires = null;
      farmer.phoneVerificationAttempts = 0;
      await farmer.save();

      return res.status(429).json({
        message: "Too many incorrect attempts. Request a new verification code.",
      });
    }

    const submittedHash = hashVerificationCode(String(code));
    const storedHash = farmer.phoneVerificationCode;

    if (submittedHash !== storedHash) {
      farmer.phoneVerificationAttempts += 1;
      await farmer.save();

      return res.status(400).json({
        message: "Incorrect verification code.",
        attemptsRemaining: Math.max(
          0,
          5 - farmer.phoneVerificationAttempts
        ),
      });
    }

    farmer.phoneVerified = true;
    farmer.phoneVerifiedAt = new Date();
    farmer.phoneVerificationCode = null;
    farmer.phoneVerificationExpires = null;
    farmer.phoneVerificationAttempts = 0;

    await farmer.save();

    return res.status(200).json({
      message: "Your phone number has been verified successfully.",
      phoneVerified: farmer.phoneVerified,
      phoneVerifiedAt: farmer.phoneVerifiedAt,
    });
  } catch (error) {
    console.error("Verify farmer phone error:", error);

    return res.status(500).json({
      message: "Unable to verify your phone number.",
    });
  }
};
