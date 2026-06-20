'use client';

import {
  TREND_DIRECTION_LABELS,
  TODAY_STATUS_LABELS,
  type JournalDashboard,
  type JournalTodayStatusLevel,
} from '@/domain/journal/types';
import { cn } from '@/lib/cn';

type JournalTodayStatusStripProps = {
  dashboard: JournalDashboard | null;
  isLoading?: boolean;
};

const STATUS_STYLES: Record<JournalTodayStatusLevel, string> = {
  NOT_RECORDED: 'bg-[var(--color-background-secondary)] text-[var(--color-text-secondary)]',
  STABLE: 'bg-journal-success/15 text-journal-success',
  ATTENTION: 'bg-amber-100 text-amber-800',
  RELAPSE: 'bg-red-100 text-red-700',
};

export function JournalTodayStatusStrip({ dashboard, isLoading }: JournalTodayStatusStripProps) {
  if (isLoading) {
    return (
      <div className="journal-status-strip animate-pulse">
        <div className="h-4 w-16 rounded-full bg-[var(--color-background-secondary)]" />
        <div className="h-4 flex-1 rounded bg-[var(--color-background-secondary)]" />
      </div>
    );
  }

  const level = dashboard?.todayStatusLevel ?? 'NOT_RECORDED';
  const summary = dashboard?.todayStatusSummary ?? '오늘 기록 전이에요';
  const trend = dashboard?.trendDirection;

  return (
    <div className="journal-status-strip">
      <span
        className={cn(
          'shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold',
          STATUS_STYLES[level],
        )}
      >
        {TODAY_STATUS_LABELS[level]}
      </span>
      <p className="min-w-0 flex-1 truncate text-[12px] text-[var(--color-text-primary)]">
        {summary}
      </p>
      {trend && trend !== 'UNKNOWN' && (
        <span className="shrink-0 text-[10px] font-medium text-[var(--color-text-tertiary)]">
          {TREND_DIRECTION_LABELS[trend]}
        </span>
      )}
    </div>
  );
}
