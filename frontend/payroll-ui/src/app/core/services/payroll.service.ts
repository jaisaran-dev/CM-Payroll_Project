import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  PayrollListItem,
  PayrollPaymentHistoryItem,
  PayrollPaymentRequest,
} from '../models/payroll.model';

@Injectable({ providedIn: 'root' })
export class PayrollService {
  private readonly api = inject(ApiService);

  getCurrentPayroll(): Observable<PayrollListItem[]> {
    return this.api.get<PayrollListItem[]>('/payroll/admin/list');
  }

  recordPayment(request: PayrollPaymentRequest): Observable<PayrollListItem> {
    return this.api.post<PayrollListItem>('/payroll/admin/payments', request);
  }

  getPaymentHistory(employeeId: number): Observable<PayrollPaymentHistoryItem[]> {
    return this.api.get<PayrollPaymentHistoryItem[]>(`/payroll/admin/${employeeId}/history`);
  }
}
