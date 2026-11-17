// src/app/core/models/api-response.model.ts

/** Shape every Spring Boot endpoint returns, success or error. */
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  timestamp: string;
}
