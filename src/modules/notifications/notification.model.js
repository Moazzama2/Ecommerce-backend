import mongoose from 'mongoose';

// ============================================================
// NOTIFICATIONS — one document per event shown in the in-app feed.
//
// `data.orderId` is what lets a tap deep-link straight to the order
// details screen. Nothing here is ever the source of truth for the
// order itself — it is a copy written for display only.
// ============================================================
const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['order_status', 'payment', 'announcement'],
      default: 'order_status',
    },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    data: {
      orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
      orderStatus: { type: String },
      paymentStatus: { type: String },
      _id: false,
    },
    read: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Newest-first feed for a single user.
notificationSchema.index({ userId: 1, createdAt: -1 });

// Unread badge count — only unread documents are indexed.
notificationSchema.index(
  { userId: 1, read: 1 },
  { partialFilterExpression: { read: false } }
);

export default mongoose.model('Notification', notificationSchema);
