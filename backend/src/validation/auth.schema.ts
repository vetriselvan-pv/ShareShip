import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string().min(1, 'Username is required').optional(),
  email: z.string().min(1, 'Username or Email is required').optional(),
  password: z.string().min(1, 'Password is required')
}).refine(data => data.username || data.email, {
  message: 'Either username or email is required'
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const CreateSpaceSchema = z.object({
  spaceName: z.string().min(1, 'Space name is required').max(60).optional(),
  partnerEmail: z.string().email('Invalid partner email').optional()
});

export type CreateSpaceInput = z.infer<typeof CreateSpaceSchema>;

export const SimulatePartnerSyncSchema = z.object({
  message: z.string().optional(),
  itemType: z.enum(['calendar', 'expense', 'note']).optional()
});

export type SimulatePartnerSyncInput = z.infer<typeof SimulatePartnerSyncSchema>;

export const CreateUserSchema = z.object({
  userId: z.string().min(2, 'User ID must be at least 2 characters').max(30).regex(/^[a-zA-Z0-9_]+$/, 'User ID can only contain letters, numbers, and underscores'),
  name: z.string().min(1, 'Name is required').max(60),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  avatarUrl: z.string().optional()
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const SearchUserQuerySchema = z.object({
  userId: z.string().optional(),
  q: z.string().optional()
});

export type SearchUserQueryInput = z.infer<typeof SearchUserQuerySchema>;

export const ResetPasswordSchema = z.object({
  identifier: z.string().min(1, 'User ID or Email is required'),
  newPassword: z.string().min(4, 'Password must be at least 4 characters')
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

