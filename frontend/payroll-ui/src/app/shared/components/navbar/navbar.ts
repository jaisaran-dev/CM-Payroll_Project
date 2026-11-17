// src/app/shared/components/navbar/navbar.ts
import { Component, computed, inject, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

const DEFAULT_TITLE = 'Payroll & Attendance';

@Component({
  selector: 'app-navbar',
  standalone: true,
  template: `
    <header
      class="fixed top-0 right-0 left-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 lg:left-64 lg:px-8"
    >
      <div class="flex items-center gap-3">
        <!-- Menu button (mobile / tablet only) -->
        <button
          type="button"
          (click)="menuClick.emit()"
          class="rounded-lg p-2 text-gray-600 hover:bg-gray-100 focus:outline-none cursor-pointer lg:hidden"
          aria-label="Open menu"
        >
          <svg
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <!-- Changes with the current page: Employees, Attendance, Leave, Payroll -->
        <h1 class="text-lg font-semibold text-gray-900">{{ title() }}</h1>
      </div>

      <div class="flex items-center gap-3 sm:gap-4">
        <div class="hidden text-right sm:block">
          <p class="text-sm font-medium text-gray-900">{{ auth.user()?.name }}</p>
          <p class="text-xs text-gray-500">
            {{ auth.user()?.role === 'SUPER_ADMIN' ? 'Super Admin' : auth.user()?.role }}
          </p>
        </div>

        <div
          class="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white"
        >
          {{ initials() }}
        </div>

        <button
          type="button"
          (click)="onLogout()"
          [disabled]="isLoggingOut()"
          class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ isLoggingOut() ? 'Logging out...' : 'Logout' }}
        </button>
      </div>
    </header>
  `,
})
export class Navbar {
  auth = inject(AuthService);
  private router = inject(Router);

  menuClick = output<void>();
  isLoggingOut = signal(false);

  title = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.currentTitle()),
      startWith(this.currentTitle()),
    ),
    { initialValue: DEFAULT_TITLE },
  );

  initials = computed(() => {
    const name = this.auth.user()?.name ?? '';
    return (
      name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part: string) => part[0].toUpperCase())
        .join('') || 'U'
    );
  });

  onLogout(): void {
    this.isLoggingOut.set(true);

    this.auth.logoutFromServer().subscribe({
      error: () => this.isLoggingOut.set(false),
      complete: () => this.isLoggingOut.set(false),
    });
  }

  private currentTitle(): string {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.title ?? DEFAULT_TITLE;
  }
}
