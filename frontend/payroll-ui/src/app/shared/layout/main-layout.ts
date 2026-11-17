// src/app/shared/layout/main-layout/main-layout.ts
import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../components/navbar/navbar';
import { Sidebar } from '../components/sidebar/sidebar';

/**
 * Shell for every page after login: sidebar + header stay fixed,
 * and the active page (employees, leave, ...) renders inside <router-outlet />.
 */
@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, Navbar, Sidebar],
  template: `
    <div class="min-h-screen bg-gray-50">
      <app-sidebar [open]="sidebarOpen()" (closed)="sidebarOpen.set(false)" />

      <!-- Content area: pushed right of the sidebar on large screens -->
      <div class="flex min-h-screen flex-col lg:pl-64">
        <app-navbar (menuClick)="sidebarOpen.set(true)" />

        <main class="flex-1 px-4 pt-20 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class MainLayout {
  sidebarOpen = signal(false);
}
