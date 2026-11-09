import { z } from 'zod';

export const SendFriendRequestSchema = z.object({
  handle: z.string().optional(),
  userId: z.string().optional()
}).refine(data => data.handle || data.userId, {
  message: 'Either handle or userId is required'
});

export type SendFriendRequestInput = z.infer<typeof SendFriendRequestSchema>;

export const RequestIdParamSchema = z.object({
  id: z.string().min(1, 'Request ID parameter is required')
});

export type RequestIdParamInput = z.infer<typeof RequestIdParamSchema>;
