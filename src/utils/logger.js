import path from 'path';
import { fileURLToPath } from 'url';
import winston from 'winston';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// logs are written to <project-root>/logs (backend/logs)
const logDir = path.join(__dirname, '..', '..', 'logs');

const logLevel = process.env.LOG_LEVEL || 'http';

const logFormat = winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  const stackStr = stack && typeof stack === 'string' ? `\n${stack}` : '';
  return `${timestamp} [${level.toUpperCase().padEnd(5)}] ${message}${metaStr}${stackStr}`;
});

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    logFormat,
  ),
  transports: [
    // Console (colored)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.colorize({ all: true }),
        logFormat,
      ),
    }),
    // File: all logs
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5 * 1024 * 1024, // 5 MB
      maxFiles: 5,
      tailable: true,
    }),
    // File: errors only
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
      tailable: true,
    }),
  ],
});

// Stream adapter so morgan (HTTP request logs) can write into winston
export const morganStream = {
  write: (message) => logger.http(message.trim()),
};

export default logger;