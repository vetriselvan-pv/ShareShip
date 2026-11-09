export type CalendarEventCategory = 'Event' | 'celebration' | 'Incident' | 'Task' | string;

export interface CalendarEvent {
  id: string;
  userId?: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  creator?: string;
  creatorInitial?: string;
  creatorRole?: 'me' | 'partner';
  gift?: string;
  giftAmount?: number;
  category?: CalendarEventCategory;
  icon?: string;
  createdAt?: string;
}

export interface NewEventPayload {
  title: string;
  date: string;
  time: string;
  location?: string;
  gift?: string;
  giftAmount?: number;
  category?: 'Event' | 'celebration' | 'Incident' | 'Task';
}
