import jwt from 'jsonwebtoken';
import crypto from 'crypto';



export const generateRefreshToken = (user) => {
  // jti makes every refresh token unique. Without it, two tokens minted in
  // the same second would be byte-identical (JWT payload only has second
  // granularity), which would defeat replay/revocation detection.
  return jwt.sign({ id: user._id, jti: crypto.randomUUID() }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};
export const generateAccessToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
};