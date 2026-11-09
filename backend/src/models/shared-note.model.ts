import mongoose, { Schema } from 'mongoose';

export interface ISharedNote {
  id: string;
  category: 'TO-DOS' | 'IDEAS' | 'NOTES' | 'GIFT IDEAS' | 'GUEST LISTS' | 'RECIPES';
  title: string;
  bodyPreview?: string;
  checklists?: Array<{ id: string; text: string; completed: boolean }>;
  confirmedGuests?: {
    count: number;
    avatars: string[];
    overflowCount: number;
  };
  author: {
    name: string;
    avatarUrl: string;
    action: 'Created by' | 'Updated by';
  };
  timestamp: string;
  accentColor: 'golden' | 'sage';
}

export const SharedNoteSchema = new Schema<ISharedNote>({
  id: { type: String, required: true, unique: true },
  category: { 
    type: String, 
    enum: ['TO-DOS', 'IDEAS', 'NOTES', 'GIFT IDEAS', 'GUEST LISTS', 'RECIPES'], 
    default: 'TO-DOS' 
  },
  title: { type: String, required: true },
  bodyPreview: { type: String, default: '' },
  checklists: [
    {
      id: String,
      text: String,
      completed: { type: Boolean, default: false }
    }
  ],
  confirmedGuests: {
    count: { type: Number, default: 0 },
    avatars: [String],
    overflowCount: { type: Number, default: 0 }
  },
  author: {
    name: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    action: { type: String, default: 'Created by' }
  },
  timestamp: { type: String, default: () => new Date().toISOString() },
  accentColor: { type: String, enum: ['golden', 'sage'], default: 'sage' }
});

export const SharedNoteModel = mongoose.model<ISharedNote>('SharedNote', SharedNoteSchema);
