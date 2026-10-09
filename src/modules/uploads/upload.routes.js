import { Router } from 'express';
import multer from 'multer';
import * as uploadController from './upload.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import isAdmin from '../../middlewares/isAdmin.middleware.js';
import ApiError from '../../utils/ApiError.js';

const router = Router();

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

// Files stay in memory and go straight to Cloudinary from the buffer —
// no uploads/ folder on disk to manage or clean up.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES },
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/(jpe?g|png|webp|gif|avif)$/;
    if (allowed.test(file.mimetype)) return cb(null, true);
    cb(new ApiError(400, 'Only image files are allowed (jpg, png, webp, gif, avif).'));
  },
});

// Multer reports its own errors (file too big, unexpected field, …).
// Translate them into the ApiError shape the error middleware expects,
// otherwise they surface as a generic 500.
const handleMultipart = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(400, 'Image must be 5 MB or smaller.'));
    }
    next(err instanceof ApiError ? err : new ApiError(400, err.message || 'Invalid upload.'));
  });
};

// Auth first: multer parses the body, and we don't want anonymous
// requests filling up the buffer before we even look at the token.
router.post('/image', authMiddleware, isAdmin, handleMultipart, uploadController.uploadImage);
router.delete('/image/:publicId', authMiddleware, isAdmin, uploadController.removeImage);

export default router;
