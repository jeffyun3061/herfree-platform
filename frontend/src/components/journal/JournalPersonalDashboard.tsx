'use client';

import type { Post } from '@/domain/post/types';
import type { JournalDashboard } from '@/domain/journal/types';
import type { RoutineItemId } from '@/domain/journal/routine';
import { JournalDashboardHeader } from '@/components/journal/JournalDashboardHeader';
import { JournalDashboardHero } from '@/components/journal/JournalDashboardHero';
import { JournalRoutineCard } from '@/components/journal/JournalRoutineCard';
import { JournalCommunityCard } from '@/components/journal/JournalCommunityCard';
import { JournalIcon } from '@/components/journal/JournalIcon';
import { cn } from '@/lib/cn';

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

/** 목업 기준 홈 스택: 헤더 → 히어로(300:280) → CTA → 루틴 → 커뮤니티 */
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
    <div className="journal-home-stack mx-auto w-full max-w-app">
      <JournalDashboardHeader />

      <JournalDashboardHero
        dashboard={dashboard}
        isLoading={isLoading}
        showFirstRecordHint={showFirstRecordHint}
        onRecordRelapse={onRecordRelapse}
      />

      <button
        type="button"
        onClick={onRecordDaily}
        disabled={isLoading}
        className={cn(
          'journal-record-cta flex w-full items-center justify-center gap-2',
          'rounded-[1rem] border border-[var(--color-border-tertiary)]',
          'bg-[var(--color-background-primary)] px-4 py-3.5',
          'text-[12px] font-semibold text-[var(--color-text-primary)] shadow-sm',
          'transition-colors hover:border-primary/25 hover:bg-[var(--color-background-secondary)]/80',
          'disabled:opacity-60',
        )}
      >
        <JournalIcon name="pencil" size={18} />
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
