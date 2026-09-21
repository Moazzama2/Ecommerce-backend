import logger from '../utils/logger.js';

const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  logger.error(
    `${req.method} ${req.originalUrl} -> ${statusCode} ${err.message}`,
    { stack: err.stack }
  );

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};

export default errorMiddleware;