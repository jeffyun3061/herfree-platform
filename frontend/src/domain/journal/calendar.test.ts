import { describe, expect, it } from 'vitest';
import {
  addJournalMonths,
  buildJournalMonthCalendar,
  buildJournalMonthDays,
  formatJournalDateTitle,
  formatJournalWeekday,
} from '@/domain/journal/calendar';

describe('journal calendar', () => {
  it('builds leap-year February without parsing a date-only value as UTC', () => {
    const days = buildJournalMonthDays('2024-02-01');

    expect(days).toHaveLength(29);
    expect(days[0]).toBe('2024-02-01');
    expect(days.at(-1)).toBe('2024-02-29');
  });

  it('pads a calendar to complete weeks and advances months safely', () => {
    const calendar = buildJournalMonthCalendar('2026-08-01');

    expect(calendar).toHaveLength(42);
    expect(calendar.filter((cell) => cell.date !== null)).toHaveLength(31);
    expect(addJournalMonths('2026-01-01', -1)).toBe('2025-12-01');
  });

  it('formats an ISO date by calendar parts', () => {
    expect(formatJournalDateTitle('2026-07-28')).toBe('2026년 7월 28일');
    expect(formatJournalWeekday('2026-07-28')).toBe('화');
  });
});
