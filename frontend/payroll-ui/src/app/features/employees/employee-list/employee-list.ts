import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Employee, SalaryType } from '../../../core/models/employee.model';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { ToastService } from '../../../core/services/toast.service';
import { salaryTypeLabel, workModeLabel } from '../../../core/utils/display-labels';
import {
  DataTable,
  DataTableCell,
  DataTableColumn,
  FilterConfig,
} from '../../../shared/components/data-table/data-table';
import { EmployeeForm } from '../employee-form/employee-form';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [DataTable, DataTableCell, CurrencyPipe, EmployeeForm],
  templateUrl: './employee-list.html',
})
export class EmployeeList implements OnInit {
  private readonly toast = inject(ToastService);
  private readonly employeeService = inject(EmployeeService);
  private readonly auth = inject(AuthService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);

  employees = signal<Employee[]>([]);
  isLoading = signal(false);
  loadError = signal<string | null>(null);

  isFormOpen = signal(false);
  editingEmployee = signal<Employee | null>(null);

  columns: DataTableColumn<Employee>[] = [
    { key: 'name', header: 'Name', sortValue: (e) => e.name },
    {
      key: 'role',
      header: 'Role',
      accessor: (employee) => workModeLabel(employee.role),
      sortValue: (employee) => employee.role,
    },
    {
      key: 'systemRole',
      header: 'Access Level',
      accessor: (e) => this.accessLevelLabel(e.systemRole),
      sortValue: (e) => e.systemRole ?? 'EMPLOYEE',
    },
    {
      key: 'salaryType',
      header: 'Salary Type',
      accessor: (employee) => salaryTypeLabel(employee.salaryType),
      sortValue: (employee) => employee.salaryType,
    },
    { key: 'salaryAmount', header: 'Salary Amount', sortValue: (e) => e.salaryAmount },
  ];

  filters = computed<FilterConfig[]>(() => [
    {
      key: 'role',
      label: 'Role',
      options: [
        { label: 'Work From Home', value: 'WFH' },
        { label: 'Office', value: 'OFFICE' },
        { label: 'On Site', value: 'ON_SITE' },
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
  canDeleteEmployee = (employee: Employee): boolean => employee.id !== this.auth.user()?.employeeId;

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
          const currentEmployeeId = this.auth.user()?.employeeId;
          this.employees.set(
            currentEmployeeId == null
              ? employees
              : employees.filter((employee) => employee.id !== currentEmployeeId),
          );
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

  salarySuffix(type: SalaryType): string {
    return type === 'MONTHLY' ? '/mo' : '/day';
  }

  accessLevelLabel(systemRole: Employee['systemRole']): string {
    switch (systemRole) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'ADMIN':
        return 'Admin';
      default:
        return 'Employee';
    }
  }

  onAdd(): void {
    this.editingEmployee.set(null);
    this.isFormOpen.set(true);
  }

  onView(employee: Employee): void {
    this.toast.info(`View: ${employee.name}`);
  }

  onEdit(employee: Employee): void {
    this.editingEmployee.set(employee);
    this.isFormOpen.set(true);
  }

  async onDelete(employee: Employee): Promise<void> {
    if (!this.canDeleteEmployee(employee)) return;

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
        this.loadEmployees();
      },
      error: (err) => {
        console.error('Failed to delete employee', err);
        this.isLoading.set(false);
        this.toast.error('Failed to delete employee.');
      },
    });
  }

  closeForm(): void {
    this.isFormOpen.set(false);
    this.editingEmployee.set(null);
  }

  onSaved(): void {
    this.closeForm();
    this.loadEmployees();
  }
}
