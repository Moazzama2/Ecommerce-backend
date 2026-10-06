import 'dotenv/config';
import { createServer } from 'node:http';
import app from './app.js';
import connectDB from './config/db.js';
import logger from './utils/logger.js';
import { initSocket } from './realtime/socket.js';
import { corsOptions } from './utils/cors.js';

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    // Socket.io needs the raw HTTP server, not just the Express app.
    const server = createServer(app);

    // Same origin policy as the REST API (allow-list + credentials, see
    // utils/cors.js) so the dashboard and the Flutter web client can
    // connect, and nobody else can.
    initSocket(server, corsOptions);

    server.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    logger.error('Failed to start server:', { message: err.message, stack: err.stack });
    process.exit(1);
  });
