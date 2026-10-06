import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    refreshToken: { type: String, default: null },
    // user.model.js — add this field
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    // Admins can disable an account from the dashboard; disabled users
    // are rejected at login AND at token refresh (kills live sessions).
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);