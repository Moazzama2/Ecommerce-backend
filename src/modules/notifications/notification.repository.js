import Notification from './notification.model.js';

export const create = (data) => Notification.create(data);

export const findByUserId = (userId, { skip = 0, limit = 20 } = {}) =>
  Notification.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

export const countByUserId = (userId) => Notification.countDocuments({ userId });

export const countUnread = (userId) =>
  Notification.countDocuments({ userId, read: false });

export const findByIdForUser = (id, userId) =>
  Notification.findOne({ _id: id, userId });

// Scoped by userId too — a user can never mark someone else's
// notification as read, even by guessing ids.
export const markAsRead = (id, userId) =>
  Notification.findOneAndUpdate(
    { _id: id, userId, read: false },
    { $set: { read: true, readAt: new Date() } },
    { new: true }
  );

export const markAllAsRead = (userId) =>
  Notification.updateMany(
    { userId, read: false },
    { $set: { read: true, readAt: new Date() } }
  );

// ---------- Admin (dashboard) ----------

// Newest-first across ALL users (populated with the recipient).
export const findAllWithFilter = ({ skip = 0, limit = 20 } = {}) =>
  Notification.find()
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

export const countAll = () => Notification.countDocuments();

export const createMany = (docs) => Notification.insertMany(docs);
