import { Routes } from '@angular/router';
import { RoleGuard } from './core/guards/role-guard';
import { Login } from './features/auth/login/login';
import { MainLayout } from './shared/layout/main-layout';

export const routes: Routes = [
  // Public page (no sidebar / header)
  { path: 'login', component: Login, title: 'Sign in' },

  // Everything below renders inside MainLayout (header + sidebar stay fixed)
  {
    path: '',
    component: MainLayout,
    canActivate: [RoleGuard], // no roles listed = any signed-in user
    children: [
      // Admin & Employee
      {
        path: 'attendance',
        title: 'Attendance', // shown in the header and the browser tab
        loadComponent: () =>
          import('./features/attendance/attendance-list/attendance-list').then(
            (m) => m.AttendanceList,
          ),
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'EMPLOYEE'] },
      },
      {
        path: 'leave',
        title: 'Leave',
        loadComponent: () =>
          import('./features/leave/leave-list/leave-list').then((m) => m.LeaveList),
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'EMPLOYEE'] },
      },

      // Admin only
      {
        path: 'employees',
        title: 'Employees',
        loadComponent: () =>
          import('./features/employees/employee-list/employee-list').then((m) => m.EmployeeList),
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] },
      },
      {
        path: 'payroll',
        title: 'Payroll',
        loadComponent: () =>
          import('./features/payroll/payroll-list/payroll-list').then((m) => m.PayrollList),
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] },
      },

      { path: '', redirectTo: 'attendance', pathMatch: 'full' },
    ],
  },

  { path: '**', redirectTo: 'login' },
];
