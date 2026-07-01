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

      <button
        type="button"
        onClick={onRecordDaily}
        disabled={isLoading}
        className={cn(
          'journal-record-cta flex w-full items-center justify-center gap-2',
          'rounded-[1rem] border border-[#0B3B36] bg-[#0B3B36] px-4 py-3.5',
          'text-[13px] font-bold text-white shadow-[0_16px_34px_-24px_rgba(11,59,54,.72)]',
          'transition-colors hover:bg-[#0F4F48] disabled:opacity-60',
        )}
      >
        <JournalIcon name="pencil" size={18} />
        {hasTodayRecord ? '오늘 기록 수정하기' : '오늘 기록 시작하기'}
      </button>

      <JournalRoutineCard
        dashboard={dashboard}
        isLoading={isLoading}
        onRoutineItemClick={onRoutineItemClick}
        pulse={routinePulse}
        showEmptyHint={showFirstRecordHint}
      />

      <JournalPrivacyBanner compact />
    </div>
  );
}
