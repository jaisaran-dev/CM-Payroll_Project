export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'NOT_MARKED';

export interface DailyAttendance {
  employeeId: number;
  name: string;
  role: string;
  status: AttendanceStatus;
  remarks: string;
}

// Standard API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}
