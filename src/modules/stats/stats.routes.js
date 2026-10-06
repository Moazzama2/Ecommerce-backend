import { Router } from 'express';
import * as statsController from './stats.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import isAdmin from '../../middlewares/isAdmin.middleware.js';
import Joi from 'joi';
import { validateQuery } from '../../middlewares/validate.middleware.js';

const router = Router();

const overviewQuerySchema = Joi.object({
  days: Joi.number().min(7).max(90).default(30),
});

// Dashboard overview: totals, chart series, recent orders, best sellers.
router.get(
  '/overview',
  authMiddleware,
  isAdmin,
  validateQuery(overviewQuerySchema),
  statsController.getOverview,
);

export default router;
