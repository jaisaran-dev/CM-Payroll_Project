export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';
export type LeaveType = 'Full Day' | 'Half Day';
export type HalfDaySession = 'Morning Half' | 'Afternoon Half';

export interface LeaveRequest {
  id: string; // e.g. LV-001 (Formatted for UI)
  numericId: number; // Original ID from DB
  employeeId?: number; // NEW: For Admin view
  employeeName?: string; // NEW: For Admin view
  leaveType: LeaveType;
  halfDaySession?: HalfDaySession;
  startDate: string;
  endDate: string;
  subject: string;
  reason: string;
  status: LeaveStatus;
  appliedOn: string;
  days: number;
  remark?: string;
}

export interface LeaveFormValue {
  leaveType: LeaveType;
  halfDaySession?: HalfDaySession;
  startDate: string;
  endDate: string;
  subject: string;
  reason: string;
  days: number;
}

export interface CreateLeavePayload {
  startDate: string;
  endDate: string;
  subject: string;
  reason: string;
  leaveType: 'FULL_DAY' | 'HALF_DAY';
  session?: 'MORNING' | 'AFTERNOON';
}
