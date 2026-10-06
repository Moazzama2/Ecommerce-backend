import bcrypt from 'bcrypt';
import ApiError from '../../utils/ApiError.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/token.js';
import * as userRepository from './user.repository.js';

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  // The dashboard needs the role for its route guards and the profile
  // menu; the Flutter app can ignore both.
  role: user.role,
  isActive: user.isActive !== false,
  createdAt: user.createdAt,
});

export const signup = async ({ name, email, password }) => {
  const existing = await userRepository.findByEmail(email);
  if (existing) throw new ApiError(409, 'Email already registered');

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await userRepository.create({ name, email, password: hashedPassword });

  return sanitizeUser(user);
};

export const login = async ({ email, password }) => {
  const user = await userRepository.findByEmail(email);
  if (!user) throw new ApiError(404, 'Invalid email or password');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new ApiError(401, 'Invalid email or password');
  if (user.isActive === false) throw new ApiError(403, 'Account disabled');

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  await userRepository.updateRefreshToken(user._id, refreshToken);

  return { accessToken, refreshToken, user: sanitizeUser(user) };
};

// ============================================================
// REFRESH — exchange a valid refresh token for a new token pair.
// The token must match the one stored on the user document, so a
// newer login, password change or deleted account revokes it.
// Both tokens are rotated on every refresh.
// ============================================================
export const refresh = async (refreshToken) => {
  if (!refreshToken) throw new ApiError(401, 'Refresh token missing');

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = await userRepository.findById(payload.id);
  if (!user) throw new ApiError(401, 'User not found');
  if (user.refreshToken !== refreshToken) throw new ApiError(401, 'Refresh token revoked');
  if (user.isActive === false) throw new ApiError(401, 'Account disabled');

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);
  await userRepository.updateRefreshToken(user._id, newRefreshToken);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken, user: sanitizeUser(user) };
};

export const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await userRepository.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new ApiError(401, 'Current password is incorrect');

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await userRepository.updatePassword(userId, hashedPassword);

  return { message: 'Password updated successfully' };
};
export const getProfile = async (name) => {
  const user = await userRepository.findById(name);
  if (!user) throw new ApiError(404, 'User not found');
  return sanitizeUser(user);
};

export const updateProfile = async (userId, updates) => {
  // Prevent updating restricted fields through this endpoint
  const { name, email } = updates;
  const allowedUpdates = {};
  if (name) allowedUpdates.name = name;
  if (email) allowedUpdates.email = email;

  if (email) {
    const existing = await userRepository.findByEmail(email);
    if (existing && existing._id.toString() !== userId) {
      throw new ApiError(409, 'Email already in use');
    }
  }

  const user = await userRepository.updateUser(userId, allowedUpdates);
  if (!user) throw new ApiError(404, 'User not found');

  return sanitizeUser(user);
};

export const deleteAccount = async (name) => {
  const user = await userRepository.deleteUser(name);
  if (!user) throw new ApiError(404, 'User not found');
  return { message: 'Account deleted successfully' };
};

// ============================================================
// LOGOUT — revoke the refresh token behind the current session.
// The refresh token lives in an httpOnly cookie, so the client can't
// read it; the server matches on the cookie value instead. If it was
// already rotated away (another tab refreshed), this is a no-op.
// ============================================================
export const logout = async (userId, refreshToken) => {
  if (refreshToken) {
    await userRepository.clearRefreshToken(userId, refreshToken);
  }
  return { message: 'Logged out successfully' };
};

// ============================================================
// ADMIN — user management for the dashboard
// ============================================================

export const adminListUsers = async ({ page = 1, limit = 20, search } = {}) => {
  const filter = userRepository.setSearchFilter(search);
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    userRepository.findAllWithFilter({ filter, skip, limit: Number(limit) }),
    userRepository.countAll(filter),
  ]);

  return {
    users: users.map(sanitizeUser),
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Promote / demote. `actorId` guards the classic footgun: an admin
 * removing their own admin rights and locking everyone out.
 */
export const adminUpdateRole = async (userId, role, actorId) => {
  if (userId === actorId && role !== 'admin') {
    throw new ApiError(400, 'You cannot remove your own admin role');
  }

  const user = await userRepository.setRole(userId, role);
  if (!user) throw new ApiError(404, 'User not found');
  return sanitizeUser(user);
};

export const adminSetStatus = async (userId, isActive, actorId) => {
  if (userId === actorId && !isActive) {
    throw new ApiError(400, 'You cannot disable your own account');
  }

  const user = await userRepository.setActive(userId, isActive);
  if (!user) throw new ApiError(404, 'User not found');
  return sanitizeUser(user);
};