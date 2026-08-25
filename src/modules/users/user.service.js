import bcrypt from 'bcrypt';
import ApiError from '../../utils/ApiError.js';
import { generateAccessToken, generateRefreshToken } from '../../utils/token.js';
import * as userRepository from './user.repository.js';

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
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

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  await userRepository.updateRefreshToken(user._id, refreshToken);

  return { accessToken, refreshToken, user: sanitizeUser(user) };
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