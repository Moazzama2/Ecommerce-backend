import asyncHandler from '../../utils/asyncHandler.js';
import * as notificationService from './notification.service.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getNotifications(req.user.id, {
    page: req.query.page,
    limit: req.query.limit,
  });
  res.status(200).json({ success: true, data: result });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await notificationService.getUnreadCount(req.user.id);
  res.status(200).json({ success: true, data: { unreadCount } });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAsRead(req.user.id, req.params.id);
  res.status(200).json({ success: true, data: result });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user.id);
  res.status(200).json({ success: true, data: result });
});

// ============================================================
// ADMIN (dashboard) — notification log + broadcast an announcement
// ============================================================
export const adminList = asyncHandler(async (req, res) => {
  const result = await notificationService.adminListNotifications(req.query);
  res.status(200).json({ success: true, data: result });
});

export const broadcast = asyncHandler(async (req, res) => {
  const result = await notificationService.broadcastAnnouncement(req.body);
  res.status(201).json({ success: true, data: result });
});
