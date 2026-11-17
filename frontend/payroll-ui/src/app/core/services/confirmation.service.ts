import { Injectable, signal } from '@angular/core';

export interface ConfirmationOptions {
  title: string;
  message: string;
  detail?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  intent?: 'primary' | 'danger';
}

@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  readonly current = signal<ConfirmationOptions | null>(null);
  private resolveCurrent: ((confirmed: boolean) => void) | null = null;

  confirm(options: ConfirmationOptions): Promise<boolean> {
    if (this.resolveCurrent) {
      throw new Error('A confirmation dialog is already open.');
    }

    return new Promise((resolve) => {
      this.resolveCurrent = resolve;
      this.current.set(options);
    });
  }

  close(confirmed: boolean): void {
    const resolve = this.resolveCurrent;
    this.resolveCurrent = null;
    this.current.set(null);
    resolve?.(confirmed);
  }
}
