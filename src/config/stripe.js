import Stripe from 'stripe';
import ApiError from '../utils/ApiError.js';

// ============================================================
// STRIPE CLIENT
//
// The secret key NEVER leaves the backend — the Flutter app only ever
// receives the publishable key (see /api/payments/config).
//
// The client is created lazily so the rest of the API (browsing, cart,
// cash-on-delivery orders) keeps working when the keys are missing.
// ============================================================

const secretKey = process.env.STRIPE_SECRET_KEY?.trim() || '';

export const isStripeConfigured = secretKey.length > 0;

/** Returns the shared Stripe client, or fails fast with a clear message. */
export const requireStripe = () => {
  if (!isStripeConfigured) {
    throw new ApiError(
      503,
      'Online payments are not configured (missing STRIPE_SECRET_KEY).',
    );
  }
  return new Stripe(secretKey);
};

/** Stripe currency in minor units, e.g. PKR 149999 → 14999900. */
export const stripeCurrency = (process.env.STRIPE_CURRENCY || 'pkr').toLowerCase();

/** Converts a major-unit amount (149999.00) to Stripe minor units. */
export const toMinorUnits = (amount) => Math.round(Number(amount) * 100);
