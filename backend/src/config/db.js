import mongoose from 'mongoose';
import { config } from './env.js';

export const connectDB = async (uri = config.mongoUri) => {
  try {
    const conn = await mongoose.connect(uri);
    console.log(`[DB] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[DB Error]: ${error.message}`);
    throw error;
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('[DB] MongoDB Disconnected');
  } catch (error) {
    console.error(`[DB Error on disconnect]: ${error.message}`);
  }
};

export default connectDB;
