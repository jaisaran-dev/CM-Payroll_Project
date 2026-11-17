import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  OnDestroy,
  OnInit,
  WritableSignal,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  PayrollListItem,
  PayrollPaymentHistoryItem,
  PayrollPaymentStatus,
} from '../../../core/models/payroll.model';
import { PayrollService } from '../../../core/services/payroll.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  DataTable,
  DataTableCell,
  DataTableColumn,
} from '../../../shared/components/data-table/data-table';

type PaymentStatus = 'Paid' | 'Partial' | 'Pending';
type PayrollCategory = 'MONTHLY' | 'DAILY';
type PaymentView = 'ALL' | PayrollCategory;

interface PayrollRow {
  id: number;
  employeeId: number;
  category: PayrollCategory;
  name: string;
  email: string;
  paymentDate: string | null;
  periodStart: string;
  periodEnd: string;
  workedDays: number;
  baseSalary: number;
  payableAmount: number;
  paidAmount: number;
  balance: number;
  status: PaymentStatus;
  breakdown: string;
  dailyRate?: number;
}

@Component({
  selector: 'app-payroll-list',
  standalone: true,
  imports: [DataTable, DataTableCell, CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './payroll-list.html',
  styleUrl: './payroll-list.css',
})
export class PayrollList implements OnInit, OnDestroy {
  private readonly payrollService = inject(PayrollService);
  private readonly toast = inject(ToastService);

  readonly payrollRows = signal<PayrollRow[]>([]);
  readonly isLoading = signal(true);
  readonly isRecordingPayment = signal(false);
  readonly activeView = signal<PaymentView>('ALL');
  readonly visiblePayroll = computed(() => {
    const view = this.activeView();
    return this.payrollRows().filter((row) => {
      if (view !== 'ALL' && row.category !== view) return false;
      return true;
    });
  });
  readonly payrollSummary = computed(() => {
    const rows = this.visiblePayroll();
    return {
      totalPayroll: rows.reduce((total, row) => total + row.payableAmount, 0),
      totalPaid: rows.reduce((total, row) => total + row.paidAmount, 0),
      outstandingBalance: rows.reduce((total, row) => total + row.balance, 0),
      employeeCount: new Set(rows.map((row) => row.employeeId)).size,
    };
  });
  readonly visibleColumns = computed(() => {
    return this.allColumns;
  });
  readonly rowKey = (row: PayrollRow) => row.id;

  readonly allColumns: DataTableColumn<PayrollRow>[] = [
    { key: 'employee', header: 'Employee', sortable: false },
    { key: 'paymentDate', header: 'Paid on', sortValue: (row) => row.paymentDate ?? '' },
    { key: 'category', header: 'Payment type', sortValue: (row) => row.category },
    { key: 'workDays', header: 'Total days', sortValue: (row) => row.workedDays },
    { key: 'payableAmount', header: 'Payable', sortValue: (row) => row.payableAmount },
    { key: 'paidAmount', header: 'Paid', sortValue: (row) => row.paidAmount },
    { key: 'balance', header: 'Balance', sortValue: (row) => row.balance },
    { key: 'status', header: 'Status', sortable: false },
    { key: 'actions', header: 'Actions', sortable: false },
  ];

  readonly animatedTotalPayable = signal(0);
  readonly animatedTotalPaid = signal(0);
  readonly animatedTotalBalance = signal(0);
  readonly animatedEmployeeCount = signal(0);
  readonly paymentToRecord = signal<PayrollRow | null>(null);
  readonly paymentFormError = signal<string | null>(null);
  readonly paymentHistory = signal<PayrollPaymentHistoryItem[]>([]);
  readonly isLoadingPaymentHistory = signal(false);
  readonly paymentHistoryError = signal<string | null>(null);
  private readonly historyEmployeeId = signal<number | null>(null);
  paymentDraftAmount = 0;
  readonly viewingPayment = signal<PayrollRow | null>(null);

  private readonly animationFrames = new Map<string, number>();

  constructor() {
    effect(() => {
      const summary = this.payrollSummary();
      this.animateCounter('payable', summary.totalPayroll, this.animatedTotalPayable);
      this.animateCounter('paid', summary.totalPaid, this.animatedTotalPaid);
      this.animateCounter('balance', summary.outstandingBalance, this.animatedTotalBalance);
      this.animateCounter('employees', summary.employeeCount, this.animatedEmployeeCount);
    });
  }

  ngOnInit(): void {
    this.loadPayroll();
  }

  ngOnDestroy(): void {
    this.animationFrames.forEach((frame) => cancelAnimationFrame(frame));
    this.animationFrames.clear();
  }

  selectView(view: PaymentView): void {
    this.activeView.set(view);
  }

  loadPayroll(): void {
    this.isLoading.set(true);
    this.payrollService.getCurrentPayroll().subscribe({
      next: (items) => {
        this.payrollRows.set(items.map((item) => this.toPayrollRow(item)));
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load payroll', error);
        this.toast.error(error.error?.message || 'Failed to load payroll list.');
        this.isLoading.set(false);
      },
    });
  }

  openPayment(row: PayrollRow): void {
    this.viewingPayment.set(row);
    this.loadPaymentHistory(row.employeeId);
  }

  loadPaymentHistory(employeeId: number): void {
    this.historyEmployeeId.set(employeeId);
    this.paymentHistory.set([]);
    this.paymentHistoryError.set(null);
    this.isLoadingPaymentHistory.set(true);

    this.payrollService.getPaymentHistory(employeeId).subscribe({
      next: (history) => {
        if (this.historyEmployeeId() !== employeeId) return;
        this.paymentHistory.set(history);
        this.isLoadingPaymentHistory.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (this.historyEmployeeId() !== employeeId) return;
        console.error('Failed to load payment history', error);
        this.paymentHistoryError.set(error.error?.message || 'Failed to load payment history.');
        this.isLoadingPaymentHistory.set(false);
      },
    });
  }

  openRecordPayment(row: PayrollRow): void {
    if (row.balance <= 0) return;
    this.paymentDraftAmount = row.balance;
    this.paymentFormError.set(null);
    this.viewingPayment.set(null);
    this.paymentToRecord.set(row);
  }

  closePaymentModals(): void {
    this.viewingPayment.set(null);
    this.paymentToRecord.set(null);
    this.paymentFormError.set(null);
    this.paymentHistory.set([]);
    this.paymentHistoryError.set(null);
    this.isLoadingPaymentHistory.set(false);
    this.historyEmployeeId.set(null);
  }

  recordPayment(): void {
    const row = this.paymentToRecord();
    if (!row || this.isRecordingPayment()) return;

    const amountInCents = Math.round(this.paymentDraftAmount * 100);
    const balanceInCents = Math.round(row.balance * 100);
    if (!Number.isFinite(this.paymentDraftAmount) || amountInCents <= 0) {
      this.paymentFormError.set('Enter a payment amount greater than zero.');
      return;
    }
    if (amountInCents > balanceInCents) {
      this.paymentFormError.set('Payment cannot be more than the remaining balance.');
      return;
    }

    this.isRecordingPayment.set(true);
    this.payrollService
      .recordPayment({
        employeeId: row.employeeId,
        amount: amountInCents / 100,
      })
      .subscribe({
        next: (item) => {
          const updatedRow = this.toPayrollRow(item);
          this.payrollRows.update((rows) =>
            rows.map((current) =>
              current.employeeId === updatedRow.employeeId ? updatedRow : current,
            ),
          );

          this.isRecordingPayment.set(false);
          this.closePaymentModals();
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to record payroll payment', error);
          this.paymentFormError.set(error.error?.message || 'Failed to record payment.');
          this.isRecordingPayment.set(false);
        },
      });
  }

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
  }

  statusClass(status: PaymentStatus): string {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-50 text-emerald-700 ring-emerald-600/15';
      case 'Partial':
        return 'bg-amber-50 text-amber-700 ring-amber-600/15';
      case 'Pending':
        return 'bg-gray-100 text-gray-600 ring-gray-500/15';
    }
  }

  categoryLabel(category: PayrollCategory): string {
    return category === 'MONTHLY' ? 'Monthly' : 'Daily';
  }

  private toPayrollRow(item: PayrollListItem): PayrollRow {
    const status: Record<PayrollPaymentStatus, PaymentStatus> = {
      PAID: 'Paid',
      PARTIAL: 'Partial',
      PENDING: 'Pending',
    };

    return {
      id: item.employeeId,
      employeeId: item.employeeId,
      category: item.paymentType,
      name: item.employeeName,
      email: item.email ?? '',
      paymentDate: item.paidOn,
      periodStart: item.periodStart,
      periodEnd: item.periodEnd,
      workedDays: item.totalDays,
      baseSalary: item.baseSalary,
      payableAmount: item.payableAmount,
      paidAmount: item.paidAmount,
      balance: item.balance,
      status: status[item.status],
      breakdown: item.breakdown,
      dailyRate: item.paymentType === 'DAILY' ? item.baseSalary : undefined,
    };
  }

  get tableTitle(): string {
    switch (this.activeView()) {
      case 'MONTHLY':
        return 'Monthly payment employees';
      case 'DAILY':
        return 'Daily payment employees';
      default:
        return 'All payroll employees';
    }
  }

  downloadPayslip(row: PayrollRow): void {
    const calculation =
      row.category === 'DAILY'
        ? `${row.workedDays} days x INR ${this.formatAmount(row.dailyRate ?? 0)} per day`
        : `Monthly salary / 30 x ${row.workedDays} present days`;
    const lines = [
      'PAYSLIP',
      `Employee: ${row.name}`,
      `Email: ${row.email}`,
      `Payment type: ${this.categoryLabel(row.category)}`,
      `Payment date: ${row.paymentDate}`,
      `Payroll period: ${this.periodLabel(row)}`,
      `Present days: ${row.workedDays}`,
      `Calculation: ${calculation}`,
      `Payable amount: INR ${this.formatAmount(row.payableAmount)}`,
      `Paid amount: INR ${this.formatAmount(row.paidAmount)}`,
      `Balance: INR ${this.formatAmount(row.balance)}`,
      `Status: ${row.status}`,
    ];
    const content = lines
      .map(
        (line, index) =>
          `BT\n/F1 ${index === 0 ? 20 : 12} Tf\n50 ${790 - index * 32} Td\n(${this.escapePdfText(line)}) Tj\nET`,
      )
      .join('\n');
    const pdf = this.createPdf(content);
    const file = new Blob([pdf], { type: 'application/pdf' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    const safeName = row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    link.href = url;
    link.download = `payslip-${safeName}.pdf`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  periodLabel(row: PayrollRow): string {
    const date = new Date(`${row.periodStart}T12:00:00`);
    return this.payrollMonthLabel(date.getMonth() + 1, date.getFullYear());
  }

  payrollMonthLabel(month: number, year: number): string {
    return new Date(year, month - 1, 1).toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric',
    });
  }

  private formatAmount(amount: number): string {
    return amount.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }

  private escapePdfText(value: string): string {
    return value.replace(/[^\x20-\x7E]/g, '?').replace(/([\\()])/g, '\\$1');
  }

  private createPdf(content: string): string {
    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
      `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    ];

    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((object, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });

    const crossReferenceOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (const offset of offsets.slice(1)) {
      pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
    }
    return (
      pdf +
      `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${crossReferenceOffset}\n%%EOF`
    );
  }

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
}
