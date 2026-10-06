import asyncHandler from '../../utils/asyncHandler.js';
import * as statsService from './stats.service.js';

export const getOverview = asyncHandler(async (req, res) => {
  const data = await statsService.getOverview(req.query);
  res.status(200).json({ success: true, data });
});
