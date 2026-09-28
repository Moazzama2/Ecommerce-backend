import Joi from 'joi';

// POST /api/payments/intent
export const createIntentSchema = Joi.object({
  orderId: Joi.string().trim().min(1).required(),
});

// POST /api/payments/verify
export const verifyPaymentSchema = Joi.object({
  intentId: Joi.string().trim().min(1).required(),
});
