import { Router } from 'express';
import * as userController from './user.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import isAdmin from '../../middlewares/isAdmin.middleware.js';
import validate, { validateQuery } from '../../middlewares/validate.middleware.js';
import {
  signupSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
  refreshSchema,
  adminListUsersSchema,
  adminRoleSchema,
  adminStatusSchema,
} from './user.validation.js';

const router = Router();

router.post('/signup', validate(signupSchema), userController.signup);
router.post('/login', validate(loginSchema), userController.login);
// No authMiddleware: this endpoint is *for* renewing a dead access token.
router.post('/refresh', validate(refreshSchema), userController.refreshSession);
router.post('/logout', authMiddleware, userController.logout);
router.post('/change-password', authMiddleware, validate(changePasswordSchema), userController.changePassword);

router.get('/view', authMiddleware, userController.getProfile);
router.patch('/update', authMiddleware, validate(updateProfileSchema), userController.updateProfile);
router.delete('/delete', authMiddleware, userController.deleteAccount);

// Admin (dashboard) — user management
router.get('/admin/all', authMiddleware, isAdmin, validateQuery(adminListUsersSchema), userController.adminListUsers);
router.patch('/admin/:id/role', authMiddleware, isAdmin, validate(adminRoleSchema), userController.adminUpdateRole);
router.patch('/admin/:id/status', authMiddleware, isAdmin, validate(adminStatusSchema), userController.adminSetStatus);

export default router;
