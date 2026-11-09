import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { TopBarComponent } from '../../components/top-bar/top-bar.component';
import { NotesFilterChipsComponent, NoteFilterCategory } from '../../components/notes-filter-chips/notes-filter-chips.component';
import { NotesCardsFeedComponent, NoteCardData } from '../../components/notes-cards-feed/notes-cards-feed.component';
import { NewNoteModalComponent, NewNotePayload } from '../../components/new-note-modal/new-note-modal.component';
import { BottomNavComponent, NavTab } from '../../components/bottom-nav/bottom-nav.component';
import { SyncModalComponent } from '../../components/sync-modal/sync-modal.component';
import { SyncService } from '../../services/sync.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-workspace-notes',
  imports: [
    TopBarComponent,
    NotesFilterChipsComponent,
    NotesCardsFeedComponent,
    NewNoteModalComponent,
    BottomNavComponent,
    SyncModalComponent
  ],
  template: `
    <main class="min-h-screen w-full max-w-full overflow-x-hidden bg-[#f2fcf5] text-[#151d1a] flex flex-col justify-between selection:bg-[#adcebe] selection:text-[#133126] font-sans pb-28">

      <!-- Top Bar Component -->
      <app-top-bar
        [isLiveSync]="syncService.isLiveSyncActive()"
        [unreadCount]="syncService.unreadSyncCount()"
        (onLogoClick)="router.navigate(['/dashboard'])"
        (onStatusClick)="isSyncModalOpen.set(true)"
        (onNotificationClick)="router.navigate(['/notifications'])"
      />

      <!-- Main Center Content Container -->
      <div class="w-full max-w-[390px] mx-auto px-4 pt-1 flex flex-col gap-4 flex-1 box-border">

        <!-- 1. Header Section -->
        <section class="flex flex-col text-left mt-1">
          <h1 class="text-[20px] font-semibold text-[#151d1a] tracking-tight leading-tight">
            Shared Workspace
          </h1>
          <p class="text-[12.5px] text-[#414844] font-normal leading-snug mt-0.5">
            Collaborative to-do lists, ideas, and notes
          </p>
        </section>

        <!-- 2. Filter Category Chips Bar (All, To-Dos, Ideas, Notes) -->
        <section class="w-full">
          <app-notes-filter-chips
            [activeCategory]="selectedFilterCategory()"
            [totalCount]="notes().length"
            (categorySelected)="handleCategorySelect($event)"
          />
        </section>

        <!-- 3. Notes Cards Feed -->
        <section class="w-full mb-2">
          <app-notes-cards-feed
            [notes]="filteredNotes()"
            (onEditClick)="handleEditNote($event)"
            (onDeleteClick)="handleDeleteNote($event)"
            (onMenuClick)="handleNoteMenu($event)"
            (onToggleChecklist)="handleChecklistToggle($event)"
          />
        </section>

      </div>

      <!-- 4. Floating Action Button ("New Note") -->
      <div class="fixed bottom-24 right-5 sm:right-8 z-40">
        <button
          type="button"
          (click)="handleOpenNewNote()"
          class="flex items-center gap-2 bg-[#466557] hover:bg-[#395347] active:scale-95 text-white font-semibold text-xs py-3 px-4.5 rounded-full shadow-lg transition-all cursor-pointer"
        >
          <!-- Add Circle Icon -->
          <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
          </svg>
          <span>Add Notes</span>
        </button>
      </div>

      <!-- 5. Persistent Bottom Navigation Bar (Notes Tab Active) -->
      <app-bottom-nav
        [activeTab]="'notes'"
        (tabSelected)="handleTabSwitch($event)"
      />

      <!-- Create / Edit Note Modal -->
      <app-new-note-modal
        [isOpen]="isNewNoteModalOpen()"
        [noteToEdit]="editingNote()"
        (close)="handleCloseNoteModal()"
        (noteCreated)="handleCreateNote($event)"
        (noteUpdated)="handleUpdateNote($event)"
      />

      <!-- Real-Time Sync Modal -->
      <app-sync-modal
        [isOpen]="isSyncModalOpen()"
        [partnerLink]="syncService.partnerLink()"
        [events]="syncService.syncEvents()"
        (close)="isSyncModalOpen.set(false)"
        (triggerPartnerSync)="syncService.simulatePartnerPing('Partner updated note')"
        (triggerMySync)="syncService.sendSyncItem('note', (authService.getCurrentUserName() || 'You') + ' updated notes')"
      />

      <!-- Floating Feedback Toast -->
      @if (activeToast()) {
        <div class="fixed top-14 left-1/2 -translate-x-1/2 max-w-[340px] w-[90%] p-3 rounded-2xl text-xs font-semibold text-center shadow-lg border border-[#adcebe] bg-[#c8ead9] text-[#012016] z-50 fade-in">
          {{ activeToast() }}
        </div>
      }

    </main>
  `
})
export class WorkspaceNotesComponent implements OnInit {
  syncService = inject(SyncService);
  authService = inject(AuthService);
  router = inject(Router);
  private http = inject(HttpClient);

  isSyncModalOpen = signal<boolean>(false);
  isNewNoteModalOpen = signal<boolean>(false);
  editingNote = signal<NoteCardData | null>(null);
  activeToast = signal<string | null>(null);

  selectedFilterCategory = signal<NoteFilterCategory>('All');

  // Notes feed state (Dynamic list from backend)
  notes = signal<NoteCardData[]>([]);

  filteredNotes = computed(() => {
    const filter = this.selectedFilterCategory();
    if (filter === 'All') return this.notes();
    if (filter === 'To-Dos') {
      return this.notes().filter(n => {
        const c = (n.category || '').toUpperCase();
        return c === 'TO-DOS' || c === 'TODO' || c === 'TO-DO';
      });
    }
    if (filter === 'Ideas') {
      return this.notes().filter(n => {
        const c = (n.category || '').toUpperCase();
        return c === 'IDEAS' || c === 'IDEA' || c === 'GIFT IDEAS';
      });
    }
    if (filter === 'Notes') {
      return this.notes().filter(n => {
        const c = (n.category || '').toUpperCase();
        return c === 'NOTES' || c === 'NOTE' || c === 'GUEST LISTS' || c === 'RECIPES';
      });
    }
    return this.notes();
  });

  ngOnInit() {
    this.fetchNotes();
  }

  fetchNotes() {
    this.http.get<{ success: boolean; notes: NoteCardData[] }>(`${environment.apiUrl}/api/notes`)
      .subscribe({
        next: (res) => {
          if (res?.notes) {
            this.notes.set(res.notes);
          }
        },
        error: () => {}
      });
  }

  handleCategorySelect(cat: NoteFilterCategory) {
    this.selectedFilterCategory.set(cat);
  }

  handleOpenNewNote() {
    this.editingNote.set(null);
    this.isNewNoteModalOpen.set(true);
  }

  handleEditNote(note: NoteCardData) {
    this.editingNote.set(note);
    this.isNewNoteModalOpen.set(true);
  }

  handleCloseNoteModal() {
    this.editingNote.set(null);
    this.isNewNoteModalOpen.set(false);
  }

  handleNoteMenu(note: NoteCardData) {
    this.handleEditNote(note);
  }

  handleChecklistToggle(evt: { noteId: string; checkId: string }) {
    this.showToast('✓ Checklist updated');
    this.http.post(`${environment.apiUrl}/api/notes/${evt.noteId}/checklist/${evt.checkId}`, {})
      .subscribe({
        next: () => {
          this.syncService.sendSyncItem('note', `Updated checklist in note ${evt.noteId}`);
        },
        error: () => {}
      });
  }

  handleCreateNote(payload: NewNotePayload) {
    this.isNewNoteModalOpen.set(false);
    this.editingNote.set(null);
    this.showToast(`✓ Created note: "${payload.title}"`);

    const currentUser = this.authService.getCurrentUser();
    const currentUserName = currentUser?.name || this.authService.getCurrentUserName() || 'You';
    const currentUserAvatar = currentUser?.avatarUrl || '';

    const newNote: NoteCardData = {
      id: `note_${Date.now()}`,
      category: payload.category,
      title: payload.title,
      bodyPreview: payload.description,
      checklists: payload.checklists || [],
      author: {
        name: currentUserName,
        avatarUrl: currentUserAvatar,
        action: 'Created by'
      },
      timestamp: 'Just now',
      accentColor: payload.category === 'IDEAS' ? 'golden' : 'sage'
    };

    this.notes.update(prev => [newNote, ...prev]);

    this.http.post(`${environment.apiUrl}/api/notes`, {
      ...payload,
      bodyPreview: payload.description,
      checklists: payload.checklists || [],
      authorName: currentUserName,
      authorAvatarUrl: currentUserAvatar
    })
      .subscribe({
        next: () => {
          this.syncService.sendSyncItem('note', `${currentUserName} created note: "${payload.title}"`);
        },
        error: () => {}
      });
  }

  handleUpdateNote(updated: NoteCardData) {
    this.isNewNoteModalOpen.set(false);
    this.editingNote.set(null);
    this.showToast(`✓ Updated note: "${updated.title}"`);

    const currentUser = this.authService.getCurrentUser();
    const currentUserName = currentUser?.name || this.authService.getCurrentUserName() || 'You';

    const refreshedNote: NoteCardData = {
      ...updated,
      author: {
        ...updated.author,
        action: 'Updated by',
        name: currentUserName
      },
      timestamp: 'Just now'
    };

    this.notes.update(prev => prev.map(n => n.id === updated.id ? refreshedNote : n));

    this.http.put(`${environment.apiUrl}/api/notes/${updated.id}`, refreshedNote)
      .subscribe({
        next: () => {
          this.syncService.sendSyncItem('note', `${currentUserName} updated note: "${updated.title}"`);
        },
        error: () => {}
      });
  }

  handleDeleteNote(note: NoteCardData) {
    const currentUserName = this.authService.getCurrentUserName() || 'You';
    this.notes.update(prev => prev.filter(n => n.id !== note.id));
    this.showToast(`✓ Deleted note: "${note.title}"`);

    this.http.delete(`${environment.apiUrl}/api/notes/${note.id}`)
      .subscribe({
        next: () => {
          this.syncService.sendSyncItem('note', `${currentUserName} deleted note: "${note.title}"`);
        },
        error: () => {}
      });
  }

  handleTabSwitch(tab: NavTab) {
    if (tab === 'home') {
      this.router.navigate(['/dashboard']);
    } else if (tab === 'calendar') {
      this.router.navigate(['/calendar']);
    } else if (tab === 'expenses') {
      this.router.navigate(['/expenses']);
    } else if (tab === 'notes') {
      // already on notes
    } else if (tab === 'gifts') {
      this.router.navigate(['/gifts']);
    } else if (tab === 'alerts') {
      this.router.navigate(['/notifications']);
    }
  }

  showToast(message: string) {
    this.activeToast.set(message);
    setTimeout(() => {
      if (this.activeToast() === message) {
        this.activeToast.set(null);
      }
    }, 3500);
  }
}
