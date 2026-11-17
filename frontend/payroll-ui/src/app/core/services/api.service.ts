// src/app/core/services/api.service.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

type QueryParams = Record<string, string | number | boolean | undefined | null>;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  get<T>(path: string, params?: QueryParams): Observable<T> {
    return this.http
      .get<ApiResponse<T>>(`${this.baseUrl}${path}`, { params: this.toParams(params) })
      .pipe(map((res) => res.data));
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(`${this.baseUrl}${path}`, body)
      .pipe(map((res) => res.data));
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .put<ApiResponse<T>>(`${this.baseUrl}${path}`, body)
      .pipe(map((res) => res.data));
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .patch<ApiResponse<T>>(`${this.baseUrl}${path}`, body)
      .pipe(map((res) => res.data));
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}${path}`).pipe(map((res) => res.data));
  }

  private toParams(params?: QueryParams): HttpParams {
    let httpParams = new HttpParams();
    if (!params) return httpParams;
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return httpParams;
  }
}
