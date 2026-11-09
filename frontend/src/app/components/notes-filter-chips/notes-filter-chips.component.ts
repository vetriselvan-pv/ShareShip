import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type NoteFilterCategory = 'All' | 'To-Dos' | 'Ideas' | 'Notes';

@Component({
  selector: 'app-notes-filter-chips',
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar select-none">
      <!-- 1. All Notes -->
      <button
        type="button"
        (click)="categorySelected.emit('All')"
        class="px-4 py-2 rounded-full font-semibold text-xs whitespace-nowrap transition-all cursor-pointer shadow-2xs"
        [class]="activeCategory() === 'All' ? 'bg-[#466557] text-white shadow-xs' : 'bg-[#e6f0ea] text-[#414844] hover:bg-[#e1eae4] hover:text-[#151d1a]'"
      >
        All ({{ totalCount() }})
      </button>

      <!-- 2. To-Dos -->
      <button
        type="button"
        (click)="categorySelected.emit('To-Dos')"
        class="px-4 py-2 rounded-full font-semibold text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
        [class]="activeCategory() === 'To-Dos' ? 'bg-[#466557] text-white shadow-xs' : 'bg-[#e6f0ea] text-[#414844] hover:bg-[#e1eae4] hover:text-[#151d1a]'"
      >
        <span>✅</span>
        <span>To-Do List</span>
      </button>

      <!-- 3. Ideas -->
      <button
        type="button"
        (click)="categorySelected.emit('Ideas')"
        class="px-4 py-2 rounded-full font-semibold text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
        [class]="activeCategory() === 'Ideas' ? 'bg-[#466557] text-white shadow-xs' : 'bg-[#e6f0ea] text-[#414844] hover:bg-[#e1eae4] hover:text-[#151d1a]'"
      >
        <span>💡</span>
        <span>Idea</span>
      </button>

      <!-- 4. Notes -->
      <button
        type="button"
        (click)="categorySelected.emit('Notes')"
        class="px-4 py-2 rounded-full font-semibold text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
        [class]="activeCategory() === 'Notes' ? 'bg-[#466557] text-white shadow-xs' : 'bg-[#e6f0ea] text-[#414844] hover:bg-[#e1eae4] hover:text-[#151d1a]'"
      >
        <span>📝</span>
        <span>Notes</span>
      </button>
    </div>
  `
})
export class NotesFilterChipsComponent {
  activeCategory = input<NoteFilterCategory>('All');
  totalCount = input<number>(12);
  categorySelected = output<NoteFilterCategory>();
}
