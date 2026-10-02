import asyncHandler from '../../utils/asyncHandler.js';
import * as deviceTokenService from './device_token.service.js';

export const registerDevice = asyncHandler(async (req, res) => {
  const result = await deviceTokenService.registerDevice(req.user.id, req.body);
  res.status(201).json({ success: true, data: result });
});

export const unregisterDevice = asyncHandler(async (req, res) => {
  const result = await deviceTokenService.unregisterDevice(
    req.user.id,
    req.body?.token,
  );
  res.status(200).json({ success: true, data: result });
});
