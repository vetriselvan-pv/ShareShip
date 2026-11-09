import { Component, input, output, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NewNotePayload, NoteCardData, NoteCheckItem } from '../../models/notes.models';

export type { NewNotePayload };

@Component({
  selector: 'app-new-note-modal',
  imports: [FormsModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none fade-in">
        <div class="bg-[#f2fcf5] w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-[#adcebe] flex flex-col gap-4 text-left max-h-[90vh] overflow-y-auto">
          
          <!-- Header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-[#466557] text-[#ffffff] flex items-center justify-center">
                @if (isEditing()) {
                  <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                } @else {
                  <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                }
              </div>
              <h3 class="text-base font-bold text-[#151d1a]">
                {{ isEditing() ? 'Edit Note' : 'Create Shared Note' }}
              </h3>
            </div>
            <button 
              type="button"
              (click)="handleClose()"
              class="w-8 h-8 rounded-full bg-[#e6f0ea] hover:bg-[#dbe5df] text-[#414844] flex items-center justify-center cursor-pointer transition-colors"
            >
              ✕
            </button>
          </div>

          <!-- Form Fields -->
          <div class="flex flex-col gap-3">
            <!-- Category Selector (Todo list, Idea, and notes) -->
            <div class="flex flex-col gap-1">
              <label class="text-xs font-semibold text-[#414844]">Category Type</label>
              <div class="grid grid-cols-3 gap-1.5 p-1 bg-[#e3efe8] rounded-xl border border-[#d2e3d9]">
                <button
                  type="button"
                  (click)="setCategory('TO-DOS')"
                  class="py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1"
                  [class]="category() === 'TO-DOS' ? 'bg-white text-[#133126] shadow-xs' : 'text-[#4e5b54] hover:text-[#133126]'"
                >
                  <span>✅</span>
                  <span>To-Do</span>
                </button>
                <button
                  type="button"
                  (click)="setCategory('IDEAS')"
                  class="py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1"
                  [class]="category() === 'IDEAS' ? 'bg-white text-[#133126] shadow-xs' : 'text-[#4e5b54] hover:text-[#133126]'"
                >
                  <span>💡</span>
                  <span>Idea</span>
                </button>
                <button
                  type="button"
                  (click)="setCategory('NOTES')"
                  class="py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1"
                  [class]="category() === 'NOTES' ? 'bg-white text-[#133126] shadow-xs' : 'text-[#4e5b54] hover:text-[#133126]'"
                >
                  <span>📝</span>
                  <span>Notes</span>
                </button>
              </div>
            </div>

            <!-- Note Title -->
            <div class="flex flex-col gap-1">
              <label class="text-xs font-semibold text-[#414844]">Title</label>
              <input
                type="text"
                [(ngModel)]="title"
                [placeholder]="category() === 'TO-DOS' ? 'e.g. Weekend Chores' : category() === 'IDEAS' ? 'e.g. Summer Vacation Idea' : 'e.g. Apartment Wi-Fi Details'"
                class="bg-white border border-[#c1c8c3] rounded-xl px-3 py-2 text-sm text-[#151d1a] placeholder:text-[#727974] focus:outline-none focus:border-[#466557]"
              />
            </div>

            <!-- Category-specific Content -->
            @if (category() === 'TO-DOS') {
              <!-- Checklist Items Section -->
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-[#414844]">To-Do Items</label>
                
                <!-- Existing Checklist Items -->
                @if (checklistItems().length > 0) {
                  <div class="flex flex-col gap-1.5 max-h-36 overflow-y-auto p-2 bg-white rounded-xl border border-[#dbe5df]">
                    @for (item of checklistItems(); track item.id; let idx = $index) {
                      <div class="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-[#f2fcf5] border border-[#dbe5df]/60 text-xs">
                        <label class="flex items-center gap-2 flex-1 cursor-pointer overflow-hidden">
                          <input
                            type="checkbox"
                            [checked]="item.completed"
                            (change)="toggleItem(idx)"
                            class="w-3.5 h-3.5 rounded text-[#466557] accent-[#466557]"
                          />
                          <span 
                            class="truncate"
                            [class]="item.completed ? 'line-through text-[#727974]' : 'text-[#151d1a] font-medium'"
                          >
                            {{ item.text }}
                          </span>
                        </label>
                        <button
                          type="button"
                          (click)="removeTodoItem(idx)"
                          class="w-5 h-5 rounded-full text-[#93000a] hover:bg-[#ffdad6] flex items-center justify-center font-bold text-xs cursor-pointer flex-shrink-0"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                    }
                  </div>
                }

                <!-- Add To-Do Item Input Row -->
                <div class="flex items-center gap-1.5">
                  <input
                    type="text"
                    [(ngModel)]="newTodoInput"
                    (keydown.enter)="$event.preventDefault(); addTodoItem()"
                    placeholder="Type task & press Enter..."
                    class="flex-1 bg-white border border-[#c1c8c3] rounded-xl px-3 py-1.5 text-xs text-[#151d1a] placeholder:text-[#727974] focus:outline-none focus:border-[#466557]"
                  />
                  <button
                    type="button"
                    (click)="addTodoItem()"
                    [disabled]="!newTodoInput().trim()"
                    class="px-3 py-1.5 rounded-xl bg-[#466557] disabled:opacity-50 text-white font-semibold text-xs hover:bg-[#395347] transition-all cursor-pointer flex-shrink-0"
                  >
                    + Add
                  </button>
                </div>

                <!-- Optional Note Note for To-Do -->
                <div class="flex flex-col gap-1 mt-1">
                  <label class="text-[11px] font-medium text-[#727974]">Additional Notes (Optional)</label>
                  <textarea
                    [(ngModel)]="description"
                    rows="2"
                    placeholder="Optional details or context..."
                    class="bg-white border border-[#c1c8c3] rounded-xl p-2 text-xs text-[#151d1a] placeholder:text-[#727974] focus:outline-none focus:border-[#466557] resize-none"
                  ></textarea>
                </div>
              </div>
            } @else if (category() === 'IDEAS') {
              <!-- Idea Content (Plain Text) -->
              <div class="flex flex-col gap-1">
                <label class="text-xs font-semibold text-[#414844]">Idea (Plain Text)</label>
                <textarea
                  [(ngModel)]="description"
                  rows="4"
                  placeholder="Describe your idea or inspiration in plain text..."
                  class="bg-white border border-[#c1c8c3] rounded-xl p-2.5 text-sm text-[#151d1a] placeholder:text-[#727974] focus:outline-none focus:border-[#466557] resize-none"
                ></textarea>
              </div>
            } @else {
              <!-- Notes Content (Plain Text) -->
              <div class="flex flex-col gap-1">
                <label class="text-xs font-semibold text-[#414844]">Notes (Plain Text)</label>
                <textarea
                  [(ngModel)]="description"
                  rows="4"
                  placeholder="Write your shared notes in plain text..."
                  class="bg-white border border-[#c1c8c3] rounded-xl p-2.5 text-sm text-[#151d1a] placeholder:text-[#727974] focus:outline-none focus:border-[#466557] resize-none"
                ></textarea>
              </div>
            }
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-2 pt-2 border-t border-[#dbe5df]/60">
            <button
              type="button"
              (click)="handleClose()"
              class="px-4 py-2 rounded-xl text-xs font-medium text-[#414844] hover:bg-[#e6f0ea] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="handleSave()"
              [disabled]="!title().trim()"
              class="bg-[#466557] disabled:opacity-50 hover:bg-[#395347] active:scale-95 text-white font-semibold text-xs px-5 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {{ isEditing() ? 'Update Note' : 'Save Note' }}
            </button>
          </div>

        </div>
      </div>
    }
  `
})
export class NewNoteModalComponent {
  isOpen = input<boolean>(false);
  noteToEdit = input<NoteCardData | null>(null);

  close = output<void>();
  noteCreated = output<NewNotePayload>();
  noteUpdated = output<NoteCardData>();

  title = signal<string>('');
  category = signal<'TO-DOS' | 'IDEAS' | 'NOTES'>('TO-DOS');
  description = signal<string>('');
  checklistItems = signal<NoteCheckItem[]>([]);
  newTodoInput = signal<string>('');

  isEditing = signal<boolean>(false);

  constructor() {
    effect(() => {
      const note = this.noteToEdit();
      if (note) {
        this.isEditing.set(true);
        this.title.set(note.title);
        const catUpper = note.category.toUpperCase();
        if (catUpper === 'TO-DOS' || catUpper === 'TODO' || catUpper === 'TO-DO') {
          this.category.set('TO-DOS');
        } else if (catUpper === 'IDEAS' || catUpper === 'IDEA') {
          this.category.set('IDEAS');
        } else {
          this.category.set('NOTES');
        }
        this.description.set(note.bodyPreview || '');
        this.checklistItems.set(note.checklists ? JSON.parse(JSON.stringify(note.checklists)) : []);
        this.newTodoInput.set('');
      } else {
        this.isEditing.set(false);
        this.title.set('');
        this.category.set('TO-DOS');
        this.description.set('');
        this.checklistItems.set([]);
        this.newTodoInput.set('');
      }
    });
  }

  setCategory(cat: 'TO-DOS' | 'IDEAS' | 'NOTES') {
    this.category.set(cat);
  }

  addTodoItem() {
    const text = this.newTodoInput().trim();
    if (!text) return;
    const newItem: NoteCheckItem = {
      id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text,
      completed: false
    };
    this.checklistItems.update(items => [...items, newItem]);
    this.newTodoInput.set('');
  }

  toggleItem(index: number) {
    this.checklistItems.update(items =>
      items.map((it, i) => i === index ? { ...it, completed: !it.completed } : it)
    );
  }

  removeTodoItem(index: number) {
    this.checklistItems.update(items => items.filter((_, i) => i !== index));
  }

  handleClose() {
    this.close.emit();
  }

  handleSave() {
    if (!this.title().trim()) return;

    // If user typed in newTodoInput and didn't press enter/add, add it automatically
    if (this.category() === 'TO-DOS' && this.newTodoInput().trim()) {
      this.addTodoItem();
    }

    const currentChecklists = this.category() === 'TO-DOS' ? this.checklistItems() : [];

    if (this.isEditing() && this.noteToEdit()) {
      const updated: NoteCardData = {
        ...this.noteToEdit()!,
        title: this.title().trim(),
        category: this.category(),
        bodyPreview: this.description().trim(),
        checklists: currentChecklists,
        accentColor: this.category() === 'IDEAS' ? 'golden' : 'sage'
      };
      this.noteUpdated.emit(updated);
    } else {
      this.noteCreated.emit({
        title: this.title().trim(),
        category: this.category(),
        description: this.description().trim(),
        checklists: currentChecklists
      });
    }

    this.title.set('');
    this.description.set('');
    this.checklistItems.set([]);
    this.newTodoInput.set('');
  }
}
