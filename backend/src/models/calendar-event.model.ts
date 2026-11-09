import mongoose, { Schema } from 'mongoose';

export interface ICalendarEvent {
  id: string;
  userId?: string;
  title: string;
  date: string;
  time: string;
  location: string;
  creator: string;
  creatorRole: 'me' | 'partner';
  gift?: string;
  giftAmount: number;
  category?: string;
  icon?: string;
  createdAt?: Date;
}

export const CalendarEventSchema = new Schema<ICalendarEvent>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, default: '' },
  title: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, default: '12:00 PM' },
  location: { type: String, default: '' },
  creator: { type: String, default: 'You' },
  creatorRole: { type: String, enum: ['me', 'partner'], default: 'me' },
  gift: { type: String, default: '' },
  giftAmount: { type: Number, default: 0 },
  category: { 
    type: String, 
    default: 'Event' 
  },
  icon: { 
    type: String, 
    default: 'celebration' 
  },
  createdAt: { type: Date, default: Date.now }
});

// Query indexes for date ranges and user events
CalendarEventSchema.index({ userId: 1, date: 1 });
CalendarEventSchema.index({ date: 1 });

export const CalendarEventModel = mongoose.model<ICalendarEvent>('CalendarEvent', CalendarEventSchema);
