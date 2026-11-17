import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Employee, SalaryType } from '../../../core/models/employee.model';
import { EmployeeService } from '../../../core/services/employee.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  DataTable,
  DataTableCell,
  DataTableColumn,
  FilterConfig,
} from '../../../shared/components/data-table/data-table';
import { EmployeeForm } from '../employee-form/employee-form'; // 👈 ADDED

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [DataTable, DataTableCell, CurrencyPipe, EmployeeForm], // 👈 ADDED EmployeeForm
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.css',
})
export class EmployeeList implements OnInit {
  private readonly toast = inject(ToastService);
  private readonly employeeService = inject(EmployeeService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);

  employees = signal<Employee[]>([]);
  isLoading = signal(false);
  loadError = signal<string | null>(null);

  // 👇 ADDED: modal state
  isFormOpen = signal(false);
  editingEmployee = signal<Employee | null>(null);

  columns: DataTableColumn<Employee>[] = [
    { key: 'name', header: 'Name', sortValue: (e) => e.name },
    { key: 'role', header: 'Role', sortValue: (e) => e.role },
    { key: 'salaryType', header: 'Salary Type', sortValue: (e) => e.salaryType },
    { key: 'salaryAmount', header: 'Salary Amount', sortValue: (e) => e.salaryAmount },
  ];

  filters = computed<FilterConfig[]>(() => [
    {
      key: 'role', // maps to workMode
      label: 'Role',
      options: [
        { label: 'Work From Home', value: 'WFH' },
        { label: 'Office', value: 'OFFICE' },
        { label: 'On-site', value: 'ON_SITE' },
      ],
    },
    {
      key: 'salaryType',
      label: 'Salary Type',
      options: [
        { label: 'Monthly', value: 'MONTHLY' },
        { label: 'Daily', value: 'DAILY' },
      ],
    },
  ]);

  rowKey = (e: Employee) => e.id;

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.employeeService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (employees) => {
          this.employees.set(employees);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load employees', err);
          this.isLoading.set(false);
          this.loadError.set('Could not load employees. Please try again.');
          this.toast.error('Failed to load employees.');
        },
      });
  }

  initials(name: string): string {
    return (
      name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join('') || '?'
    );
  }

  salaryTypeLabel(type: SalaryType): string {
    return type === 'MONTHLY' ? 'Monthly' : 'Daily';
  }

  salarySuffix(type: SalaryType): string {
    return type === 'MONTHLY' ? '/mo' : '/day';
  }

  // 👇 REPLACED
  onAdd(): void {
    this.editingEmployee.set(null);
    this.isFormOpen.set(true);
  }

  onView(employee: Employee): void {
    this.toast.info(`View: ${employee.name}`);
  }

  // 👇 REPLACED
  onEdit(employee: Employee): void {
    this.editingEmployee.set(employee);
    this.isFormOpen.set(true);
  }

  async onDelete(employee: Employee): Promise<void> {
    const confirmed = await this.confirmation.confirm({
      title: 'Delete this employee?',
      message: 'This action cannot be undone.',
      detail: employee.name,
      confirmLabel: 'Delete employee',
      intent: 'danger',
    });
    if (!confirmed) return;

    this.isLoading.set(true);
    this.employeeService.delete(employee.id).subscribe({
      next: () => {
        this.loadEmployees(); // Reload the list from the server
      },
      error: (err) => {
        console.error('Failed to delete employee', err);
        this.isLoading.set(false);
        this.toast.error('Failed to delete employee.');
      },
    });
  }

  // 👇 ADDED
  closeForm(): void {
    this.isFormOpen.set(false);
    this.editingEmployee.set(null);
  }

  // 👇 ADDED
  onSaved(_employee: Employee): void {
    this.closeForm();
    this.loadEmployees();
  }
}
