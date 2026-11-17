import { Component, HostListener, OnInit, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Employee, SalaryType, SystemRole, WorkMode } from '../../../core/models/employee.model';
import {
  CreateEmployeePayload,
  EmployeeService,
  UpdateEmployeePayload,
} from '../../../core/services/employee.service';
import { ToastService } from '../../../core/services/toast.service';
import { CustomSelect, SelectOption } from '../../../shared/components/custom-select/custom-select';
import { Icon } from '../../../shared/components/icon/icon';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [ReactiveFormsModule, Icon, CustomSelect],
  templateUrl: './employee-form.html',
  styleUrl: './employee-form.css',
})
export class EmployeeForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly employeeService = inject(EmployeeService);
  private readonly toast = inject(ToastService);

  employee = input<Employee | null>(null);
  saved = output<Employee>();
  closed = output<void>();

  isSaving = signal(false);
  serverError = signal<string | null>(null);
  passwordVisible = signal(false);

  salaryTypeOptions: SelectOption[] = [
    { label: 'Monthly', value: 'MONTHLY' },
    { label: 'Daily', value: 'DAILY' },
  ];

  workModeOptions: SelectOption[] = [
    { label: 'Work From Home', value: 'WFH' },
    { label: 'Office', value: 'OFFICE' },
    { label: 'On-site', value: 'ON_SITE' },
  ];

  systemRoleOptions: { value: SystemRole; label: string; description: string }[] = [
    { value: 'EMPLOYEE', label: 'Employee', description: 'Standard access' },
    { value: 'ADMIN', label: 'Admin', description: 'Full access' },
  ];

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: [''], // Validator added conditionally in ngOnInit
    salaryType: ['MONTHLY' as SalaryType, Validators.required],
    salaryAmount: [0, [Validators.required, Validators.min(100)]],
    workMode: ['OFFICE' as WorkMode, Validators.required],
    systemRole: ['EMPLOYEE' as SystemRole, Validators.required],
  });

  get isEdit(): boolean {
    return this.employee() !== null;
  }

  ngOnInit(): void {
    const e = this.employee();
    if (e) {
      this.form.patchValue({
        name: e.name,
        email: e.email ?? '',
        password: e.password ?? '',
        salaryType: e.salaryType,
        salaryAmount: e.salaryAmount,
        workMode: e.workMode ?? 'OFFICE',
        systemRole: e.systemRole ?? 'EMPLOYEE',
      });

      this.form.controls.password.setValidators([Validators.minLength(8)]);
      this.form.controls.password.updateValueAndValidity();
    } else {
      this.form.controls.password.addValidators([Validators.required, Validators.minLength(8)]);
      this.form.controls.password.updateValueAndValidity();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.isSaving()) this.closed.emit();
  }

  onSubmit(): void {
    this.serverError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const v = this.form.getRawValue();
    const existing = this.employee();

    // Only send the password if the user actually edited it.
    // Empty string = backend ignores (preserves existing hash).
    const passwordToSend = this.form.controls.password.dirty ? v.password : '';

    const request$ = existing
      ? this.employeeService.update(existing.id, {
          name: v.name,
          email: v.email,
          password: passwordToSend, // <-- not always the prefilled value
          workMode: v.workMode,
          salaryType: v.salaryType,
          salaryAmount: v.salaryAmount,
          systemRole: v.systemRole,
        } satisfies UpdateEmployeePayload)
      : this.employeeService.create({
          name: v.name,
          email: v.email,
          password: v.password,
          workMode: v.workMode,
          salaryType: v.salaryType,
          salaryAmount: v.salaryAmount,
          systemRole: v.systemRole,
        } satisfies CreateEmployeePayload);

    request$.subscribe({
      next: (employee) => {
        this.isSaving.set(false);
        this.saved.emit(employee);
      },
      error: (err: any) => {
        console.error('Failed to save employee', err);
        this.isSaving.set(false);
        const errorMsg = err.error?.message || 'Could not save employee. Please try again.';
        this.serverError.set(errorMsg);
      },
    });
  }

  onCancel(): void {
    if (this.isSaving()) return;
    this.closed.emit();
  }

  togglePassword(): void {
    this.passwordVisible.update((v) => !v);
  }

  showError(name: string): boolean {
    const control = this.form.get(name);
    return !!control && control.invalid && (control.touched || control.dirty);
  }
}
