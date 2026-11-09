import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-live-scratchpad-hero',
  imports: [FormsModule],
  template: `
    <div class="relative overflow-hidden bg-[#466557] text-[#ffffff] rounded-2xl p-4 shadow-sm border border-[#2f4d40]/40 flex flex-col gap-3 select-none">
      <!-- Ambient decorative glow -->
      <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-[#fed65b]/15 rounded-full blur-2xl pointer-events-none"></div>

      <!-- Top Header Row -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-full bg-[#fed65b] text-[#745c00] flex items-center justify-center font-bold shadow-2xs">
            <!-- Edit Note Icon -->
            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </div>
          <div class="flex flex-col text-left">
            <h3 class="text-[16px] font-bold text-white tracking-tight leading-tight">
              Live Scratchpad
            </h3>
            <p class="text-[12px] text-[#c8ead9] font-normal leading-snug">
              Shared thoughts happening right now
            </p>
          </div>
        </div>

        <!-- Live Edit Indicator Pill -->
        <div class="flex items-center gap-1.5 bg-[#2f4d40]/60 px-3 py-1 rounded-full border border-[#c8ead9]/20 shadow-2xs">
          <span class="w-2 h-2 rounded-full bg-[#fed65b] live-pulse"></span>
          <span class="text-[11.5px] font-semibold text-[#ffe088]">Live Edit</span>
        </div>
      </div>

      <!-- Scratchpad Content Box -->
      <div class="bg-white/10 rounded-xl p-3.5 backdrop-blur-xs flex flex-col gap-2.5 border border-white/10">
        @if (!isEditing()) {
          <p 
            (click)="startEditing()"
            class="text-[13.5px] leading-relaxed cursor-text transition-colors"
            [class]="scratchpadText() ? 'text-[#f2fcf5] hover:text-white' : 'text-[#c8ead9]/75 italic hover:text-[#e1f5ec]'"
            title="Click to edit live scratchpad"
          >
            {{ scratchpadText() || 'Tap here to add a quick thought, grocery reminder, or shared note...' }}
          </p>
        } @else {
          <textarea
            [(ngModel)]="editText"
            (blur)="saveEditing()"
            (keydown.enter)="$event.preventDefault(); saveEditing()"
            rows="3"
            class="w-full bg-black/20 text-[13.5px] text-white p-2 rounded-lg border border-[#c8ead9]/40 focus:outline-none resize-none"
          ></textarea>
        }

        <!-- Inner Status Row -->
        <div class="flex items-center justify-between pt-1">
          @if (lastEditor()) {
            <div class="flex items-center gap-2">
              @if (editorAvatarUrl()) {
                <img 
                  [src]="editorAvatarUrl()" 
                  [alt]="lastEditor()"
                  class="w-5 h-5 rounded-full object-cover border border-[#c8ead9]/50"
                />
              } @else {
                <div class="w-5 h-5 rounded-full bg-[#fed65b] text-[#745c00] flex items-center justify-center font-bold text-[9px]">
                  {{ lastEditor().charAt(0).toUpperCase() }}
                </div>
              }
              <span class="text-[12px] text-[#c8ead9]">
                {{ lastEditor() }} edited {{ timeAgo() || 'recently' }}
              </span>
            </div>
          } @else {
            <span class="text-[12px] text-[#c8ead9]/80 italic">Click above to start typing</span>
          }

          <span class="text-[11px] font-semibold text-[#fed65b] bg-[#fed65b]/20 px-2 py-0.5 rounded shadow-2xs">
            Saved
          </span>
        </div>
      </div>

      <!-- Footer: Active Collaborators Bar + History Link -->
      <div class="flex items-center justify-between pt-1">
        <!-- Overlapping Contributor Avatars -->
        @if (collaborators().length > 0) {
          <div class="flex items-center -space-x-2">
            @for (c of collaborators(); track c.name) {
              @if (c.avatarUrl) {
                <img 
                  [src]="c.avatarUrl" 
                  [alt]="c.name"
                  class="w-7 h-7 rounded-full object-cover ring-2 ring-[#466557] shadow-2xs"
                />
              } @else {
                <div class="w-7 h-7 rounded-full bg-[#7a9a8b] text-[#133126] text-[10px] font-bold flex items-center justify-center ring-2 ring-[#466557] shadow-2xs">
                  {{ (c.name || 'U').charAt(0).toUpperCase() }}
                </div>
              }
            }
          </div>
        } @else {
          <div></div>
        }

        <!-- History Link -->
        <button
          type="button"
          (click)="onHistoryClick.emit()"
          class="text-[12.5px] font-semibold text-[#ffe088] hover:text-[#fed65b] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
        >
          <!-- Clock / History Icon -->
          <svg class="w-3.5 h-3.5 stroke-current fill-none" viewBox="0 0 24 24" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>History</span>
        </button>
      </div>
    </div>
  `
})
export class LiveScratchpadHeroComponent {
  scratchpadText = input<string>('');
  lastEditor = input<string>('');
  timeAgo = input<string>('');
  editorAvatarUrl = input<string>('');
  collaborators = input<{ name: string; avatarUrl: string }[]>([]);

  textUpdated = output<string>();
  onHistoryClick = output<void>();

  isEditing = signal<boolean>(false);
  editText = signal<string>('');

  startEditing() {
    this.editText.set(this.scratchpadText());
    this.isEditing.set(true);
  }

  saveEditing() {
    const trimmed = this.editText().trim();
    this.isEditing.set(false);
    if (trimmed !== this.scratchpadText()) {
      this.textUpdated.emit(trimmed);
    }
  }
}
