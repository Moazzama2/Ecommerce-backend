import ApiError from '../../utils/ApiError.js';
import {
  requireCloudinary,
  uploadImageBuffer,
  deleteImageAsset,
  cloudinaryFolder,
} from '../../config/cloudinary.js';

/**
 * Sends a multer memory buffer to Cloudinary and returns the lean shape
 * the dashboard stores on the product: { url, publicId, width, … }.
 */
export const uploadImage = async (file) => {
  // Throws 503 when the .env credentials are missing — nothing else in
  // the API depends on Cloudinary being configured.
  requireCloudinary();
  return uploadImageBuffer(file.buffer, { filename: file.originalname });
};

/**
 * Deletes an asset this app uploaded. publicId is only accepted when it
 * sits inside our own folder, so a stray (or malicious) id can never
 * reach somebody else's asset.
 */
export const removeImage = async (publicId) => {
  requireCloudinary();

  if (!publicId.startsWith(`${cloudinaryFolder()}/`)) {
    throw new ApiError(400, 'Only images uploaded by this application can be deleted.');
  }

  const result = await deleteImageAsset(publicId);
  if (result?.result === 'not found') {
    throw new ApiError(404, 'Image not found on Cloudinary (already deleted?).');
  }
  if (result?.result !== 'ok') {
    throw new ApiError(502, 'Cloudinary could not delete the image.');
  }

  return { publicId, deleted: true };
};
