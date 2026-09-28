import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import userRoutes from './modules/users/user.routes.js';
import productRoutes from './modules/products/product.route.js';
import errorMiddleware from './middlewares/error.middleware.js';
import categoryRoutes from './modules/category/category.routes.js';
import cartRoutes from './modules/carts/cart.routes.js';
import orderRoutes from './modules/orders/order.routes.js';
import paymentRoutes from './modules/payments/payment.routes.js';
import { webhook as stripeWebhook } from './modules/payments/payment.controller.js';
import logger, { morganStream } from './utils/logger.js';

const app = express();

// ============================================================
// LOGGING (morgan -> winston)
// Logs every API request: method, url (+ query), status, time.
// ============================================================
app.use(
  morgan(':method :url :status :response-time ms - :res[content-length] bytes - :remote-addr', {
    stream: morganStream,
  })
);

// ============================================================
// STRIPE WEBHOOK — must run BEFORE express.json()
//
// Stripe signs the *raw* body; JSON-parsing it first would break
// signature verification ("Invalid webhook signature").
// ============================================================
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorMiddleware); // must be last

export default app;