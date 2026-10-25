import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, default: null },
    role: { type: String, enum: ["admin", "owner", "buyer", "farmer"], required: true },
    fullName: { type: String, trim: true },
    phone: { type: String, trim: true },
    location: { type: String, trim: true },
    isActive: { type: Boolean, default: false },
    passwordSet: { type: Boolean, default: false },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;