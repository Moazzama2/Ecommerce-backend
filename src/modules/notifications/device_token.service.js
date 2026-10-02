import ApiError from '../../utils/ApiError.js';
import DeviceToken from './device_token.model.js';

// ============================================================
// DEVICE TOKEN SERVICE — registration for FCM push.
//
// The app registers on startup and whenever FCM mints a new token, so
// upsert-by-token is idempotent: hitting this endpoint on every launch
// never creates duplicates.
// ============================================================

const MAX_DEVICES_PER_USER = 6;

export const registerDevice = async (userId, { token, platform = 'android' }) => {
  const trimmed = (token ?? '').trim();
  if (!trimmed) throw new ApiError(400, 'Device token is required');

  // A token follows the account that owns the device (reinstall, second
  // login) — reassign instead of failing on the unique index.
  await DeviceToken.updateOne(
    { token: trimmed },
    { $set: { userId, platform, lastSeenAt: new Date() } },
    { upsert: true }
  );

  // Keep the list bounded: keep the most recently seen devices only.
  const devices = await DeviceToken.find({ userId })
    .sort({ lastSeenAt: -1 })
    .select('_id')
    .lean();

  if (devices.length > MAX_DEVICES_PER_USER) {
    const stale = devices.slice(MAX_DEVICES_PER_USER).map((device) => device._id);
    await DeviceToken.deleteMany({ _id: { $in: stale } });
  }

  const deviceCount = await DeviceToken.countDocuments({ userId });

  return { token: trimmed, deviceCount };
};

export const unregisterDevice = async (userId, token) => {
  const trimmed = (token ?? '').trim();
  if (!trimmed) throw new ApiError(400, 'Device token is required');

  const result = await DeviceToken.deleteOne({ userId, token: trimmed });

  return { removed: result.deletedCount > 0 };
};
