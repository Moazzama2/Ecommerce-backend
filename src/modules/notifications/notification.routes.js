import { Router } from 'express';
import * as notificationController from './notification.controller.js';
import * as deviceTokenController from './device_token.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import isAdmin from '../../middlewares/isAdmin.middleware.js';
import validate, { validateQuery } from '../../middlewares/validate.middleware.js';
import { adminListQuerySchema, broadcastSchema } from './notification.validation.js';

const router = Router();

// Every route is scoped to the signed-in user (req.user.id).
router.get('/', authMiddleware, notificationController.getNotifications);
router.get('/unread-count', authMiddleware, notificationController.getUnreadCount);
router.patch('/read-all', authMiddleware, notificationController.markAllAsRead);
router.patch('/:id/read', authMiddleware, notificationController.markAsRead);

// FCM device registration (used by the live-push layer).
router.post('/devices', authMiddleware, deviceTokenController.registerDevice);
router.delete('/devices', authMiddleware, deviceTokenController.unregisterDevice);

// Admin (dashboard) — log of every notification + send an announcement.
// Mounted before '/:id/read'-style routes can't clash, but keeps the
// admin surface in one block.
router.get('/admin/all', authMiddleware, isAdmin, validateQuery(adminListQuerySchema), notificationController.adminList);
router.post('/broadcast', authMiddleware, isAdmin, validate(broadcastSchema), notificationController.broadcast);

export default router;
