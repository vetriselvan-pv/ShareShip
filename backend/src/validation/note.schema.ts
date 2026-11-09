import { z } from 'zod';

export const UpdateScratchpadSchema = z.object({
  text: z.string().min(1, 'Text content is required'),
  lastEditor: z.string().optional(),
  editorAvatarUrl: z.string().optional()
});

export type UpdateScratchpadInput = z.infer<typeof UpdateScratchpadSchema>;

export const NoteChecklistItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  completed: z.boolean().default(false)
});

export const CreateNoteSchema = z.object({
  title: z.string().min(1, 'Note title is required').max(100),
  category: z.enum(['TO-DOS', 'IDEAS', 'NOTES', 'GIFT IDEAS', 'GUEST LISTS', 'RECIPES']).default('TO-DOS').optional(),
  bodyPreview: z.string().default('').optional(),
  checklists: z.array(NoteChecklistItemSchema).default([]).optional(),
  authorName: z.string().optional(),
  authorAvatarUrl: z.string().optional()
});

export type CreateNoteInput = z.infer<typeof CreateNoteSchema>;

export const UpdateNoteSchema = z.object({
  title: z.string().min(1, 'Note title is required').max(100).optional(),
  category: z.enum(['TO-DOS', 'IDEAS', 'NOTES', 'GIFT IDEAS', 'GUEST LISTS', 'RECIPES']).optional(),
  bodyPreview: z.string().optional(),
  checklists: z.array(NoteChecklistItemSchema).optional()
});

export type UpdateNoteInput = z.infer<typeof UpdateNoteSchema>;
