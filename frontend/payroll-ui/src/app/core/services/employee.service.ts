import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import {
  Employee,
  EmployeeApiResponse,
  SalaryType,
  SystemRole,
  WorkMode,
} from '../models/employee.model';
import { AuthService } from './auth.service';

export interface CreateEmployeePayload {
  name: string;
  workMode: WorkMode;
  salaryType: SalaryType;
  salaryAmount: number;
  email: string;
  password: string;
  systemRole: SystemRole;
}

// Update payload might not include password if not changing it, but we allow it here
export type UpdateEmployeePayload = CreateEmployeePayload;

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly baseUrl = `${environment.apiUrl}/employees`;

  private getHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  getAll(): Observable<Employee[]> {
    return this.http.get<EmployeeApiResponse>(this.baseUrl, { headers: this.getHeaders() }).pipe(
      map((res) => {
        return res.data
          .filter((item) => item.isActive === true)
          .map((item) => ({
            id: item.id,
            name: item.name,
            role: item.workMode as WorkMode,
            salaryType: (item.salaryType === 'DAILY' ? 'DAILY' : 'MONTHLY') as SalaryType,
            salaryAmount: item.salaryAmount,
            workMode: item.workMode as WorkMode,
            email: item.email,
            password: item.password,
            systemRole: item.systemRole as SystemRole,
          }));
      }),
    );
  }

  create(payload: CreateEmployeePayload): Observable<Employee> {
    return this.http.post<Employee>(this.baseUrl, payload, { headers: this.getHeaders() });
  }

  update(id: Employee['id'], payload: UpdateEmployeePayload): Observable<Employee> {
    return this.http.put<Employee>(`${this.baseUrl}/${id}`, payload, {
      headers: this.getHeaders(),
    });
  }

  delete(id: Employee['id']): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, {
      headers: this.getHeaders(),
    });
  }
}
