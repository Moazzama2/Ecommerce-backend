import { Router } from 'express';
import * as userController from './user.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import { signupSchema, loginSchema, changePasswordSchema, updateProfileSchema } from './user.validation.js';
const router = Router();

router.post('/signup', validate(signupSchema), userController.signup);
router.post('/login', validate(loginSchema), userController.login);
router.post('/change-password', authMiddleware, validate(changePasswordSchema), userController.changePassword);

router.get('/view', authMiddleware, userController.getProfile);
router.patch('/update', authMiddleware, validate(updateProfileSchema), userController.updateProfile);
router.delete('/delete', authMiddleware, userController.deleteAccount);
export default router;