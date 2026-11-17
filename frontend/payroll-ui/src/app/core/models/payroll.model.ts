export type PayrollPaymentType = 'MONTHLY' | 'DAILY';
export type PayrollPaymentStatus = 'PAID' | 'PARTIAL' | 'PENDING';

export interface PayrollListItem {
  employeeId: number;
  employeeName: string;
  email: string | null;
  paymentType: PayrollPaymentType;
  paidOn: string | null;
  totalDays: number;
  baseSalary: number;
  payableAmount: number;
  paidAmount: number;
  balance: number;
  status: PayrollPaymentStatus;
  periodStart: string;
  periodEnd: string;
  breakdown: string;
}

export interface PayrollPaymentRequest {
  employeeId: number;
  amount: number;
}

export interface PayrollPaymentHistoryItem {
  paymentId: number;
  amount: number;
  paidAt: string;
  paidBy: string;
  payrollMonth: number;
  payrollYear: number;
}
