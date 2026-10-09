import asyncHandler from '../../utils/asyncHandler.js';
import * as userService from './user.service.js';

export const signup = asyncHandler(async (req, res) => {
  const user = await userService.signup(req.body);
  res.status(201).json({ success: true, data: user });
});

const setRefreshCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const login = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, user } = await userService.login(req.body);

  setRefreshCookie(res, refreshToken);

  // refreshToken is also returned in the body so mobile clients
  // (which drop httpOnly cookies) can renew the session later.
  res.status(200).json({ success: true, data: { accessToken, refreshToken, user } });
});

// ============================================================
// REFRESH SESSION — POST /api/users/refresh
// Renews the token pair for a signed-in client. Accepts the refresh
// token from the body (mobile) or the cookie (web).
// ============================================================
export const refreshSession = asyncHandler(async (req, res) => {
  const token = (req.body && req.body.refreshToken) || (req.cookies && req.cookies.refreshToken);
  const { accessToken, refreshToken, user } = await userService.refresh(token);

  setRefreshCookie(res, refreshToken);

  res.status(200).json({ success: true, data: { accessToken, refreshToken, user } });
});

export const changePassword = asyncHandler(async (req, res) => {
  const result = await userService.changePassword(req.user.id, req.body);
  res.status(200).json({ success: true, data: result });
});
export const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user.id);
  res.status(200).json({ success: true, data: user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.body);
  res.status(200).json({ success: true, data: user });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const result = await userService.deleteAccount(req.user.id);
  res.clearCookie('refreshToken'); // log them out too
  res.status(200).json({ success: true, data: result });
});

// ============================================================
// LOGOUT — drop the refresh cookie and revoke the stored token.
// ============================================================
export const logout = asyncHandler(async (req, res) => {
  const result = await userService.logout(req.user.id, req.cookies?.refreshToken);
  res.clearCookie('refreshToken');
  res.status(200).json({ success: true, data: result });
});

// ============================================================
// ADMIN — user management (dashboard)
// ============================================================
export const adminListUsers = asyncHandler(async (req, res) => {
  const result = await userService.adminListUsers(req.query);
  res.status(200).json({ success: true, data: result });
});

// Admin: one account (customer detail screen).
export const adminGetUser = asyncHandler(async (req, res) => {
  const user = await userService.adminGetUser(req.params.id);
  res.status(200).json({ success: true, data: user });
});

export const adminUpdateRole = asyncHandler(async (req, res) => {
  const user = await userService.adminUpdateRole(req.params.id, req.body.role, req.user.id);
  res.status(200).json({ success: true, data: user });
});

export const adminSetStatus = asyncHandler(async (req, res) => {
  const user = await userService.adminSetStatus(req.params.id, req.body.isActive, req.user.id);
  res.status(200).json({ success: true, data: user });
});