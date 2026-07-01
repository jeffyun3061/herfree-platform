'use client';

import type { Post } from '@/domain/post/types';
import type { JournalDashboard } from '@/domain/journal/types';
import type { RoutineItemId } from '@/domain/journal/routine';
import { JournalDashboardHero } from '@/components/journal/JournalDashboardHero';
import { JournalRoutineCard } from '@/components/journal/JournalRoutineCard';
import { JournalCommunityCard } from '@/components/journal/JournalCommunityCard';

type JournalPersonalDashboardProps = {
  dashboard: JournalDashboard | null;
  isLoading: boolean;
  onRecordDaily: () => void;
  onRecordRelapse?: () => void;
  onRoutineItemClick?: (itemId: RoutineItemId) => void;
  communityPosts?: Post[];
  communityLoading?: boolean;
  routinePulse?: boolean;
  hasTodayRecord?: boolean;
  showCommunity?: boolean;
  afterCommunity?: React.ReactNode;
};

export function JournalPersonalDashboard({
  dashboard,
  isLoading,
  onRecordDaily,
  onRecordRelapse,
  onRoutineItemClick,
  communityPosts = [],
  communityLoading = false,
  routinePulse,
  hasTodayRecord,
  showCommunity = true,
  afterCommunity,
}: JournalPersonalDashboardProps) {
  const showFirstRecordHint = !isLoading && hasTodayRecord === false;

  return (
    <div className="journal-home-stack mx-auto w-full max-w-app gap-3">
      <div>
        <JournalDashboardHero
          dashboard={dashboard}
          isLoading={isLoading}
          showFirstRecordHint={showFirstRecordHint}
          onRecordRelapse={onRecordRelapse}
        />
      </div>

      <button
        type="button"
        onClick={onRecordDaily}
        className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-[12px] border border-[var(--color-border-tertiary)] bg-white text-[14px] font-extrabold text-[#1E2621] shadow-card transition-colors hover:bg-[#FBFAF6]"
      >
        <span aria-hidden>✎</span>
        오늘 기록하기
      </button>

      <JournalRoutineCard
        dashboard={dashboard}
        isLoading={isLoading}
        onRoutineItemClick={onRoutineItemClick}
        pulse={routinePulse}
        showEmptyHint={showFirstRecordHint}
      />

      {showCommunity && (
        <JournalCommunityCard posts={communityPosts} isLoading={communityLoading} />
      )}

      {afterCommunity}
    </div>
  );
}
