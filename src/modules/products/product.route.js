import { Router } from 'express';
import * as productController from './product.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import isAdmin from '../../middlewares/isAdmin.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import { createProductSchema, updateProductSchema } from './product.validation.js';

const router = Router();

router.get('/all', productController.getAll);
router.get('/:id/:name', productController.getById);
router.post('/create', authMiddleware, isAdmin, validate(createProductSchema), productController.create);
router.patch('/update', authMiddleware, isAdmin, validate(updateProductSchema), productController.update);
router.delete('/remove/:id', authMiddleware, isAdmin, productController.remove);

export default router;