import type { SalaryType, WorkMode } from '../models/employee.model';

const WORK_MODE_LABELS: Record<string, string> = {
  WFH: 'Work From Home',
  OFFICE: 'Office',
  ON_SITE: 'On Site',
};

const SALARY_TYPE_LABELS: Record<string, string> = {
  MONTHLY: 'Monthly',
  DAILY: 'Daily',
};

function formatUnknownEnum(value: string): string {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function workModeLabel(value: WorkMode | string | null | undefined): string {
  if (!value) return '';
  return WORK_MODE_LABELS[value] ?? formatUnknownEnum(value);
}

export function salaryTypeLabel(value: SalaryType | string | null | undefined): string {
  if (!value) return '';
  return SALARY_TYPE_LABELS[value] ?? formatUnknownEnum(value);
}
