import { Router } from 'express';
import * as orderController from './order.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import isAdmin from '../../middlewares/isAdmin.middleware.js';
import validate, { validateQuery } from '../../middlewares/validate.middleware.js';
import { placeOrderSchema, updateOrderStatusSchema, getAllOrdersQuerySchema } from './order.validation.js';

const router = Router();

// User routes (protected)
router.post('/', authMiddleware, validate(placeOrderSchema), orderController.placeOrder);
router.get('/', authMiddleware, orderController.getUserOrders);
router.get('/:id', authMiddleware, orderController.getOrderById);
router.patch('/:id/cancel', authMiddleware, orderController.cancelOrder);

// Admin routes
router.get('/admin/all', authMiddleware, isAdmin, validateQuery(getAllOrdersQuerySchema), orderController.getAllOrders);
// Placed after /admin/all; /:id above is a single segment, so no clash.
router.get('/admin/:id', authMiddleware, isAdmin, orderController.getAnyOrderById);
router.patch('/:id/status', authMiddleware, isAdmin, validate(updateOrderStatusSchema), orderController.updateOrderStatus);

export default router;