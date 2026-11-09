import { FastifyInstance } from 'fastify';
import { SharedNoteModel, LiveScratchpadModel } from '../models/index.js';
import { isMongoConnected } from '../db/connection.js';
import { validateBody, UpdateScratchpadSchema, CreateNoteSchema, UpdateScratchpadInput, CreateNoteInput } from '../validation/index.js';

export interface NoteChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface SharedNote {
  id: string;
  category: 'TO-DOS' | 'IDEAS' | 'NOTES' | 'GIFT IDEAS' | 'GUEST LISTS' | 'RECIPES';
  title: string;
  bodyPreview?: string;
  checklists?: NoteChecklistItem[];
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

export interface LiveScratchpad {
  text: string;
  lastEditor: string;
  editorAvatarUrl: string;
  timeAgo: string;
  isSaved: boolean;
  activeCollaborators: {
    name: string;
    avatarUrl: string;
  }[];
  overflowCount: number;
}

let scratchpad: LiveScratchpad = {
  text: '',
  lastEditor: '',
  editorAvatarUrl: '',
  timeAgo: '',
  isSaved: true,
  activeCollaborators: [],
  overflowCount: 0
};

let notesList: SharedNote[] = [];

export async function noteRoutes(fastify: FastifyInstance) {
  // GET all notes and scratchpad
  fastify.get('/api/notes', async () => {
    let activeScratchpad = scratchpad;
    let activeNotes = notesList;

    if (isMongoConnected) {
      try {
        const dbPad = await LiveScratchpadModel.findOne({ id: 'primary' }).lean();
        if (dbPad) {
          activeScratchpad = {
            text: dbPad.text,
            lastEditor: dbPad.lastEditor,
            editorAvatarUrl: dbPad.editorAvatarUrl,
            timeAgo: dbPad.timeAgo,
            isSaved: dbPad.isSaved,
            activeCollaborators: dbPad.activeCollaborators || [],
            overflowCount: dbPad.overflowCount || 0
          };
        }

        const dbNotes = await SharedNoteModel.find().lean();
        if (dbNotes && dbNotes.length > 0) {
          activeNotes = dbNotes.map(n => ({
            id: n.id,
            category: n.category as any,
            title: n.title,
            bodyPreview: n.bodyPreview,
            checklists: (n.checklists || []).map(c => ({ id: c.id || '', text: c.text || '', completed: !!c.completed })),
            confirmedGuests: n.confirmedGuests ? {
              count: n.confirmedGuests.count,
              avatars: n.confirmedGuests.avatars || [],
              overflowCount: n.confirmedGuests.overflowCount || 0
            } : undefined,
            author: {
              name: n.author?.name || 'User',
              avatarUrl: n.author?.avatarUrl || '',
              action: (n.author?.action as any) || 'Created by'
            },
            timestamp: n.timestamp,
            accentColor: n.accentColor as any
          }));
        }
      } catch (err) {
        fastify.log.warn('MongoDB query fallback for notes: ' + err);
      }
    }

    return {
      success: true,
      scratchpad: activeScratchpad,
      notes: activeNotes,
      totalCount: activeNotes.length
    };
  });

  // POST update live scratchpad
  fastify.post('/api/notes/scratchpad', { preHandler: validateBody(UpdateScratchpadSchema) }, async (request, reply) => {
    const body = request.body as UpdateScratchpadInput;

    scratchpad.text = body.text;
    if (body.lastEditor) scratchpad.lastEditor = body.lastEditor;
    if (body.editorAvatarUrl !== undefined) scratchpad.editorAvatarUrl = body.editorAvatarUrl;
    scratchpad.timeAgo = 'Just now';
    scratchpad.isSaved = true;

    if (isMongoConnected) {
      try {
        const updateDoc: Record<string, any> = { text: body.text, timeAgo: 'Just now', isSaved: true };
        if (body.lastEditor) updateDoc['lastEditor'] = body.lastEditor;
        if (body.editorAvatarUrl !== undefined) updateDoc['editorAvatarUrl'] = body.editorAvatarUrl;
        await LiveScratchpadModel.findOneAndUpdate(
          { id: 'primary' },
          updateDoc,
          { upsert: true }
        );
      } catch (err) {
        fastify.log.error('Failed to update scratchpad in MongoDB: ' + err);
      }
    }

    return {
      success: true,
      scratchpad
    };
  });

  // POST create a new note
  fastify.post('/api/notes', { preHandler: validateBody(CreateNoteSchema) }, async (request, reply) => {
    const body = request.body as CreateNoteInput;

    const newNote: SharedNote = {
      id: `note_${Date.now()}`,
      category: body.category || 'TO-DOS',
      title: body.title,
      bodyPreview: body.bodyPreview || '',
      checklists: body.checklists || [],
      author: {
        name: body.authorName || 'User',
        avatarUrl: body.authorAvatarUrl || '',
        action: 'Created by'
      },
      timestamp: 'Just now',
      accentColor: body.category === 'GUEST LISTS' ? 'sage' : 'golden'
    };

    if (isMongoConnected) {
      try {
        await SharedNoteModel.create(newNote);
      } catch (err) {
        fastify.log.error('Failed to save note in MongoDB: ' + err);
      }
    }
    notesList.unshift(newNote);

    return {
      success: true,
      message: `Note "${newNote.title}" created`,
      note: newNote
    };
  });

  // POST toggle checklist item
  fastify.post('/api/notes/:noteId/checklist/:checkId', async (request, reply) => {
    const { noteId, checkId } = request.params as { noteId: string; checkId: string };
    const note = notesList.find(n => n.id === noteId);
    if (!note || !note.checklists) {
      return reply.code(404).send({ success: false, error: 'Note or checklist not found' });
    }

    const item = note.checklists.find(c => c.id === checkId);
    if (!item) {
      return reply.code(404).send({ success: false, error: 'Checklist item not found' });
    }

    item.completed = !item.completed;

    if (isMongoConnected) {
      try {
        await SharedNoteModel.updateOne(
          { id: noteId, 'checklists.id': checkId },
          { $set: { 'checklists.$.completed': item.completed } }
        );
      } catch (err) {
        fastify.log.error('Failed to update checklist item in MongoDB: ' + err);
      }
    }

    return {
      success: true,
      item
    };
  });

  // PUT update note
  fastify.put('/api/notes/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;

    let note = notesList.find(n => n.id === id);

    if (isMongoConnected) {
      try {
        const updateData: Record<string, any> = {};
        if (body.title !== undefined) updateData.title = body.title;
        if (body.category !== undefined) {
          updateData.category = body.category;
          updateData.accentColor = body.category === 'IDEAS' ? 'golden' : 'sage';
        }
        if (body.bodyPreview !== undefined) updateData.bodyPreview = body.bodyPreview;
        if (body.checklists !== undefined) updateData.checklists = body.checklists;
        updateData['author.action'] = 'Updated by';
        updateData.timestamp = 'Just now';

        const updated = await SharedNoteModel.findOneAndUpdate(
          { id },
          { $set: updateData },
          { new: true }
        ).lean();

        if (updated) {
          const formattedNote: SharedNote = {
            id: updated.id,
            category: updated.category as any,
            title: updated.title,
            bodyPreview: updated.bodyPreview,
            checklists: (updated.checklists || []).map(c => ({ id: c.id || '', text: c.text || '', completed: !!c.completed })),
            author: {
              name: updated.author?.name || 'User',
              avatarUrl: updated.author?.avatarUrl || '',
              action: 'Updated by'
            },
            timestamp: 'Just now',
            accentColor: (updated.accentColor as any) || (updated.category === 'IDEAS' ? 'golden' : 'sage')
          };

          const idx = notesList.findIndex(n => n.id === id);
          if (idx !== -1) notesList[idx] = formattedNote;
          else notesList.unshift(formattedNote);

          return { success: true, note: formattedNote };
        }
      } catch (err) {
        fastify.log.error('Failed to update note in MongoDB: ' + err);
      }
    }

    if (note) {
      if (body.title !== undefined) note.title = body.title;
      if (body.category !== undefined) {
        note.category = body.category;
        note.accentColor = body.category === 'IDEAS' ? 'golden' : 'sage';
      }
      if (body.bodyPreview !== undefined) note.bodyPreview = body.bodyPreview;
      if (body.checklists !== undefined) note.checklists = body.checklists;
      note.author.action = 'Updated by';
      note.timestamp = 'Just now';
      return { success: true, note };
    }

    return reply.code(404).send({ success: false, error: 'Note not found' });
  });

  // DELETE note
  fastify.delete('/api/notes/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    if (isMongoConnected) {
      try {
        await SharedNoteModel.deleteOne({ id });
      } catch (err) {
        fastify.log.error('Failed to delete note from MongoDB: ' + err);
      }
    }

    const idx = notesList.findIndex(n => n.id === id);
    if (idx !== -1) {
      notesList.splice(idx, 1);
    }

    return { success: true, message: 'Note deleted' };
  });
}
