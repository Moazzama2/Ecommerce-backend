import { Router } from 'express';
import * as cartController from './cart.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import { addToCartSchema, updateCartItemSchema } from './cart.validation.js';

const router = Router();

// All routes are protected — must be logged in
router.use(authMiddleware);

router.post('/add', validate(addToCartSchema), cartController.addToCart);
router.get('/', cartController.getCart);
router.patch('/:productId', validate(updateCartItemSchema), cartController.updateCartItem);
router.delete('/:productId', cartController.removeFromCart);
router.delete('/', cartController.clearCart);
export default router;