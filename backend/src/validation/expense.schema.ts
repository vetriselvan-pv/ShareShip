import { z } from 'zod';

export const CreateExpenseSchema = z.object({
  title: z.string().min(1, 'Expense title is required').max(100),
  amount: z.coerce.number().positive('Expense amount must be greater than 0'),
  category: z.string().default('Food').optional(),
  paidBy: z.string().default('You').optional(),
  userId: z.string().optional(),
  splitType: z.string().default('split_50_50').optional(),
  splitLabel: z.string().default('Split 50/50').optional(),
  expenseType: z.enum(['monthly', 'event']).default('monthly').optional(),
  eventId: z.string().optional(),
  eventTitle: z.string().optional()
});

export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;
