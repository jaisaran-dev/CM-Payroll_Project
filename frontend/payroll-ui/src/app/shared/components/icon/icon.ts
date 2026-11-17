import { Component, computed, input } from '@angular/core';

export type IconName =
  | 'search'
  | 'plus'
  | 'check'
  | 'x'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevrons-left'
  | 'chevrons-right'
  | 'chevrons-up-down'
  | 'filter'
  | 'sliders'
  | 'eye'
  | 'pencil'
  | 'trash';

const ICONS: Record<IconName, string[]> = {
  search: ['M3 11a8 8 0 1 0 16 0 8 8 0 1 0-16 0', 'm21 21-4.3-4.3'],
  plus: ['M5 12h14', 'M12 5v14'],
  check: ['M20 6 9 17l-5-5'],
  x: ['M18 6 6 18', 'M6 6l12 12'],
  'chevron-down': ['m6 9 6 6 6-6'],
  'chevron-left': ['m15 18-6-6 6-6'],
  'chevron-right': ['m9 18 6-6-6-6'],
  'chevrons-left': ['m11 17-5-5 5-5', 'm18 17-5-5 5-5'],
  'chevrons-right': ['m6 17 5-5-5-5', 'm13 17 5-5-5-5'],
  'chevrons-up-down': ['m7 15 5 5 5-5', 'm7 9 5-5 5 5'],
  filter: ['M22 3H2l8 9.46V19l4 2v-8.54L22 3z'],
  sliders: [
    'M21 4h-7',
    'M10 4H3',
    'M21 12h-9',
    'M8 12H3',
    'M21 20h-5',
    'M12 20H3',
    'M14 2v4',
    'M8 10v4',
    'M16 18v4',
  ],
  eye: ['M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z', 'M9 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0'],
  pencil: ['M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z', 'm15 5 4 4'],
  trash: [
    'M3 6h18',
    'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6',
    'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2',
    'M10 11v6',
    'M14 11v6',
  ],
};

@Component({
  selector: 'app-icon',
  standalone: true,
  host: { class: 'inline-block shrink-0' },
  template: `
    <svg
      class="block h-full w-full"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="strokeWidth()"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @for (d of paths(); track $index) {
        <path [attr.d]="d" />
      }
    </svg>
  `,
})
export class Icon {
  name = input.required<IconName>();
  strokeWidth = input(2);

  paths = computed(() => ICONS[this.name()]);
}
