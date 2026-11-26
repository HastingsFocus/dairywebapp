import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      default: null,
    },

    role: {
      type: String,
      enum: ["admin", "owner", "buyer", "farmer"],
      required: true,
    },

    fullName: {
      type: String,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
      required: function () {
        return this.role === "farmer";
      },
    },

    phoneVerified: {
      type: Boolean,
      default: false,
    },

    phoneVerifiedAt: {
      type: Date,
      default: null,
    },

    // Phone verification fields
    phoneVerificationCode: {
      type: String,
      default: null,
    },

    phoneVerificationExpires: {
      type: Date,
      default: null,
    },

    phoneVerificationAttempts: {
      type: Number,
      default: 0,
    },

    phoneVerificationLastSentAt: {
      type: Date,
      default: null,
    },

    // USSD authentication fields - used in a later phase
    ussdPin: {
  type: String,
  default: null,
  select: false,
},

ussdPinSet: {
  type: Boolean,
  default: false,
},

ussdPinAttempts: {
  type: Number,
  default: 0,
},

ussdPinLockedUntil: {
  type: Date,
  default: null,
},

    location: {
      type: String,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: false,
    },

    passwordSet: {
      type: Boolean,
      default: false,
    },

    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Phone numbers must be unique among farmer accounts.
userSchema.index(
  { phone: 1 },
  {
    unique: true,
    partialFilterExpression: {
      role: "farmer",
      phone: { $type: "string" },
    },
  }
);

const User = mongoose.model("User", userSchema);

export default User;