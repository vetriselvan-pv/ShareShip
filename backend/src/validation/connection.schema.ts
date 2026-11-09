import { z } from 'zod';

export const ConnectionRequestSchema = z.object({
  targetUserId: z.string().min(1, 'Partner User ID is required'),
  requesterUserId: z.string().optional()
});

export type ConnectionRequestInput = z.infer<typeof ConnectionRequestSchema>;

export const ConnectionIdParamSchema = z.object({
  connectionId: z.string().min(1, 'Connection ID is required')
});

export type ConnectionIdParamInput = z.infer<typeof ConnectionIdParamSchema>;
