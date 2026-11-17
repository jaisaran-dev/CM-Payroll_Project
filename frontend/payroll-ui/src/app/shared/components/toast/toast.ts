import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed z-70 top-4 right-4 left-4 sm:left-auto sm:w-96 flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
    >
      <div
        *ngFor="let toast of toastService.toasts()"
        role="alert"
        class="pointer-events-auto flex items-start gap-3 rounded-lg border bg-white p-4 shadow-lg"
        [ngClass]="{
          'border-red-200': toast.type === 'error',
          'border-green-200': toast.type === 'success',
          'border-indigo-200': toast.type === 'info',
        }"
      >
        <!-- Icon -->
        <span
          class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold"
          [ngClass]="{
            'bg-red-500': toast.type === 'error',
            'bg-green-500': toast.type === 'success',
            'bg-indigo-500': toast.type === 'info',
          }"
        >
          {{ toast.type === 'error' ? '!' : toast.type === 'success' ? '✓' : 'i' }}
        </span>

        <p class="flex-1 text-sm text-gray-800">{{ toast.message }}</p>

        <button
          type="button"
          (click)="toastService.dismiss(toast.id)"
          class="shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
          aria-label="Close notification"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  `,
})
export class Toast {
  toastService = inject(ToastService);
}
