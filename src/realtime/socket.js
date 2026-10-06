import { Server } from 'socket.io';
import logger from '../utils/logger.js';
import { verifyAccessToken } from '../utils/token.js';

// ============================================================
// WEBSOCKET — live delivery of notifications
//
// One socket per signed-in user, joined to the room `user:{id}`.
// Pushes originate from a single place: `persist()` in
// notification.service.js, which fires:
//
//     notification:new   → the full notification document
//
// REST is unchanged: it still powers the initial feed, the badge and
// everything that happens while the socket is down (polling fallback).
// ============================================================

let io = null;

const roomFor = (userId) => `user:${userId}`;
// Every signed-in admin joins this room; the dashboard listens here for
// live order events (see pushToAdmins below).
const ADMIN_ROOM = 'admins';

/**
 * Reads the token from `socket.handshake.auth.token` (the Flutter client
 * sends `{ auth: { token } }`), falls back to the Authorization header.
 */
const extractToken = (socket) => {
  const auth = socket.handshake.auth || {};
  if (auth.token) return auth.token;

  const header = socket.handshake.headers?.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return null;
};

const authenticate = (socket, next) => {
  const token = extractToken(socket);
  if (!token) return next(new Error('unauthorized'));

  try {
    const decoded = verifyAccessToken(token);
    socket.userId = decoded.id;
    socket.role = decoded.role; // 'admin' → joined to the admins room
    socket.tokenExp = decoded.exp; // seconds → used to drop dead sessions
    return next();
  } catch {
    return next(new Error('unauthorized'));
  }
};

/**
 * A socket must not outlive its credentials: once the 15-minute access
 * token expires we drop the connection so the client reconnects with a
 * fresh one (it already holds one after every silent refresh).
 */
const scheduleExpiry = (socket) => {
  if (!socket.tokenExp) return;

  const msLeft = socket.tokenExp * 1000 - Date.now();
  const delay = Math.max(msLeft, 0) + 5_000; // 5s grace for clock skew

  const timer = setTimeout(() => {
    socket.disconnect(true);
  }, delay);

  socket.on('disconnect', () => clearTimeout(timer));
};

export const initSocket = (httpServer, corsOptions = {}) => {
  if (io) return io;

  io = new Server(httpServer, {
    cors: corsOptions,
    // Mobile clients hold the socket open in the background; pings keep
    // intermediate proxies from reaping it.
    pingInterval: 25_000,
    pingTimeout: 20_000,
  });

  io.use(authenticate);

  io.on('connection', (socket) => {
    const { userId } = socket;

    socket.join(roomFor(userId));
    if (socket.role === 'admin') socket.join(ADMIN_ROOM);
    scheduleExpiry(socket);

    logger.info(`Socket connected for user ${userId} (${socket.id})`);

    socket.on('disconnect', (reason) => {
      logger.debug(`Socket disconnected for user ${userId}: ${reason}`);
    });
  });

  logger.info('WebSocket server initialized');
  return io;
};

/**
 * Fire-and-forget emit to every socket a user currently has open.
 * Returns false when the server isn't running sockets (e.g. tests) or
 * nobody is connected — callers must treat that as "no live delivery",
 * never as an error.
 */
export const pushToUser = (userId, event, payload) => {
  if (!io || !userId) return false;

  try {
    io.to(roomFor(userId)).emit(event, payload);
    return true;
  } catch (error) {
    logger.warn(`Socket emit failed for user ${userId}: ${error.message}`);
    return false;
  }
};

/**
 * Fire-and-forget emit to every connected admin (the dashboard).
 * Same contract as pushToUser: never throws, false = no live delivery.
 */
export const pushToAdmins = (event, payload) => {
  if (!io) return false;

  try {
    io.to(ADMIN_ROOM).emit(event, payload);
    return true;
  } catch (error) {
    logger.warn(`Socket emit to admins failed: ${error.message}`);
    return false;
  }
};

export const isSocketReady = () => Boolean(io);

export const getIO = () => io;
