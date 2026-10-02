import ApiError from '../../utils/ApiError.js';
import logger from '../../utils/logger.js';
import * as notificationRepository from './notification.repository.js';
import { pushToUser } from '../../realtime/socket.js';
import { sendPushToUser } from '../../realtime/fcm.js';

// ============================================================
// NOTIFICATIONS
//
// Two halves:
//   1. WRITE  — `notifyOrderStatusChanged` / `notifyPaymentReceived`
//      are called by the orders/payments services right after the DB
//      write succeeds. Both are fire-and-forget safe: a failed
//      notification NEVER fails the order operation that triggered it.
//   2. READ   — list / unread count / mark read, for the app's feed.
// ============================================================

// Shown to the user; `ref` is the short order reference (#1A2B3C4D).
const ORDER_STATUS_MESSAGES = {
  pending: (ref) => ({
    title: 'Order placed',
    body: `We have received your order #${ref}.`,
  }),
  processing: (ref) => ({
    title: 'Order confirmed',
    body: `Your order #${ref} is being prepared.`,
  }),
  shipped: (ref) => ({
    title: 'Order shipped',
    body: `Your order #${ref} is on its way to you.`,
  }),
  delivered: (ref) => ({
    title: 'Order delivered',
    body: `Your order #${ref} has been delivered. Enjoy!`,
  }),
  cancelled: (ref) => ({
    title: 'Order cancelled',
    body: `Your order #${ref} has been cancelled.`,
  }),
};

const PAYMENT_MESSAGE = (ref) => ({
  title: 'Payment received',
  body: `We received your payment for order #${ref}.`,
});

/** `64f0a1b2c3d4e5f6a7b8c9d0` → `64F0A1B2`. */
const orderReference = (orderId) =>
  (orderId?.toString() ?? '').substring(0, 8).toUpperCase();

/**
 * Persists the notification and fans it out to the live channels.
 *
 *  - socket.io → the app's feed/badge, instantly, while it's open
 *  - FCM       → the system tray, when the app is backgrounded/killed
 *
 * The client de-duplicates by `_id`, because the server cannot know which
 * state the phone is in — so both fire whenever possible. Every failure
 * here is swallowed and logged: a notification must never break the
 * operation that triggered it.
 */
const persist = async (notification) => {
  try {
    const doc = await notificationRepository.create(notification);

    // Live channels — independent of each other and of REST.
    pushToUser(doc.userId, 'notification:new', doc);

    sendPushToUser({
      userId: doc.userId,
      title: doc.title,
      body: doc.body,
      data: {
        notificationId: doc._id,
        type: doc.type,
        orderId: doc.data?.orderId,
        orderStatus: doc.data?.orderStatus,
      },
    }).catch((error) => logger.warn(`FCM push failed: ${error.message}`));

    return doc;
  } catch (error) {
    logger.warn(`Notification not saved for user ${notification.userId}: ${error.message}`);
    return null;
  }
};

// ============================================================
// WRITE — called from order.service / payment.service
// ============================================================

/** Emit after any order status transition (admin update, cancel, place). */
export const notifyOrderStatusChanged = async (order) => {
  if (!order) return null;

  const build = ORDER_STATUS_MESSAGES[order.status];
  if (!build) return null;

  const ref = orderReference(order._id);
  const { title, body } = build(ref);

  return persist({
    userId: order.userId,
    type: 'order_status',
    title,
    body,
    data: {
      orderId: order._id,
      orderStatus: order.status,
      paymentStatus: order.paymentStatus,
    },
  });
};

/**
 * Emit ONLY on the unpaid → paid transition. `markPaid` is idempotent
 * (webhook + verify endpoint can both fire), so the caller must check
 * the previous paymentStatus first or the user gets duplicate alerts.
 */
export const notifyPaymentReceived = async (order) => {
  if (!order || order.paymentStatus !== 'paid') return null;

  const ref = orderReference(order._id);
  const { title, body } = PAYMENT_MESSAGE(ref);

  return persist({
    userId: order.userId,
    type: 'payment',
    title,
    body,
    data: {
      orderId: order._id,
      orderStatus: order.status,
      paymentStatus: order.paymentStatus,
    },
  });
};

// ============================================================
// READ — GET /api/notifications (+ unread count)
// ============================================================
export const getNotifications = async (userId, { page = 1, limit = 20 } = {}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));
  const skip = (safePage - 1) * safeLimit;

  const [notifications, total, unreadCount] = await Promise.all([
    notificationRepository.findByUserId(userId, { skip, limit: safeLimit }),
    notificationRepository.countByUserId(userId),
    notificationRepository.countUnread(userId),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      total,
      page: safePage,
      pages: Math.ceil(total / safeLimit),
      limit: safeLimit,
    },
  };
};

export const getUnreadCount = (userId) => notificationRepository.countUnread(userId);

// ============================================================
// READ — mark one / mark all as read
// ============================================================
export const markAsRead = async (userId, notificationId) => {
  // Only flips documents that are still unread...
  const updated = await notificationRepository.markAsRead(notificationId, userId);
  const unreadCount = await notificationRepository.countUnread(userId);

  if (updated) return { notification: updated, unreadCount };

  // ...so a null here means "already read" OR "not yours / missing".
  const existing = await notificationRepository.findByIdForUser(notificationId, userId);
  if (!existing) throw new ApiError(404, 'Notification not found');

  return { notification: existing, unreadCount };
};

export const markAllAsRead = async (userId) => {
  await notificationRepository.markAllAsRead(userId);
  return { unreadCount: 0 };
};
