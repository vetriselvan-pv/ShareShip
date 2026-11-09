import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import dotenv from 'dotenv';
import { syncPlugin } from './plugins/sync.js';
import { authRoutes } from './routes/auth.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { calendarRoutes } from './routes/calendar.js';
import { notificationRoutes } from './routes/notifications.js';
import { expenseRoutes } from './routes/expenses.js';
import { noteRoutes } from './routes/notes.js';
import { connectionRoutes } from './routes/connections.js';
import { connectMongoDB, isMongoConnected } from './db/connection.js';

dotenv.config();

const fastify = Fastify({
  logger: true
});

await fastify.register(cors, {
  origin: true,
  credentials: true
});

await fastify.register(websocket);

await fastify.register(syncPlugin);
await fastify.register(authRoutes);
await fastify.register(dashboardRoutes);
await fastify.register(calendarRoutes);
await fastify.register(notificationRoutes);
await fastify.register(expenseRoutes);
await fastify.register(noteRoutes);
await fastify.register(connectionRoutes);

// Health check endpoint reporting MongoDB connection status
fastify.get('/health', async () => {
  return { 
    status: 'ok', 
    service: 'shareship-sync-backend', 
    database: {
      provider: 'MongoDB Atlas',
      databaseName: 'Shareship',
      connected: isMongoConnected,
      mode: isMongoConnected ? 'live-database' : 'resilient-in-memory-fallback'
    },
    timestamp: new Date().toISOString() 
  };
});

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

try {
  // Connect to MongoDB Atlas (or graceful in-memory fallback if password placeholder is not replaced)
  await connectMongoDB();

  await fastify.listen({ port: PORT, host: HOST });
  console.log(`Shareship Fastify Sync Engine running at http://${HOST}:${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
