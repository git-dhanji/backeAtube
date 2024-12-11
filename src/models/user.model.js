import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, "Invalid email"] },
    fullName: { type: String, required: true, trim: true, index: true },
    avatar: { type: String, required: true }, // Cloudinary URL
    coverImage: { type: String }, // Optional Cloudinary URL
    password: { type: String, required: true, minlength: 6 },
    refreshToken: { type: String },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods = {
  isPasswordCorrect(password) {
    return bcrypt.compare(password, this.password);
  },
  generateAccessToken() {
    return jwt.sign(
      { _id: this._id, email: this.email, username: this.username, fullName: this.fullName },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
  },
  generateRefreshToken() {
    return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    });
  },
};

export const User = mongoose.model("User", userSchema);
