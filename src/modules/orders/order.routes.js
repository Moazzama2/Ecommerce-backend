import { Router } from 'express';
import * as orderController from './order.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import isAdmin from '../../middlewares/isAdmin.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import { placeOrderSchema, updateOrderStatusSchema } from './order.validation.js';

const router = Router();

// User routes (protected)
router.post('/', authMiddleware, validate(placeOrderSchema), orderController.placeOrder);
router.get('/', authMiddleware, orderController.getUserOrders);
router.get('/:id', authMiddleware, orderController.getOrderById);
router.patch('/:id/cancel', authMiddleware, orderController.cancelOrder);

// Admin routes
router.get('/admin/all', authMiddleware, isAdmin, orderController.getAllOrders);
router.patch('/:id/status', authMiddleware, isAdmin, validate(updateOrderStatusSchema), orderController.updateOrderStatus);

export default router;