import { Router } from 'express';
import * as categoryController from './category.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import isAdmin from '../../middlewares/isAdmin.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import { createCategorySchema, updateCategorySchema } from './category.validation.js';

const router = Router();

router.get('/', categoryController.getAll); // public
router.get('/:id', categoryController.getById); // public
router.get('/:id/breadcrumb', categoryController.getBreadcrumb); // public
router.post('/', authMiddleware, isAdmin, validate(createCategorySchema), categoryController.create);
router.patch('/:id', authMiddleware, isAdmin, validate(updateCategorySchema), categoryController.update);
router.delete('/:id', authMiddleware, isAdmin, categoryController.remove);
router.get('/:id/details', categoryController.getCategoryWithDetails); // public
export default router;