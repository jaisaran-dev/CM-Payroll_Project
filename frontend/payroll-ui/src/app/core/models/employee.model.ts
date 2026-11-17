export type SalaryType = 'MONTHLY' | 'DAILY';
export type WorkMode = 'WFH' | 'OFFICE' | 'ON_SITE';
export type SystemRole = 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE';

export interface Employee {
  id: number;
  name: string;
  role: WorkMode;
  salaryType: SalaryType;
  salaryAmount: number;
  workMode?: WorkMode;
  email?: string;
  systemRole?: SystemRole;
}

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
    systemRole?: string;
  }[];
}
