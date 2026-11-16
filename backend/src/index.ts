import { env } from './config/env.js';
import { buildApp } from './app.js';
import { connectMongoDB } from './db/connection.js';

try {
  // Connect to MongoDB Atlas (or graceful in-memory fallback if password placeholder is not replaced)
  await connectMongoDB();

  const fastify = await buildApp();
  await fastify.listen({ port: env.PORT, host: env.HOST });
  console.log(`Shareship Fastify Sync Engine running at http://${env.HOST}:${env.PORT}`);
} catch (err) {
  console.error('Failed to start server:', err);
  process.exit(1);
}
