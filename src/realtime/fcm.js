import { readFileSync } from 'node:fs';
import admin from 'firebase-admin';
// firebase-admin ≥12 dropped the namespace API (`admin.credential` /
// `admin.messaging()`); credentials live on the root export and messaging
// behind its own subpath.
import { getMessaging } from 'firebase-admin/messaging';
import logger from '../utils/logger.js';
import DeviceToken from '../modules/notifications/device_token.model.js';

// ============================================================
// FCM — push for background / killed app.
//
// SCAFFOLD: nothing here runs until you configure Firebase (see
// FIREBASE_SETUP.md). Until then `messaging` stays null, every send is
// a no-op, and the app keeps working exactly like the REST-only version.
//
// Delivery split:
//   socket open (app alive)  → socket.io delivers instantly
//   app in background/killed → FCM shows the system notification
// The server can't tell which state the phone is in, so it does both and
// the client de-duplicates by notification `_id`.
// ============================================================

let messaging = null;
let initialized = false;

const parseServiceAccount = (raw) => {
  const trimmed = raw.trim();

  // A filesystem path (…/service-account.json) or the JSON itself.
  if (trimmed.startsWith('{')) return JSON.parse(trimmed);
  return JSON.parse(readFileSync(trimmed, 'utf8'));
};

export const initFcm = () => {
  if (initialized) return messaging;
  initialized = true;

  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (raw) {
      const serviceAccount = parseServiceAccount(raw);
      admin.initializeApp({
        credential: admin.cert(serviceAccount),
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Standard Google wiring — path comes from the env var itself.
      admin.initializeApp({
        credential: admin.applicationDefault(),
      });
    } else {
      logger.info(
        'FCM disabled: set FIREBASE_SERVICE_ACCOUNT (or GOOGLE_APPLICATION_CREDENTIALS) to enable push. See FIREBASE_SETUP.md',
      );
      return null;
    }

    messaging = getMessaging();
    logger.info('FCM enabled — push notifications are live');
  } catch (error) {
    messaging = null;
    logger.warn(`FCM init failed, push disabled: ${error.message}`);
  }

  return messaging;
};

export const isFcmEnabled = () => Boolean(messaging);

/** Dead tokens are dropped so they stop being targeted. */
const pruneToken = async (token, reason) => {
  try {
    await DeviceToken.deleteOne({ token });
    logger.info(`FCM: removed invalid device token (${reason})`);
  } catch (error) {
    logger.warn(`FCM: could not remove device token: ${error.message}`);
  }
};

/**
 * Send to every device registered for a user.
 * Returns `{ sent, failed }` and never throws — a push failure must not
 * break the operation that triggered the notification.
 */
export const sendPushToUser = async ({ userId, title, body, data = {} }) => {
  if (!userId) return { sent: 0, failed: 0 };

  const sdk = messaging ?? initFcm();
  if (!sdk) return { sent: 0, failed: 0, skipped: true };

  let tokens;
  try {
    const devices = await DeviceToken.find({ userId }).select('token').lean();
    tokens = devices.map((device) => device.token).filter(Boolean);
  } catch (error) {
    logger.warn(`FCM: could not read device tokens: ${error.message}`);
    return { sent: 0, failed: 0 };
  }

  if (!tokens.length) return { sent: 0, failed: 0, skipped: true };

  // FCM data values must be strings.
  const stringData = Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)]),
  );

  try {
    const response = await sdk.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: stringData,
      android: {
        priority: 'high',
        notification: {
          channelId: 'order_updates',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
    });

    response.responses.forEach((result, index) => {
      const error = result.error;
      if (!error) return;

      const code = error.code || '';
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        pruneToken(tokens[index], code);
      } else {
        logger.warn(`FCM: send failed (${code}): ${error.message}`);
      }
    });

    return { sent: response.successCount, failed: response.failureCount };
  } catch (error) {
    logger.warn(`FCM: send error: ${error.message}`);
    return { sent: 0, failed: tokens.length };
  }
};
