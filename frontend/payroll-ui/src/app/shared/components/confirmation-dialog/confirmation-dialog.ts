import { Component, HostListener, inject } from '@angular/core';
import { ConfirmationService } from '../../../core/services/confirmation.service';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  template: `
    @if (confirmation.current(); as dialog) {
      <div
        class="app-modal-backdrop fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      >
        <section
          class="app-modal-panel w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirmation-title"
          aria-describedby="confirmation-message"
          (click)="$event.stopPropagation()"
        >
          <div
            class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
            [class]="
              dialog.intent === 'danger' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'
            "
          >
            @if (dialog.intent === 'danger') {
              <span class="text-xl font-bold" aria-hidden="true">!</span>
            } @else {
              <svg
                class="h-6 w-6"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            }
          </div>

          <h2 id="confirmation-title" class="text-center text-lg font-bold text-slate-900">
            {{ dialog.title }}
          </h2>
          <p id="confirmation-message" class="mt-2 text-center text-sm leading-6 text-slate-600">
            {{ dialog.message }}
          </p>
          @if (dialog.detail) {
            <p class="mt-1 text-center text-sm font-semibold text-slate-800">{{ dialog.detail }}</p>
          }

          <div class="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              (click)="confirmation.close(false)"
              class="cursor-pointer app-control rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
            >
              {{ dialog.cancelLabel || 'Cancel' }}
            </button>
            <button
              type="button"
              (click)="confirmation.close(true)"
              [class]="
                dialog.intent === 'danger'
                  ? 'cursor-pointer app-control rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600'
                  : 'cursor-pointer app-control rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
              "
            >
              {{ dialog.confirmLabel || 'Confirm' }}
            </button>
          </div>
        </section>
      </div>
    }
  `,
})
export class ConfirmationDialog {
  readonly confirmation = inject(ConfirmationService);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.confirmation.current()) {
      this.confirmation.close(false);
    }
  }
}
