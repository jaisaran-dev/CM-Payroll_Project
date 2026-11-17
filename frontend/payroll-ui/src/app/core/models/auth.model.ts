export type UserRole = 'EMPLOYEE' | 'ADMIN' | 'MANAGER';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponseData {
  token: string;
  refreshToken: string;
  role: UserRole;
  employeeId: number | null;
  name?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponseData {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  email: string;
  name: string;
  role: UserRole;
  employeeId: number | null;
}
