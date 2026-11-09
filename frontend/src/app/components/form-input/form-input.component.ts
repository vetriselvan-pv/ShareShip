import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-input',
  imports: [FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormInputComponent),
      multi: true
    }
  ],
  template: `
    <div class="w-full flex flex-col gap-1.5 text-left">
      <!-- Field Label -->
      <label [for]="id()" class="text-[14px] font-medium text-[#151d1a] tracking-tight">
        {{ label() }}
      </label>

      <!-- Soft Input Container -->
      <div 
        class="relative flex items-center bg-[#ecf6f0]/90 hover:bg-[#ecf6f0] border border-[#dbe5df] focus-within:border-[#466557] focus-within:ring-2 focus-within:ring-[#466557]/15 rounded-2xl transition-all duration-200 overflow-hidden"
      >
        <!-- Leading Icon -->
        <div class="pl-4 pr-2.5 flex items-center justify-center text-[#727974] flex-shrink-0">
          @if (type() === 'email') {
            <!-- Envelope Icon -->
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          } @else if (type() === 'password') {
            <!-- Lock Icon -->
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          } @else {
            <!-- Default / Generic Text Icon -->
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          }
        </div>

        <!-- HTML Input Element -->
        <input
          [id]="id()"
          [type]="isPasswordVisible() ? 'text' : type()"
          [placeholder]="placeholder()"
          [disabled]="disabled()"
          [value]="value()"
          (input)="onInputChange($event)"
          (blur)="onTouched()"
          class="w-full py-2.5 pr-3.5 bg-transparent text-[14px] text-[#151d1a] placeholder-[#94938f] focus:outline-none tracking-normal font-sans"
        />

        <!-- Password Visibility Toggle (if password) -->
        @if (type() === 'password') {
          <button
            type="button"
            (click)="togglePasswordVisibility()"
            class="pr-3.5 pl-1 text-[#727974] hover:text-[#151d1a] focus:outline-none transition-colors"
            tabindex="-1"
          >
            @if (isPasswordVisible()) {
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            } @else {
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                <line x1="2" x2="22" y1="2" y2="22"/>
              </svg>
            }
          </button>
        }
      </div>
    </div>
  `
})
export class FormInputComponent implements ControlValueAccessor {
  id = input<string>('input-' + Math.random().toString(36).substring(2, 7));
  label = input.required<string>();
  type = input<'text' | 'email' | 'password'>('text');
  placeholder = input<string>('');
  disabled = input<boolean>(false);

  value = signal<string>('');
  isPasswordVisible = signal<boolean>(false);

  onChange: (val: string) => void = () => {};
  onTouched: () => void = () => {};

  togglePasswordVisibility() {
    this.isPasswordVisible.update(v => !v);
  }

  onInputChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value);
    this.onChange(target.value);
  }

  writeValue(val: string): void {
    this.value.set(val || '');
  }

  registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // Disabled state handled via input signal
  }
}
