import asyncHandler from '../../utils/asyncHandler.js';
import * as paymentService from './payment.service.js';

// GET /api/payments/config — publishable key + currency (never the secret)
export const config = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: paymentService.getClientConfig() });
});

// POST /api/payments/intent — { orderId } → { clientSecret, ... }
export const createIntent = asyncHandler(async (req, res) => {
  const data = await paymentService.createPaymentIntent(req.user.id, req.body);
  res.status(201).json({ success: true, data });
});

// POST /api/payments/verify — { intentId } → payment state for the UI
export const verify = asyncHandler(async (req, res) => {
  const data = await paymentService.verifyPayment(req.user.id, req.body);
  res.status(200).json({ success: true, data });
});

// POST /api/payments/webhook — Stripe calls this with a signed raw body.
// MUST be routed with express.raw() BEFORE express.json() (see app.js).
export const webhook = asyncHandler(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const data = await paymentService.handleWebhook(req.body, signature);
  res.status(200).json({ success: true, data });
});
