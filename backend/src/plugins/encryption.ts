import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { decryptPayload, encryptPayload, isEncryptedEnvelope } from '../utils/crypto.utils.js';

declare module 'fastify' {
  interface FastifyRequest {
    wasEncrypted?: boolean;
  }
}

const encryptionPluginAsync: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.decorateRequest('wasEncrypted', false);

  // Hook 1: Transparent Request Body Decryption (Runs before schema validation)
  fastify.addHook('preValidation', async (request, reply) => {
    // Only process API endpoints, ignore health and public root checks
    if (!request.url.startsWith('/api') || request.url.startsWith('/api/health')) {
      return;
    }

    const hasHeader = request.headers['x-payload-encryption'] === 'aes-256-gcm';
    const hasEnvelope = isEncryptedEnvelope(request.body);

    if (hasEnvelope || (hasHeader && request.body !== undefined && request.body !== null)) {
      try {
        const payloadToDecrypt = hasEnvelope
          ? (request.body as any).payload
          : typeof request.body === 'string'
          ? request.body
          : (request.body as any)?.payload;

        if (payloadToDecrypt && typeof payloadToDecrypt === 'string' && payloadToDecrypt.trim().length > 0) {
          const decrypted = decryptPayload(payloadToDecrypt);
          request.body = decrypted;
          request.wasEncrypted = true;
        }
      } catch (err: any) {
        fastify.log.error(`[EncryptionPlugin] Decryption failed for ${request.url}: ${err.message}`);
        return reply.code(400).send({
          success: false,
          error: 'Invalid or tampered encrypted payload.',
        });
      }
    }
  });

  // Hook 2: Transparent Response Body Encryption
  fastify.addHook('onSend', async (request, reply, payload) => {
    // Only encrypt API responses, never health check or public root status
    if (!request.url.startsWith('/api') || request.url.startsWith('/api/health')) {
      return payload;
    }

    // Encrypt response if request had encryption header or was submitted encrypted
    const clientWantsEncryption =
      request.wasEncrypted ||
      request.headers['x-payload-encryption'] === 'aes-256-gcm' ||
      request.headers['x-accept-encryption'] === 'aes-256-gcm';

    if (!clientWantsEncryption) {
      return payload;
    }

    // Only encrypt successful JSON payloads (stringified JSON)
    const contentType = reply.getHeader('content-type')?.toString() || '';
    if (typeof payload === 'string' && (contentType.includes('application/json') || payload.startsWith('{') || payload.startsWith('['))) {
      try {
        const encryptedBase64 = encryptPayload(payload);
        const envelope = JSON.stringify({
          encrypted: true,
          v: 1,
          payload: encryptedBase64,
        });

        reply.header('x-payload-encryption', 'aes-256-gcm');
        reply.header('content-type', 'application/json; charset=utf-8');
        return envelope;
      } catch (err: any) {
        fastify.log.error(`[EncryptionPlugin] Response encryption failed: ${err.message}`);
        return payload;
      }
    }

    return payload;
  });
};

export const encryptionPlugin = fp(encryptionPluginAsync, {
  name: 'shareship-encryption-plugin',
  fastify: '5.x',
});
