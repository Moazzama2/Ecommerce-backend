import { Router } from 'express';
import * as paymentController from './payment.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import { createIntentSchema, verifyPaymentSchema } from './payment.validation.js';

const router = Router();

// Public: the app needs the publishable key before the user signs in
router.get('/config', paymentController.config);

// User routes (protected)
router.post(
  '/intent',
  authMiddleware,
  validate(createIntentSchema),
  paymentController.createIntent,
);

router.post(
  '/verify',
  authMiddleware,
  validate(verifyPaymentSchema),
  paymentController.verify,
);

// NOTE: the webhook route is registered in app.js with express.raw()
// so Stripe's signature can be verified against the untouched body.

export default router;
