export type NoteFilterCategory = 'All' | 'To-Dos' | 'Ideas' | 'Notes';

export interface NoteCheckItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface NoteAuthor {
  name: string;
  avatarUrl: string;
  action: 'Created by' | 'Updated by' | string;
}

export interface NoteConfirmedGuests {
  count: number;
  avatars: string[];
  overflowCount: number;
}

export interface NoteCardData {
  id: string;
  category: 'TO-DOS' | 'IDEAS' | 'NOTES' | 'GIFT IDEAS' | 'GUEST LISTS' | 'RECIPES' | string;
  title: string;
  bodyPreview?: string;
  checklists?: NoteCheckItem[];
  confirmedGuests?: NoteConfirmedGuests;
  author: NoteAuthor;
  timestamp: string;
  accentColor: 'golden' | 'sage';
}

export interface NewNotePayload {
  title: string;
  category: 'TO-DOS' | 'IDEAS' | 'NOTES';
  description: string;
  checklists?: NoteCheckItem[];
}
