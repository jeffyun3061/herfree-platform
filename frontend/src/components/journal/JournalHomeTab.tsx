'use client';

import type { JournalDashboard, JournalRecord } from '@/domain/journal/types';
import type { RoutineItemId } from '@/domain/journal/routine';
import { JournalDashboardCard } from '@/components/journal/JournalDashboardCard';
import { JournalTodayStatusStrip } from '@/components/journal/JournalTodayStatusStrip';
import { JournalTodayRecordSummary } from '@/components/journal/JournalTodayRecordSummary';
import { JournalRoutineCard } from '@/components/journal/JournalRoutineCard';
import { JournalPrivacyBanner } from '@/components/journal/JournalPrivacyBanner';

type JournalHomeTabProps = {
  dashboard: JournalDashboard | null;
  lastRecord?: JournalRecord | null;
  isLoading: boolean;
  hasTodayRecord?: boolean;
  routinePulse?: boolean;
  onRecordDaily: () => void;
  onRecordRelapse?: () => void;
  onRoutineItemClick?: (itemId: RoutineItemId) => void;
};

export function JournalHomeTab({
  dashboard,
  lastRecord,
  isLoading,
  hasTodayRecord,
  routinePulse,
  onRecordDaily,
  onRecordRelapse,
  onRoutineItemClick,
}: JournalHomeTabProps) {
  const showFirstRecordHint = !isLoading && hasTodayRecord === false && !lastRecord;

  return (
    <div className="journal-page-stack mx-auto w-full max-w-app">
      <JournalDashboardCard
        dashboard={dashboard}
        lastRecord={lastRecord}
        isLoading={isLoading}
        onRecordDaily={onRecordDaily}
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

      <JournalPrivacyBanner compact />
    </div>
  );
}
