'use client';

import type { Post } from '@/domain/post/types';
import type { JournalDashboard } from '@/domain/journal/types';
import type { RoutineItemId } from '@/domain/journal/routine';
import { JournalDashboardHero } from '@/components/journal/JournalDashboardHero';
import { JournalRoutineCard } from '@/components/journal/JournalRoutineCard';
import { JournalCommunityCard } from '@/components/journal/JournalCommunityCard';
import { JournalIcon } from '@/components/journal/JournalIcon';
import { Button } from '@/components/ui/Button';

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
      <JournalDashboardHero
        dashboard={dashboard}
        isLoading={isLoading}
        showFirstRecordHint={showFirstRecordHint}
        onRecordRelapse={onRecordRelapse}
      />

      <Button
        type="button"
        onClick={onRecordDaily}
        disabled={isLoading}
        fullWidth
        size="md"
        variant="secondary"
        className="journal-record-cta gap-2 shadow-sm"
      >
        <JournalIcon name="pencil" size={18} />
        오늘 기록하기
      </Button>

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
