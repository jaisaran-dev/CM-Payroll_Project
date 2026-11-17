import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CreateLeavePayload,
  LeaveFormValue,
  LeaveRequest,
  LeaveStatus,
} from '../../../core/models/leave.model';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { LeaveService } from '../../../core/services/leave.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  DataTable,
  DataTableCell,
  DataTableColumn,
  FilterConfig,
} from '../../../shared/components/data-table/data-table';
import { LeaveForm } from '../leave-form/leave-form';

interface Column {
  status: LeaveStatus;
  hint: string;
  border: string;
  dot: string;
  badge: string;
  accentBar: string;
  remark: string;
}

@Component({
  selector: 'app-leave-list',
  standalone: true,
  imports: [DatePipe, LeaveForm, CommonModule, FormsModule, DataTable, DataTableCell],
  templateUrl: './leave-list.html',
})
export class LeaveList implements OnInit {
  readonly auth = inject(AuthService);
  private readonly leaveService = inject(LeaveService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly toast = inject(ToastService);

  isLoading = signal(false);

  // ==========================================
  // EMPLOYEE STATE (KANBAN)
  // ==========================================
  readonly columns: Column[] = [
    {
      status: 'Pending',
      hint: 'Waiting for approval',
      border: 'border-amber-400',
      dot: 'bg-amber-400',
      badge: 'bg-amber-100 text-amber-700',
      accentBar: 'bg-amber-400',
      remark: 'bg-amber-50 text-amber-800',
    },
    {
      status: 'Approved',
      hint: 'Approved by manager',
      border: 'border-emerald-500',
      dot: 'bg-emerald-500',
      badge: 'bg-emerald-100 text-emerald-700',
      accentBar: 'bg-emerald-500',
      remark: 'bg-emerald-50 text-emerald-800',
    },
    {
      status: 'Rejected',
      hint: 'Not approved',
      border: 'border-red-500',
      dot: 'bg-red-500',
      badge: 'bg-red-100 text-red-700',
      accentBar: 'bg-red-500',
      remark: 'bg-red-50 text-red-800',
    },
  ];

  showForm = signal(false);
  editing = signal<LeaveRequest | null>(null);
  leaves = signal<LeaveRequest[]>([]);

  readonly grouped = computed(() => {
    const all = this.leaves();
    return {
      Pending: all.filter((l) => l.status === 'Pending'),
      Approved: all.filter((l) => l.status === 'Approved'),
      Rejected: all.filter((l) => l.status === 'Rejected'),
    } as Record<LeaveStatus, LeaveRequest[]>;
  });

  // ==========================================
  // ADMIN STATE (DATA TABLE)
  // ==========================================
  adminLeaves = signal<LeaveRequest[]>([]);
  adminColumns: DataTableColumn<LeaveRequest>[] = [
    { key: 'employeeName', header: 'Employee', sortValue: (l) => l.employeeName || '' },
    { key: 'subject', header: 'Subject', sortValue: (l) => l.subject },
    { key: 'startDate', header: 'Start Date', sortValue: (l) => l.startDate },
    { key: 'endDate', header: 'End Date', sortValue: (l) => l.endDate },
    { key: 'days', header: 'Days', sortValue: (l) => l.days },
    { key: 'status', header: 'Status', sortValue: (l) => l.status },
    { key: 'actions', header: 'Actions', sortValue: () => '' },
  ];

  adminFilters = computed<FilterConfig[]>(() => [
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Pending', value: 'Pending' },
        { label: 'Approved', value: 'Approved' },
        { label: 'Rejected', value: 'Rejected' },
      ],
    },
  ]);

  // Reject modal state
  rejectModalOpen = signal(false);
  rejectTarget = signal<LeaveRequest | null>(null);
  rejectRemark = signal('');

  rowKey = (l: LeaveRequest) => l.numericId;

  ngOnInit(): void {
    if (this.auth.isEmployee()) {
      this.loadLeaves();
    } else if (this.auth.isLoggedIn()) {
      this.loadAdminLeaves();
    }
  }

  // ==========================================
  // EMPLOYEE METHODS
  // ==========================================
  loadLeaves(): void {
    this.isLoading.set(true);
    this.leaveService.getMyLeaves().subscribe({
      next: (data) => {
        this.leaves.set(data.map(this.mapToUI));
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  openApply(): void {
    this.editing.set(null);
    this.showForm.set(true);
  }
  openEdit(leave: LeaveRequest): void {
    this.editing.set(leave);
    this.showForm.set(true);
  }
  closeForm(): void {
    this.showForm.set(false);
    this.editing.set(null);
  }

  onSubmitted(value: LeaveFormValue): void {
    const current = this.editing();
    this.isLoading.set(true);

    const payload: CreateLeavePayload = {
      startDate: value.startDate,
      endDate: value.endDate,
      subject: value.subject,
      reason: value.reason,
      leaveType: value.leaveType === 'Full Day' ? 'FULL_DAY' : 'HALF_DAY',
      session:
        value.leaveType === 'Half Day'
          ? value.halfDaySession === 'Morning Half'
            ? 'MORNING'
            : 'AFTERNOON'
          : undefined,
    };

    const request$ = current
      ? this.leaveService.updateLeave(current.numericId, payload)
      : this.leaveService.applyLeave(payload);
    request$.subscribe({
      next: () => {
        this.closeForm();
        this.loadLeaves();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed.');
        this.isLoading.set(false);
      },
    });
  }

  async askCancel(leave: LeaveRequest): Promise<void> {
    const confirmed = await this.confirmation.confirm({
      title: 'Cancel this request?',
      message: 'This leave request will be withdrawn. This action cannot be undone.',
      detail: leave.subject,
      confirmLabel: 'Yes, cancel',
      intent: 'danger',
    });
    if (!confirmed) return;

    this.isLoading.set(true);
    this.leaveService.cancelLeave(leave.numericId).subscribe({
      next: () => {
        this.loadLeaves();
      },
      error: (err) => {
        this.toast.error('Failed to cancel.');
        this.isLoading.set(false);
      },
    });
  }

  // ==========================================
  // ADMIN METHODS
  // ==========================================
  loadAdminLeaves(): void {
    this.isLoading.set(true);
    this.leaveService.getAllLeaves().subscribe({
      next: (data) => {
        this.adminLeaves.set(data.map(this.mapToUI));
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load all leaves.');
        this.isLoading.set(false);
      },
    });
  }

  async openApproveModal(leave: LeaveRequest): Promise<void> {
    const confirmed = await this.confirmation.confirm({
      title: 'Approve this request?',
      message: 'Are you sure you want to approve the leave request for',
      detail: leave.employeeName,
      confirmLabel: 'Approve request',
    });
    if (!confirmed) return;

    this.isLoading.set(true);
    this.leaveService
      .updateLeaveStatus(leave.numericId, 'APPROVED', 'Approved by Admin')
      .subscribe({
        next: () => {
          this.loadAdminLeaves();
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Failed to approve.');
          this.isLoading.set(false);
        },
      });
  }

  // --- Reject Modal Actions ---
  openRejectModal(leave: LeaveRequest): void {
    this.rejectTarget.set(leave);
    this.rejectRemark.set('');
    this.rejectModalOpen.set(true);
  }

  closeRejectModal(): void {
    this.rejectModalOpen.set(false);
    this.rejectTarget.set(null);
  }

  confirmReject(): void {
    const target = this.rejectTarget();
    if (!target) return;
    if (!this.rejectRemark().trim()) {
      this.toast.error('Please provide a reason for rejection.');
      return;
    }

    this.isLoading.set(true);
    this.leaveService
      .updateLeaveStatus(target.numericId, 'REJECTED', this.rejectRemark())
      .subscribe({
        next: () => {
          this.closeRejectModal();
          this.loadAdminLeaves();
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Failed to reject.');
          this.isLoading.set(false);
        },
      });
  }

  // ==========================================
  // HELPERS
  // ==========================================
  private mapToUI(apiLeave: any): LeaveRequest {
    let days =
      apiLeave.leaveType === 'HALF_DAY'
        ? 0.5
        : Math.round(
            (new Date(apiLeave.endDate).getTime() - new Date(apiLeave.startDate).getTime()) /
              86400000,
          ) + 1;

    return {
      id: `LV-${String(apiLeave.id).padStart(3, '0')}`,
      numericId: apiLeave.id,
      employeeId: apiLeave.employeeId,
      employeeName: apiLeave.employeeName,
      leaveType: apiLeave.leaveType === 'FULL_DAY' ? 'Full Day' : 'Half Day',
      halfDaySession:
        apiLeave.session === 'MORNING'
          ? 'Morning Half'
          : apiLeave.session === 'AFTERNOON'
            ? 'Afternoon Half'
            : undefined,
      startDate: apiLeave.startDate,
      endDate: apiLeave.endDate,
      subject: apiLeave.subject,
      reason: apiLeave.reason,
      status:
        apiLeave.status === 'PENDING'
          ? 'Pending'
          : apiLeave.status === 'APPROVED'
            ? 'Approved'
            : 'Rejected',
      appliedOn: apiLeave.appliedAt
        ? apiLeave.appliedAt.split('T')[0]
        : new Date().toISOString().split('T')[0],
      days: days,
      remark: apiLeave.managerRemark,
    };
  }
}
