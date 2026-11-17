// src/app/shared/components/checkbox/checkbox.ts
import { Component, input, output } from '@angular/core';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-checkbox',
  standalone: true,
  imports: [Icon],
  template: `
    <button
      type="button"
      role="checkbox"
      [attr.aria-checked]="checked()"
      [attr.aria-label]="ariaLabel()"
      (click)="$event.stopPropagation(); changed.emit()"
      class="flex h-[18px] w-[18px] shrink-0 cursor-pointer items-center justify-center rounded-[5px] border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
      [class]="
        checked() || indeterminate()
          ? 'border-indigo-600 bg-indigo-600'
          : 'border-gray-300 bg-white hover:border-indigo-400'
      "
    >
      @if (checked()) {
        <app-icon name="check" class="h-3 w-3 text-white" [strokeWidth]="3" />
      } @else if (indeterminate()) {
        <span class="h-0.5 w-2 rounded-full bg-white"></span>
      }
    </button>
  `,
})
export class Checkbox {
  checked = input(false);
  indeterminate = input(false);
  ariaLabel = input('Select');
  changed = output<void>();
}
