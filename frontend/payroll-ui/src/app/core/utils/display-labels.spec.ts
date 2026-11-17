import { describe, expect, it } from 'vitest';
import { salaryTypeLabel, workModeLabel } from './display-labels';

describe('display labels', () => {
  it('formats work modes for tables and filters', () => {
    expect(workModeLabel('ON_SITE')).toBe('On Site');
    expect(workModeLabel('OFFICE')).toBe('Office');
    expect(workModeLabel('WFH')).toBe('Work From Home');
  });

  it('formats salary types for tables', () => {
    expect(salaryTypeLabel('MONTHLY')).toBe('Monthly');
    expect(salaryTypeLabel('DAILY')).toBe('Daily');
  });

  it('formats unknown enum values without exposing underscores', () => {
    expect(workModeLabel('NEW_WORK_MODE')).toBe('New Work Mode');
    expect(salaryTypeLabel(undefined)).toBe('');
  });
});
