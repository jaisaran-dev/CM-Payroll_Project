import { Component, HostListener, OnInit, inject, input, output } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  HalfDaySession,
  LeaveFormValue,
  LeaveRequest,
  LeaveType,
} from '../../../core/models/leave.model';

function dateRangeValidator(group: AbstractControl): ValidationErrors | null {
  const start = group.get('startDate')?.value;
  const end = group.get('endDate')?.value;
  return start && end && end < start ? { dateRange: true } : null;
}

@Component({
  selector: 'app-leave-form',
  imports: [ReactiveFormsModule],
  templateUrl: './leave-form.html',
  styles: `
    .emp-backdrop {
      animation: empBackdropIn 0.2s ease-out;
    }

    .emp-panel {
      animation: empPanelIn 0.26s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes empBackdropIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes empPanelIn {
      from {
        opacity: 0;
        transform: scale(0.94) translateY(14px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
  `,
})
export class LeaveForm implements OnInit {
  private fb = inject(FormBuilder);

  /** Pass a leave to open the form in edit mode; leave empty to apply a new one. */
  leave = input<LeaveRequest | null>(null);

  closed = output<void>();
  submitted = output<LeaveFormValue>();

  readonly today = this.toIso(new Date());
  submitAttempted = false;

  form = this.fb.nonNullable.group(
    {
      leaveType: ['Full Day' as LeaveType, Validators.required],
      halfDaySession: ['Morning Half' as HalfDaySession],
      startDate: [this.today, Validators.required],
      endDate: [this.today, Validators.required],
      subject: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
      reason: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
    },
    { validators: dateRangeValidator },
  );

  constructor() {
    // Half day is a single date, so keep End Date equal to Start Date
    this.form.controls.leaveType.valueChanges.subscribe((type) => {
      if (type === 'Half Day') {
        this.form.controls.endDate.setValue(this.form.controls.startDate.value);
      }
    });

    this.form.controls.startDate.valueChanges.subscribe((start) => {
      const { leaveType, endDate } = this.form.getRawValue();
      if (leaveType === 'Half Day' || endDate < start) {
        this.form.controls.endDate.setValue(start);
      }
    });
  }

  ngOnInit(): void {
    const l = this.leave();
    if (l) {
      this.form.patchValue({
        leaveType: l.leaveType,
        halfDaySession: l.halfDaySession ?? 'Morning Half',
        startDate: l.startDate,
        endDate: l.endDate,
        subject: l.subject,
        reason: l.reason,
      });
    }
  }

  get isEdit(): boolean {
    return this.leave() !== null;
  }

  get isHalfDay(): boolean {
    return this.form.controls.leaveType.value === 'Half Day';
  }

  get totalDays(): number {
    const { leaveType, startDate, endDate } = this.form.getRawValue();
    if (!startDate || !endDate || endDate < startDate) return 0;
    if (leaveType === 'Half Day') return 0.5;
    const ms = new Date(endDate).getTime() - new Date(startDate).getTime();
    return Math.round(ms / 86400000) + 1;
  }

  invalid(name: 'subject' | 'reason' | 'startDate' | 'endDate'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.submitAttempted);
  }

  @HostListener('document:keydown.escape')
  close(): void {
    this.closed.emit();
  }

  submit(): void {
    this.submitAttempted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const half = v.leaveType === 'Half Day';

    this.submitted.emit({
      leaveType: v.leaveType,
      halfDaySession: half ? v.halfDaySession : undefined,
      startDate: v.startDate,
      endDate: half ? v.startDate : v.endDate,
      subject: v.subject.trim(),
      reason: v.reason.trim(),
      days: this.totalDays,
    });
  }

  private toIso(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
