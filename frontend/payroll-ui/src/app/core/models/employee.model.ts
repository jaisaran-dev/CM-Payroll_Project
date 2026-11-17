export type SalaryType = 'MONTHLY' | 'DAILY';
export type WorkMode = 'WFH' | 'OFFICE' | 'ON_SITE';
export type SystemRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export interface Employee {
  id: number;
  name: string;
  role: WorkMode;
  salaryType: SalaryType;
  salaryAmount: number;
  workMode?: WorkMode;
  email?: string;
  password?: string | null; // <-- add this
  systemRole?: SystemRole;
}

// Raw API response
export interface EmployeeApiResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    id: number;
    name: string;
    salaryAmount: number;
    salaryType: string;
    workMode?: string;
    isActive?: boolean;
    email?: string;
    password?: string;
    systemRole?: string;
  }[];
}
