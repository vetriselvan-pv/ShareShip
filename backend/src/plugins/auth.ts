import { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { verifyJwt, isTokenRevoked, JwtUserPayload } from '../utils/jwt.utils.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtUserPayload;
  }
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

// Explicit list of public endpoints that do not require strict JWT enforcement
const PUBLIC_PATHS = new Set([
  '/',
  '/health',
  '/api/health',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/create-user',
  '/api/auth/reset-password',
  '/api/auth/create-space',
  '/api/auth/logout',
  '/api/config',
]);

/**
 * Validates the Authorization Bearer JWT on an incoming request.
 */
export async function authenticateRequest(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    return reply.code(401).send({
      success: false,
      error: 'Authentication required. Authorization header missing.',
    });
  }

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return reply.code(401).send({
      success: false,
      error: 'Invalid authorization format. Expected Bearer <token>.',
    });
  }

  const token = parts[1];
  try {
    const isRevoked = await isTokenRevoked(token);
    if (isRevoked) {
      return reply.code(401).send({
        success: false,
        error: 'Session has been invalidated. Please log in again.',
      });
    }

    const payload = verifyJwt(token);
    request.user = payload;
  } catch (err: any) {
    return reply.code(401).send({
      success: false,
      error: `Unauthorized: ${err.message || 'Invalid or expired token'}`,
    });
  }
}

const authPluginAsync: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.decorate('authenticate', authenticateRequest);

  // Global preHandler hook to enforce JWT authentication across protected /api/* endpoints
  fastify.addHook('preHandler', async (request, reply) => {
    // Only guard /api/ routes
    if (!request.url.startsWith('/api')) {
      return;
    }

    // Extract path without query parameters
    const path = request.url.split('?')[0];

    // Skip public paths
    if (PUBLIC_PATHS.has(path)) {
      // If client supplied a Bearer token to a public path, parse it optionally
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.trim().toLowerCase().startsWith('bearer ')) {
        const token = authHeader.trim().split(/\s+/)[1];
        try {
          request.user = verifyJwt(token);
        } catch {
          // ignore error for public paths
        }
      }
      return;
    }

    // Protected endpoint: enforce JWT validation
    await authenticateRequest(request, reply);
  });
};

export const authPlugin = fp(authPluginAsync, {
  name: 'shareship-auth-plugin',
  fastify: '5.x',
});
