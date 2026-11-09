import { Component, input, output } from '@angular/core';
import { NoteCheckItem, NoteCardData, NoteAuthor, NoteConfirmedGuests } from '../../models/notes.models';

export type { NoteCheckItem, NoteCardData, NoteAuthor, NoteConfirmedGuests };

@Component({
  selector: 'app-notes-cards-feed',
  template: `
    <div class="flex flex-col gap-3 select-none">
      @for (note of notes(); track note.id) {
        <div class="bg-[#e6f0ea] rounded-2xl p-4 shadow-2xs border border-[#dbe5df]/50 relative overflow-hidden transition-all hover:shadow-xs group">
          
          <!-- Vertical Accent Border Bar on Right Edge -->
          <div 
            class="absolute top-0 right-0 w-2 h-full rounded-r-2xl"
            [class]="note.accentColor === 'golden' ? 'bg-[#fed65b]' : 'bg-[#7a9a8b]'"
          ></div>

          <!-- Card Header: Category Badge + Edit Button & Actions -->
          <div class="flex items-center justify-between mb-2.5">
            <div class="flex items-center gap-2">
              @if (isTodoCategory(note.category)) {
                <span class="p-1 rounded-lg bg-[#7a9a8b] flex items-center justify-center shadow-2xs">
                  <img src="icons/todo.svg" class="w-4 h-4 object-contain" alt="To-Do" />
                </span>
                <span class="text-[11px] font-bold tracking-wider text-[#133126] uppercase">
                  To-Do List
                </span>
              } @else if (isIdeaCategory(note.category)) {
                <span class="p-1 rounded-lg bg-[#fed65b] flex items-center justify-center shadow-2xs">
                  <img src="icons/idea.svg" class="w-4 h-4 object-contain" alt="Idea" />
                </span>
                <span class="text-[11px] font-bold tracking-wider text-[#735c00] uppercase">
                  Idea
                </span>
              } @else {
                <span class="p-1 rounded-lg bg-[#dbe5df] flex items-center justify-center shadow-2xs">
                  <img src="icons/notes.svg" class="w-4 h-4 object-contain" alt="Notes" />
                </span>
                <span class="text-[11px] font-bold tracking-wider text-[#414844] uppercase">
                  Notes
                </span>
              }
            </div>

            <!-- Header Actions: Edit Button + Delete Option -->
            <div class="flex items-center gap-1 mr-2">
              <button
                type="button"
                (click)="onEditClick.emit(note)"
                class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white hover:bg-[#dbe5df] text-[#466557] border border-[#dbe5df] flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                title="Edit this note"
              >
                <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
                <span>Edit</span>
              </button>

              <button
                type="button"
                (click)="onDeleteClick.emit(note)"
                class="w-7 h-7 flex items-center justify-center text-[#727974] hover:text-[#93000a] rounded-full hover:bg-black/5 transition-colors cursor-pointer"
                title="Delete note"
              >
                <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Note Title -->
          <h3 class="text-[16px] font-bold text-[#151d1a] tracking-tight leading-snug mb-1 text-left">
            {{ note.title }}
          </h3>

          <!-- VIEW MODE FOR TO-DOS: Checkboxes with interactive toggle -->
          @if (isTodoCategory(note.category)) {
            @if (note.checklists && note.checklists.length > 0) {
              <div class="flex flex-col gap-2 my-2.5 bg-[#f2fcf5] p-3 rounded-xl border border-[#dbe5df]/50 text-left">
                @for (item of note.checklists; track item.id) {
                  <label class="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      [checked]="item.completed"
                      (change)="toggleChecklist(note, item)"
                      class="w-4 h-4 rounded text-[#466557] focus:ring-[#466557] accent-[#466557] mt-0.5 cursor-pointer"
                    />
                    <span 
                      class="text-[13px] transition-all"
                      [class]="item.completed ? 'line-through text-[#727974]' : 'text-[#151d1a] font-normal'"
                    >
                      {{ item.text }}
                    </span>
                  </label>
                }
              </div>
            }

            @if (note.bodyPreview) {
              <p class="text-[12.5px] text-[#414844] font-normal leading-relaxed mb-3 text-left whitespace-pre-wrap">
                {{ note.bodyPreview }}
              </p>
            }
          } @else {
            <!-- VIEW MODE FOR IDEAS & NOTES: Shown as Plain Text -->
            @if (note.bodyPreview) {
              <p class="text-[13px] text-[#414844] font-normal leading-relaxed mb-3 text-left whitespace-pre-wrap">
                {{ note.bodyPreview }}
              </p>
            }
          }

          <!-- Card Footer: Author & Timestamp -->
          <div class="flex items-center justify-between pt-2 border-t border-[#dbe5df]/60 text-left">
            <div class="flex items-center gap-2">
              @if (note.author.avatarUrl) {
                <img 
                  [src]="note.author.avatarUrl" 
                  [alt]="note.author.name"
                  class="w-5 h-5 rounded-full object-cover border border-[#dbe5df]"
                />
              } @else {
                <div class="w-5 h-5 rounded-full bg-[#466557] text-white text-[9px] font-bold flex items-center justify-center border border-[#dbe5df]">
                  {{ (note.author.name || 'U').charAt(0).toUpperCase() }}
                </div>
              }
              <span class="text-[12px] text-[#414844]">
                {{ note.author.action }} {{ note.author.name }}
              </span>
            </div>

            <span class="text-[12px] text-[#727974] font-normal">
              {{ note.timestamp }}
            </span>
          </div>

        </div>
      } @empty {
        <div class="bg-[#e6f0ea]/70 rounded-2xl p-4 text-center text-xs text-[#414844] italic border border-dashed border-[#dbe5df]">
          No notes in this category yet. Click '+ New Note' to create a To-Do list, Idea, or Note!
        </div>
      }
    </div>
  `
})
export class NotesCardsFeedComponent {
  notes = input<NoteCardData[]>([]);
  onEditClick = output<NoteCardData>();
  onDeleteClick = output<NoteCardData>();
  onMenuClick = output<NoteCardData>();
  onToggleChecklist = output<{ noteId: string; checkId: string }>();

  isTodoCategory(category: string): boolean {
    const c = (category || '').toUpperCase();
    return c === 'TO-DOS' || c === 'TODO' || c === 'TO-DO';
  }

  isIdeaCategory(category: string): boolean {
    const c = (category || '').toUpperCase();
    return c === 'IDEAS' || c === 'IDEA' || c === 'GIFT IDEAS';
  }

  toggleChecklist(note: NoteCardData, item: NoteCheckItem) {
    item.completed = !item.completed;
    this.onToggleChecklist.emit({ noteId: note.id, checkId: item.id });
  }
}
