import mongoose, { Schema } from 'mongoose';

export interface ILiveScratchpad {
  id: string;
  text: string;
  lastEditor: string;
  editorAvatarUrl: string;
  timeAgo: string;
  isSaved: boolean;
  activeCollaborators: Array<{ name: string; avatarUrl: string }>;
  overflowCount: number;
}

export const LiveScratchpadSchema = new Schema<ILiveScratchpad>({
  id: { type: String, default: 'primary', unique: true },
  text: { type: String, default: '' },
  lastEditor: { type: String, default: '' },
  editorAvatarUrl: { type: String, default: '' },
  timeAgo: { type: String, default: 'Just now' },
  isSaved: { type: Boolean, default: true },
  activeCollaborators: [{ name: String, avatarUrl: String }],
  overflowCount: { type: Number, default: 0 }
});

export const LiveScratchpadModel = mongoose.model<ILiveScratchpad>('LiveScratchpad', LiveScratchpadSchema);
