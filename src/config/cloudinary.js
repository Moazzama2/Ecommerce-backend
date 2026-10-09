import { v2 as cloudinary } from 'cloudinary';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

// ============================================================
// CLOUDINARY CLIENT
//
// Product images live on Cloudinary — the API secret NEVER leaves the
// backend, and the dashboard only ever sees the returned secure_url.
//
// Credentials come from .env, either as the three CLOUDINARY_* parts or
// as a single CLOUDINARY_URL (cloudinary://api_key:api_secret@cloud_name).
// The SDK reads CLOUDINARY_URL itself on the first config() call.
//
// Everything is lazy, exactly like the Stripe client: browsing the
// catalogue keeps working when the keys are missing — only the upload
// routes fail, with a clear 503.
// ============================================================

const readEnv = () => ({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim() || '',
  apiKey: process.env.CLOUDINARY_API_KEY?.trim() || '',
  apiSecret: process.env.CLOUDINARY_API_SECRET?.trim() || '',
  url: process.env.CLOUDINARY_URL?.trim() || '',
});

/** Assets uploaded by this app all live under this folder (env-overridable). */
export const cloudinaryFolder = () => process.env.CLOUDINARY_FOLDER?.trim() || 'ecommerce/products';

export const isCloudinaryConfigured = () => {
  const { cloudName, apiKey, apiSecret, url } = readEnv();
  return Boolean(url || (cloudName && apiKey && apiSecret));
};

/** Returns the shared Cloudinary client, or fails fast with a clear message. */
export const requireCloudinary = () => {
  if (!isCloudinaryConfigured()) {
    throw new ApiError(
      503,
      'Image uploads are not configured (set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env).',
    );
  }

  const { cloudName, apiKey, apiSecret } = readEnv();
  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  } else {
    // First config() call makes the SDK pick up CLOUDINARY_URL itself.
    cloudinary.config({});
  }
  return cloudinary;
};

/**
 * Uploads a raw file buffer straight to Cloudinary (the file never
 * touches disk). Resolves with a lean, API-facing shape — the dashboard
 * only needs `url`, the rest is metadata for debugging.
 */
export const uploadImageBuffer = (buffer, { folder, filename } = {}) =>
  new Promise((resolve, reject) => {
    let client;
    try {
      client = requireCloudinary();
    } catch (err) {
      return reject(err);
    }

    const stream = client.uploader.upload_stream(
      {
        folder: folder || cloudinaryFolder(),
        filename_override: filename,
        unique_filename: true,
        overwrite: false,
        resource_type: 'image',
        // Cap the stored file once, at upload time: a 12 MP phone photo
        // never lands in the catalogue at full size.
        transformation: [{ width: 1600, height: 1600, crop: 'limit' }, { quality: 'auto' }],
      },
      (error, result) => {
        if (error) {
          return reject(new ApiError(502, `Cloudinary upload failed: ${error.message}`));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      },
    );

    stream.end(buffer);
  });

/** Destroys a single asset. Resolves with Cloudinary's { result: 'ok' | … }. */
export const deleteImageAsset = (publicId) =>
  requireCloudinary().uploader.destroy(publicId, { resource_type: 'image' });

/** True when the URL points at a Cloudinary-hosted image. */
export const isCloudinaryUrl = (url) =>
  typeof url === 'string' && url.includes('res.cloudinary.com') && url.includes('/image/upload/');

/**
 * Recovers the public_id from a stored secure_url.
 *
 * Uploads always store the plain delivery URL — no extra transformation
 * segment — so the shape is deterministic:
 *   …/image/upload/v1712345678/ecommerce/products/abc123.jpg
 *        └─ strip version            └─ public_id ─┘ └─ extension
 *
 * Returns null for anything else (Unsplash links, other CDNs, garbage).
 */
export const publicIdFromCloudinaryUrl = (url) => {
  if (!isCloudinaryUrl(url)) return null;

  const marker = '/image/upload/';
  const start = url.indexOf(marker);
  if (start === -1) return null;

  const path = url.slice(start + marker.length).split(/[?#]/)[0];
  const publicId = decodeURIComponent(path)
    .replace(/^v\d+\//, '') // version prefix
    .replace(/\.[a-zA-Z0-9]+$/, ''); // file extension

  return publicId || null;
};

/**
 * Best-effort cleanup of assets a product no longer references.
 *
 * Fire-and-forget on purpose: a Cloudinary hiccup must never fail the
 * product request itself — it is logged and forgotten. Assets outside
 * our own folder are never touched, so a pasted third-party Cloudinary
 * link can't take out something unrelated.
 */
export const cleanupCloudinaryImages = (urls = []) => {
  if (!isCloudinaryConfigured()) return;

  const folderPrefix = `${cloudinaryFolder()}/`;

  for (const url of urls) {
    const publicId = publicIdFromCloudinaryUrl(url);
    if (!publicId || !publicId.startsWith(folderPrefix)) continue;

    deleteImageAsset(publicId)
      .then((result) => {
        // 'not found' is fine — already gone, nothing to do.
        if (result?.result && result.result !== 'ok' && result.result !== 'not found') {
          logger.warn('Cloudinary asset not deleted', { publicId, result: result.result });
        }
      })
      .catch((err) => logger.warn('Cloudinary asset cleanup failed', { publicId, message: err.message }));
  }
};
