import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { connectWithRetry } from './config/database.js';
import { ensureBucket } from './config/minio.js';
import { logger } from './utils/logger.js';
import { createWsServer } from './ws/server.js';
import { startWorker } from './workers/agent-worker.js';

const server = http.createServer(app);

// WebSocket
createWsServer(server);

async function start() {
  try {
    // Ensure DB connection before accepting traffic
    await connectWithRetry();
    await ensureBucket();

    server.listen(env.PORT, () => {
      logger.info(`Server listening on port ${env.PORT} [${env.NODE_ENV}]`);
    });

    // Start background worker
    startWorker();
  } catch (err) {
    logger.error('Failed to start server', { err: err.message });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});

start();
