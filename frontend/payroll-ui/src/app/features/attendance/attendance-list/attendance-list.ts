import { CommonModule } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  WritableSignal,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DailyAttendance } from '../../../core/models/attendance.model';
import {
  AttendanceService,
  BulkAttendancePayload,
  MarkAttendancePayload,
} from '../../../core/services/attendance.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  DataTable,
  DataTableCell,
  DataTableColumn,
  FilterConfig,
} from '../../../shared/components/data-table/data-table';

@Component({
  selector: 'app-attendance-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTable, DataTableCell],
  templateUrl: './attendance-list.html',
  styleUrl: './attendance-list.css',
})
export class AttendanceList implements OnInit, OnDestroy {
  private readonly attendanceService = inject(AttendanceService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

  // Reference to the table so we can reset its internal checkbox state
  @ViewChild(DataTable) table?: DataTable<DailyAttendance>;

  // Role check
  isAdmin = false;

  readonly todayDate = new Date().toISOString().split('T')[0];
  selectedDate = signal<string>(this.todayDate);

  // --- Admin State ---
  attendanceList = signal<DailyAttendance[]>([]);
  isLoading = signal(false);
  isMarking = signal<number | null>(null);
  selectedEmployeeIds = signal<number[]>([]);
  isBulkMarking = signal(false);

  columns: DataTableColumn<DailyAttendance>[] = [
    { key: 'name', header: 'Employee Name', sortValue: (e) => e.name },
    { key: 'role', header: 'Role', sortValue: (e) => e.role },
    { key: 'status', header: 'Status', sortValue: (e) => e.status },
    { key: 'remarks', header: 'Remarks', sortValue: (e) => e.remarks },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      className: 'text-center',
    },
  ];

  filters = computed<FilterConfig[]>(() => [
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Present', value: 'PRESENT' },
        { label: 'Absent', value: 'ABSENT' },
        { label: 'Not Marked', value: 'NOT_MARKED' },
      ],
    },
  ]);

  rowKey = (e: DailyAttendance) => e.employeeId;

  // --- Summary counts (source of truth) ---
  readonly totalCount = computed(() => this.attendanceList().length);
  readonly presentCount = computed(
    () => this.attendanceList().filter((r) => r.status === 'PRESENT').length,
  );
  readonly absentCount = computed(
    () => this.attendanceList().filter((r) => r.status === 'ABSENT').length,
  );

  // --- Animated counters (what the cards render) ---
  readonly animatedTotal = signal(0);
  readonly animatedPresent = signal(0);
  readonly animatedAbsent = signal(0);

  private readonly animationFrames = new Map<string, number>();

  // --- Selection-derived flags used to disable the bulk buttons ---
  readonly selectedRows = computed(() => {
    const ids = new Set(this.selectedEmployeeIds());
    return this.attendanceList().filter((r) => ids.has(r.employeeId));
  });

  readonly allSelectedPresent = computed(() => {
    const rows = this.selectedRows();
    return rows.length > 0 && rows.every((r) => r.status === 'PRESENT');
  });

  readonly allSelectedAbsent = computed(() => {
    const rows = this.selectedRows();
    return rows.length > 0 && rows.every((r) => r.status === 'ABSENT');
  });

  constructor() {
    effect(() => {
      this.animateCounter('total', this.totalCount(), this.animatedTotal);
      this.animateCounter('present', this.presentCount(), this.animatedPresent);
      this.animateCounter('absent', this.absentCount(), this.animatedAbsent);
    });
  }

  // --- Employee State ---
  employeeRemarks = '';
  isEmployeeMarking = signal(false);
  currentStatus = signal<string | null>(null);
  isLoadingStatus = signal(false);

  ngOnInit(): void {
    const role = this.auth.getRole ? this.auth.getRole() : localStorage.getItem('role');
    this.isAdmin = role === 'ADMIN';

    if (this.isAdmin) {
      this.loadAttendance();
    } else {
      this.loadTodayStatus();
    }
  }

  ngOnDestroy(): void {
    this.animationFrames.forEach((id) => cancelAnimationFrame(id));
    this.animationFrames.clear();
  }

  // ==========================================
  // COUNTER ANIMATION
  // ==========================================
  private animateCounter(key: string, target: number, valueSignal: WritableSignal<number>): void {
    const runningFrame = this.animationFrames.get(key);
    if (runningFrame !== undefined) {
      cancelAnimationFrame(runningFrame);
      this.animationFrames.delete(key);
    }

    const start = untracked(valueSignal);
    if (start === target) return;

    const duration = 800;
    const startTime = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      valueSignal.set(Math.round(start + (target - start) * eased));

      if (progress < 1) {
        this.animationFrames.set(key, requestAnimationFrame(step));
      } else {
        this.animationFrames.delete(key);
        valueSignal.set(target);
      }
    };

    this.animationFrames.set(key, requestAnimationFrame(step));
  }

  // ==========================================
  // ADMIN METHODS
  // ==========================================
  onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedDate.set(input.value);

    this.clearSelection();

    this.loadAttendance();
  }

  loadAttendance(): void {
    if (!this.isAdmin) return;

    this.isLoading.set(true);
    this.attendanceService.getDailyAttendance(this.selectedDate()).subscribe({
      next: (data) => {
        this.attendanceList.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load attendance', err);
        this.toast.error('Failed to load attendance list.');
        this.isLoading.set(false);
      },
    });
  }

  onMarkAttendance(employeeId: number, status: 'PRESENT' | 'ABSENT'): void {
    this.isMarking.set(employeeId);

    const payload: MarkAttendancePayload = {
      employeeId: employeeId,
      attendanceDate: this.selectedDate(),
      status: status,
      remarks: status === 'PRESENT' ? 'Marked Present by Admin' : 'Marked Absent by Admin',
    };

    this.attendanceService.markAttendance(payload).subscribe({
      next: () => {
        this.loadAttendance();
        this.isMarking.set(null);
      },
      error: (err) => {
        console.error('Failed to mark attendance', err);
        this.toast.error(err.error?.message || 'Failed to mark attendance.');
        this.isMarking.set(null);
      },
    });
  }

  onSelectionChange(keys: any[]): void {
    const ids = keys.map((k) => (typeof k === 'object' ? k.employeeId : k));
    this.selectedEmployeeIds.set(ids);
  }

  onBulkMark(status: 'PRESENT' | 'ABSENT'): void {
    const ids = this.selectedEmployeeIds();
    if (ids.length === 0) return;

    this.isBulkMarking.set(true);

    const payload: BulkAttendancePayload = {
      employeeIds: ids,
      attendanceDate: this.selectedDate(),
      status: status,
      remarks: `Bulk marked ${status} by Admin`,
    };

    this.attendanceService.markBulkAttendance(payload).subscribe({
      next: () => {
        this.clearSelection();
        this.isBulkMarking.set(false);
        this.loadAttendance();
      },
      error: (err) => {
        console.error('Failed to bulk mark', err);
        this.toast.error(err.error?.message || 'Failed to bulk mark attendance.');
        this.isBulkMarking.set(false);
      },
    });
  }

  /** Centralised helper so any "reset selection" flow stays consistent. */
  private clearSelection(): void {
    this.selectedEmployeeIds.set([]);
    this.table?.clearSelection();
  }

  // ==========================================
  // EMPLOYEE METHODS
  // ==========================================
  loadTodayStatus(): void {
    this.isLoadingStatus.set(true);
    this.attendanceService.getTodayEmployeeAttendance().subscribe({
      next: (data) => {
        if (data && data.status) {
          this.currentStatus.set(data.status);
          this.employeeRemarks = data.remarks || '';
        } else {
          this.currentStatus.set(null);
        }
        this.isLoadingStatus.set(false);
      },
      error: (err) => {
        console.error('Failed to load today status', err);
        this.isLoadingStatus.set(false);
      },
    });
  }

  /** Template-facing wrapper so the "Clear" button resets parent + table state together. */
  clearSelectionFromTemplate(): void {
    this.clearSelection();
  }

  onMarkSelf(status: 'PRESENT' | 'ABSENT'): void {
    this.isEmployeeMarking.set(true);

    const payload = {
      status: status,
      remarks: this.employeeRemarks || (status === 'PRESENT' ? 'Marked Present' : 'Marked Absent'),
    };

    this.attendanceService.markEmployeeAttendance(payload).subscribe({
      next: () => {
        this.currentStatus.set(status);
        this.isEmployeeMarking.set(false);
      },
      error: (err) => {
        console.error('Failed to mark attendance', err);
        this.toast.error(err.error?.message || 'Failed to mark attendance.');
        this.isEmployeeMarking.set(false);
      },
    });
  }
}
