import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, DailyAttendance } from '../models/attendance.model';
import { AuthService } from './auth.service';

export interface MarkAttendancePayload {
  employeeId: number;
  attendanceDate: string;
  status: 'PRESENT' | 'ABSENT';
  remarks: string;
}

// NEW: Payload for employee (no ID or Date needed)
export interface EmployeeMarkPayload {
  status: 'PRESENT' | 'ABSENT';
  remarks: string;
}

export interface BulkAttendancePayload {
  employeeIds: number[];
  attendanceDate: string;
  status: 'PRESENT' | 'ABSENT';
  remarks: string;
}

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly baseUrl = `${environment.apiUrl}/attendance`;

  private getHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  // ADMIN: Fetch Daily List
  getDailyAttendance(date: string): Observable<DailyAttendance[]> {
    const params = new HttpParams().set('date', date);
    return this.http
      .get<ApiResponse<DailyAttendance[]>>(`${this.baseUrl}/admin/list`, {
        headers: this.getHeaders(),
        params: params,
      })
      .pipe(map((res) => res.data));
  }

  // ADMIN: Mark Attendance
  markAttendance(payload: MarkAttendancePayload): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/admin/mark`, payload, {
      headers: this.getHeaders(),
    });
  }

  // EMPLOYEE: Mark Own Attendance (NEW)
  markEmployeeAttendance(payload: EmployeeMarkPayload): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/employee/mark`, payload, {
      headers: this.getHeaders(),
    });
  }

  // EMPLOYEE: Fetch today's status
  getTodayEmployeeAttendance(): Observable<any> {
    return this.http
      .get<ApiResponse<any>>(`${this.baseUrl}/employee/today`, {
        headers: this.getHeaders(),
      })
      .pipe(map((res) => res.data));
  }

  markBulkAttendance(payload: BulkAttendancePayload): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/admin/bulk-mark`, payload, {
      headers: this.getHeaders(),
    });
  }
}
