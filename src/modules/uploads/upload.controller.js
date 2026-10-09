import asyncHandler from '../../utils/asyncHandler.js';
import ApiError from '../../utils/ApiError.js';
import * as uploadService from './upload.service.js';

// multipart field name is "image" (see upload.routes.js).
export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No image file received — send it as the multipart field "image".');
  }
  const image = await uploadService.uploadImage(req.file);
  res.status(201).json({ success: true, data: image });
});

export const removeImage = asyncHandler(async (req, res) => {
  // Express decodes the param, so encodeURIComponent('ecommerce/products/abc')
  // arrives here as 'ecommerce/products/abc'.
  const result = await uploadService.removeImage(req.params.publicId);
  res.status(200).json({ success: true, data: result });
});
