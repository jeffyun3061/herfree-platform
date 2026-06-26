'use client';

import type { JournalDashboard } from '@/domain/journal/types';
import type { RoutineItemId } from '@/domain/journal/routine';
import { JournalDashboardHero } from '@/components/journal/JournalDashboardHero';
import { JournalTodayStatusStrip } from '@/components/journal/JournalTodayStatusStrip';
import { JournalTodayRecordSummary } from '@/components/journal/JournalTodayRecordSummary';
import { JournalRoutineCard } from '@/components/journal/JournalRoutineCard';
import { JournalPrivacyBanner } from '@/components/journal/JournalPrivacyBanner';
import { JournalIcon } from '@/components/journal/JournalIcon';
import { cn } from '@/lib/cn';

type JournalHomeTabProps = {
  dashboard: JournalDashboard | null;
  isLoading: boolean;
  hasTodayRecord?: boolean;
  routinePulse?: boolean;
  onRecordDaily: () => void;
  onRecordRelapse?: () => void;
  onRoutineItemClick?: (itemId: RoutineItemId) => void;
};

export function JournalHomeTab({
  dashboard,
  isLoading,
  hasTodayRecord,
  routinePulse,
  onRecordDaily,
  onRecordRelapse,
  onRoutineItemClick,
}: JournalHomeTabProps) {
  const showFirstRecordHint = !isLoading && hasTodayRecord === false;

  return (
    <div className="journal-page-stack mx-auto w-full max-w-app">
      <JournalDashboardHero
        dashboard={dashboard}
        isLoading={isLoading}
        showFirstRecordHint={showFirstRecordHint}
        onRecordRelapse={onRecordRelapse}
      />

      <JournalTodayStatusStrip dashboard={dashboard} isLoading={isLoading} />

      {dashboard?.todayRecord?.hadSymptoms && (
        <JournalTodayRecordSummary
          record={dashboard.todayRecord}
          isLoading={isLoading}
          onEdit={onRecordDaily}
        />
      )}

      <JournalRoutineCard
        dashboard={dashboard}
        isLoading={isLoading}
        onRoutineItemClick={onRoutineItemClick}
        pulse={routinePulse}
        showEmptyHint={showFirstRecordHint}
      />

      <button
        type="button"
        onClick={onRecordDaily}
        disabled={isLoading}
        className={cn(
          'journal-record-cta flex w-full items-center justify-center gap-2',
          'rounded-[1rem] border border-[var(--color-border-tertiary)]',
          'bg-[var(--color-background-primary)] px-4 py-3',
          'text-[12px] font-semibold text-[var(--color-text-primary)] shadow-sm',
          'transition-colors hover:border-primary/25 hover:bg-[var(--color-background-secondary)]/80',
          'disabled:opacity-60',
        )}
      >
        <JournalIcon name="pencil" size={18} />
        {hasTodayRecord ? '오늘 기록 수정' : '오늘 기록하기'}
      </button>

      <JournalPrivacyBanner compact />
    </div>
  );
}
