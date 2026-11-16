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

export const UpdateCalendarEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100).optional(),
  date: z.string().min(1, 'Date is required').optional(),
  time: z.string().optional(),
  location: z.string().optional(),
  gift: z.string().optional(),
  giftAmount: z.number().nonnegative('Gift amount must be positive or zero').optional(),
  category: z.string().optional(),
  icon: z.string().optional()
});

export type UpdateCalendarEventInput = z.infer<typeof UpdateCalendarEventSchema>;

export const CreateRegistryItemSchema = z.object({
  relativeId: z.string().optional(),
  relativeName: z.string().max(100).optional(),
  relativeVillage: z.string().max(100).optional(),
  recipient: z.string().min(1, 'Recipient/Relative name is required').max(100),
  initials: z.string().max(4).optional(),
  occasion: z.string().default('Celebration').optional(),
  type: z.enum(['credit', 'debit']).default('credit').optional(),
  date: z.string().optional(),
  amount: z.number().nonnegative('Amount must be positive or zero').default(50).optional(),
  notes: z.string().max(500).default('').optional(),
  giftType: z.string().default('Cash').optional(),
  creator: z.string().default('You').optional(),
  creatorRole: z.enum(['me', 'partner']).default('me').optional(),
  status: z.enum(['Fulfilled', 'Pending Wrap', 'Idea Saved']).default('Fulfilled').optional()
});

export type CreateRegistryItemInput = z.infer<typeof CreateRegistryItemSchema>;
