import { FastifyRequest, FastifyReply } from 'fastify';
import { z, ZodError, ZodTypeAny } from 'zod';

/**
 * Validates request body using a Zod schema.
 * Replaces request.body with the sanitized/parsed data if valid.
 * Returns 400 with detailed error issues if invalid.
 */
export function validateBody<T extends ZodTypeAny>(schema: T) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const result = schema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: 'Validation Error',
        issues: formatZodError(result.error)
      });
    }
    (request as any).body = result.data;
  };
}

/**
 * Validates route parameters using a Zod schema.
 */
export function validateParams<T extends ZodTypeAny>(schema: T) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const result = schema.safeParse(request.params);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid Route Parameters',
        issues: formatZodError(result.error)
      });
    }
    (request as any).params = result.data;
  };
}

/**
 * Validates query strings using a Zod schema.
 */
export function validateQuery<T extends ZodTypeAny>(schema: T) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const result = schema.safeParse(request.query);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid Query Parameters',
        issues: formatZodError(result.error)
      });
    }
    (request as any).query = result.data;
  };
}

function formatZodError(error: ZodError) {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    code: err.code,
    message: err.message
  }));
}
