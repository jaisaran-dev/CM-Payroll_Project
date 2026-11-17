import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CreateLeavePayload } from '../models/leave.model';
import { AuthService } from './auth.service';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class LeaveService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly baseUrl = `${environment.apiUrl}/leaves`;

  private getHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  // --- Employee APIs ---
  getMyLeaves(): Observable<any[]> {
    return this.http
      .get<ApiResponse<any[]>>(`${this.baseUrl}/employee/my-leaves`, { headers: this.getHeaders() })
      .pipe(map((res) => res.data));
  }

  applyLeave(payload: CreateLeavePayload): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/employee/apply`, payload, {
      headers: this.getHeaders(),
    });
  }

  updateLeave(id: number, payload: CreateLeavePayload): Observable<any> {
    return this.http.put<ApiResponse<any>>(`${this.baseUrl}/employee/update/${id}`, payload, {
      headers: this.getHeaders(),
    });
  }

  cancelLeave(id: number): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/employee/cancel/${id}`, {
      headers: this.getHeaders(),
    });
  }

  // --- Admin APIs ---
  getAllLeaves(): Observable<any[]> {
    return this.http
      .get<ApiResponse<any[]>>(`${this.baseUrl}/admin/all`, { headers: this.getHeaders() })
      .pipe(map((res) => res.data));
  }

  updateLeaveStatus(id: number, status: 'APPROVED' | 'REJECTED', remark?: string): Observable<any> {
    let params = new HttpParams().set('status', status);
    if (remark) params = params.set('managerRemark', remark);

    return this.http.patch<ApiResponse<any>>(
      `${this.baseUrl}/admin/${id}/status`,
      {},
      {
        headers: this.getHeaders(),
        params: params,
      },
    );
  }
}
