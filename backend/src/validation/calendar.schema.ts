import { z } from 'zod';

export const CreateCalendarEventSchema = z.object({
  userId: z.string().optional(),
  title: z.string().min(1, 'Title is required').max(100),
  date: z.string().min(1, 'Date is required'),
  time: z.string().default('12:00 PM').optional(),
  location: z.string().default('Cozy Venue').optional(),
  creator: z.string().default('You').optional(),
  creatorRole: z.enum(['me', 'partner']).default('me').optional(),
  gift: z.string().optional(),
  giftAmount: z.number().nonnegative('Gift amount must be positive or zero').default(0).optional(),
  category: z.string().default('Event').optional(),
  icon: z.string().default('celebration').optional()
});

export type CreateCalendarEventInput = z.infer<typeof CreateCalendarEventSchema>;

export const CreateRegistryItemSchema = z.object({
  recipient: z.string().min(1, 'Recipient name is required').max(80),
  initials: z.string().max(4).optional(),
  occasion: z.string().default('Celebration').optional(),
  date: z.string().optional(),
  amount: z.number().nonnegative('Amount must be positive or zero').default(50).optional(),
  giftType: z.string().default('Gift Card').optional(),
  creator: z.string().default('You').optional(),
  creatorRole: z.enum(['me', 'partner']).default('me').optional(),
  status: z.enum(['Fulfilled', 'Pending Wrap', 'Idea Saved']).default('Idea Saved').optional()
});

export type CreateRegistryItemInput = z.infer<typeof CreateRegistryItemSchema>;
