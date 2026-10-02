import ApiError from '../../utils/ApiError.js';
import logger from '../../utils/logger.js';
import {
  requireStripe,
  isStripeConfigured,
  stripeCurrency,
  toMinorUnits,
} from '../../config/stripe.js';
import * as orderRepository from '../orders/order.repository.js';
import { notifyPaymentReceived } from '../notifications/notification.service.js';

// ============================================================
// PAYMENTS — Stripe PaymentIntents
//
// Flow:  order is created first (status=pending, paymentStatus=unpaid)
//   1. POST /api/payments/intent  → PaymentIntent for the ORDER'S amount
//   2. app confirms it with the Stripe PaymentSheet
//   3. POST /api/payments/verify  → instant UI feedback
//   4. webhook payment_intent.succeeded → source of truth for "paid"
//
// The amount ALWAYS comes from the stored order — never from the client.
// ============================================================

const PAYABLE_STATUSES = ['pending', 'processing'];

/** Publishable key + currency for the mobile app (no secrets here). */
export const getClientConfig = () => ({
  enabled: isStripeConfigured && Boolean(process.env.STRIPE_PUBLISHABLE_KEY?.trim()),
  publishableKey: (process.env.STRIPE_PUBLISHABLE_KEY || '').trim(),
  currency: stripeCurrency,
});

const assertOrderPayable = (order, userId) => {
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.userId.toString() !== String(userId)) {
    throw new ApiError(403, 'This order does not belong to you.');
  }
  if (order.paymentStatus === 'paid') {
    throw new ApiError(400, 'This order is already paid.');
  }
  if (!PAYABLE_STATUSES.includes(order.status)) {
    throw new ApiError(400, 'This order can no longer be paid.');
  }
  if (!(Number(order.totalAmount) > 0)) {
    throw new ApiError(400, 'Order total must be greater than zero.');
  }
};

// ============================================================
// markPaid + "Payment received" notification.
//
// markPaid is idempotent and can be reached from two places for the
// same charge (webhook AND /payments/verify), so the notification is
// only emitted on the real unpaid → paid transition.
// ============================================================
const markPaidAndNotify = async (orderId, paymentIntentId) => {
  if (!orderId) return null;

  const existing = await orderRepository.findByIdLean(orderId);
  const alreadyPaid = existing?.paymentStatus === 'paid';

  const order = await orderRepository.markPaid(orderId, paymentIntentId);

  if (!alreadyPaid && order) {
    await notifyPaymentReceived(order);
  }

  return order;
};

// ============================================================
// 1. CREATE PAYMENT INTENT — POST /api/payments/intent
// ============================================================
export const createPaymentIntent = async (userId, { orderId }) => {
  const stripe = requireStripe();

  const order = await orderRepository.findById(orderId);
  assertOrderPayable(order, userId);

  // Same idempotency key per order → retries return the same intent
  // instead of creating (and charging) twice.
  const intent = await stripe.paymentIntents.create(
    {
      amount: toMinorUnits(order.totalAmount),
      currency: stripeCurrency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderId: String(order._id),
        userId: String(userId),
      },
    },
    { idempotencyKey: `order_${order._id}` },
  );

  // The charge already went through (e.g. webhook not processed yet).
  if (intent.status === 'succeeded') {
    await markPaidAndNotify(String(order._id), intent.id);
    throw new ApiError(400, 'This order is already paid.');
  }

  return {
    intentId: intent.id,
    clientSecret: intent.client_secret,
    amount: order.totalAmount,
    currency: stripeCurrency,
  };
};

// ============================================================
// 2. VERIFY — POST /api/payments/verify
//
// Only for instant UI feedback after PaymentSheet closes. The webhook
// remains the authority for marking an order paid.
// ============================================================
export const verifyPayment = async (userId, { intentId }) => {
  const stripe = requireStripe();

  const intent = await stripe.paymentIntents.retrieve(intentId);

  const metadata = intent.metadata || {};
  if (metadata.userId !== String(userId)) {
    throw new ApiError(403, 'This payment does not belong to you.');
  }

  const orderId = metadata.orderId;

  if (intent.status === 'succeeded') {
    const order = await markPaidAndNotify(orderId, intent.id);
    return {
      orderId,
      paymentIntentId: intent.id,
      status: intent.status,
      paymentStatus: order?.paymentStatus ?? 'paid',
    };
  }

  const order = orderId ? await orderRepository.findById(orderId) : null;

  return {
    orderId: orderId ?? null,
    paymentIntentId: intent.id,
    status: intent.status,
    paymentStatus: order?.paymentStatus ?? 'unpaid',
    lastError: intent.last_payment_error?.message ?? null,
  };
};

// ============================================================
// 3. WEBHOOK — POST /api/payments/webhook (raw body + signature)
// ============================================================
export const handleWebhook = async (rawBody, signature) => {
  const stripe = requireStripe();
  const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();

  if (!webhookSecret) {
    throw new ApiError(503, 'Webhook secret is not configured.');
  }
  if (!signature) {
    throw new ApiError(400, 'Missing Stripe-Signature header.');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );
  } catch (error) {
    logger.error(`Stripe webhook signature verification failed: ${error.message}`);
    throw new ApiError(400, 'Invalid webhook signature.');
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const intent = event.data.object;
      const orderId = intent.metadata?.orderId;
      if (orderId) {
        await markPaidAndNotify(orderId, intent.id);
        logger.info(
          `Stripe: order ${orderId} marked paid (intent ${intent.id}, ${intent.amount} ${intent.currency})`,
        );
      } else {
        logger.warn(`Stripe: payment_intent ${intent.id} has no orderId metadata`);
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const intent = event.data.object;
      const orderId = intent.metadata?.orderId;
      logger.warn(
        `Stripe: payment failed for order ${orderId ?? 'unknown'} — ` +
          `${intent.last_payment_error?.message ?? 'no details'}`,
      );
      // The order stays unpaid; the app offers "Retry" or "Cancel order".
      break;
    }

    default:
      logger.debug(`Stripe: ignored event ${event.type}`);
  }

  return { received: true };
};
