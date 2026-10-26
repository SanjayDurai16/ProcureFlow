import app from './app.js';
import { connectDB } from './config/db.js';
import { config } from './config/env.js';

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(config.port, () => {
      console.log(`[Server] ProcureFlow API server running on port ${config.port}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    return server;
  } catch (error) {
    console.error(`[Server Failed to Start]: ${error.message}`);
    process.exit(1);
  }
};

startServer();
