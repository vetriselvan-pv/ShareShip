import dotenv from 'dotenv';
import { buildApp } from './app.js';
import { connectMongoDB } from './db/connection.js';

dotenv.config();

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

try {
  // Connect to MongoDB Atlas (or graceful in-memory fallback if password placeholder is not replaced)
  await connectMongoDB();

  const fastify = await buildApp();
  await fastify.listen({ port: PORT, host: HOST });
  console.log(`Shareship Fastify Sync Engine running at http://${HOST}:${PORT}`);
} catch (err) {
  console.error('Failed to start server:', err);
  process.exit(1);
}
