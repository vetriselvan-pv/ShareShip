import { z } from 'zod';

export const CreateRelativeSchema = z.object({
  userId: z.string().optional(),
  firstName: z.string().min(1, 'First name is required').max(60),
  lastName: z.string().max(60).default('').optional(),
  village: z.string().min(1, 'Village / Native place is required').max(100),
  phone: z.string().max(25).default('').optional(),
  relationship: z.string().max(60).default('').optional(),
});

export type CreateRelativeInput = z.infer<typeof CreateRelativeSchema>;
