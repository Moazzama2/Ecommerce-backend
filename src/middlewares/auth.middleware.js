import { verifyAccessToken } from '../utils/token.js';
import ApiError from '../utils/ApiError.js';

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new ApiError(401, 'No token provided');

    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    next(new ApiError(401, 'Invalid or expired token'));
  }
};

export default authMiddleware;