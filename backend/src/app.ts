import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import './config/env.js';
import { syncPlugin } from './plugins/sync.js';
import { encryptionPlugin } from './plugins/encryption.js';
import { authPlugin } from './plugins/auth.js';
import { authRoutes } from './routes/auth.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { calendarRoutes } from './routes/calendar.js';
import { notificationRoutes } from './routes/notifications.js';
import { expenseRoutes } from './routes/expenses.js';
import { noteRoutes } from './routes/notes.js';
import { connectionRoutes } from './routes/connections.js';
import { relativesRoutes } from './routes/relatives.js';
import { isMongoConnected } from './db/connection.js';

export async function buildApp(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: true,
  });

  await fastify.register(cors, {
    origin: true,
    credentials: true,
  });

  // Strict Transport Security (HSTS) and Secure SSL Headers
  fastify.addHook('onSend', async (request, reply, payload) => {
    if (request.protocol === 'https' || request.headers['x-forwarded-proto'] === 'https') {
      reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-XSS-Protection', '1; mode=block');
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    return payload;
  });

  await fastify.register(encryptionPlugin);
  await fastify.register(authPlugin);

  try {
    await fastify.register(websocket);
    await fastify.register(syncPlugin);
  } catch (err) {
    fastify.log.warn('WebSocket registration deferred or skipped in serverless mode');
  }

  await fastify.register(authRoutes);
  await fastify.register(dashboardRoutes);
  await fastify.register(calendarRoutes);
  await fastify.register(notificationRoutes);
  await fastify.register(expenseRoutes);
  await fastify.register(noteRoutes);
  await fastify.register(connectionRoutes);
  await fastify.register(relativesRoutes);

  // Root welcome & status endpoint
  const rootStatusHandler = async () => ({
    status: 'ok',
    service: 'shareship-sync-backend',
    version: '1.0.0',
    message: 'Shareship Backend API is running on Vercel',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      calendar: '/api/calendar/events',
      expenses: '/api/expenses',
      notes: '/api/notes',
      connections: '/api/connections',
      config: '/api/config',
    },
    database: {
      provider: 'MongoDB Atlas',
      databaseName: 'Shareship',
      connected: isMongoConnected,
      mode: isMongoConnected ? 'live-database' : 'resilient-in-memory-fallback',
    },
    timestamp: new Date().toISOString(),
  });

  fastify.get('/', rootStatusHandler);
  fastify.get('/api', rootStatusHandler);
  fastify.get('/api/', rootStatusHandler);

  // Health check endpoint reporting MongoDB connection status
  fastify.get('/health', async () => ({
    status: 'ok',
    service: 'shareship-sync-backend',
    database: {
      provider: 'MongoDB Atlas',
      databaseName: 'Shareship',
      connected: isMongoConnected,
      mode: isMongoConnected ? 'live-database' : 'resilient-in-memory-fallback',
    },
    timestamp: new Date().toISOString(),
  }));

  fastify.get('/api/health', async () => ({
    status: 'ok',
    service: 'shareship-sync-backend',
    database: {
      provider: 'MongoDB Atlas',
      databaseName: 'Shareship',
      connected: isMongoConnected,
      mode: isMongoConnected ? 'live-database' : 'resilient-in-memory-fallback',
    },
    timestamp: new Date().toISOString(),
  }));

  return fastify;
}
