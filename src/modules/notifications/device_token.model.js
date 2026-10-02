import mongoose from 'mongoose';

// ============================================================
// DEVICE TOKENS — FCM registration ids, one document per device.
//
// The app POSTs its token whenever it starts (and whenever FCM mints a
// new one). Push is skipped entirely for users with no tokens, so a
// backend with FCM not configured still behaves exactly like before.
// ============================================================
const deviceTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true, // one row per device, even if two users share it once
    },
    platform: {
      type: String,
      enum: ['android', 'ios', 'web'],
      default: 'android',
    },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('DeviceToken', deviceTokenSchema);
