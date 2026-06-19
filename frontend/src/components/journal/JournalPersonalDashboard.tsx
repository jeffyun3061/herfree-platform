'use client';

import type { Post } from '@/domain/post/types';
import type { JournalDashboard } from '@/domain/journal/types';
import { JournalDashboardHeader } from '@/components/journal/JournalDashboardHeader';
import { JournalDashboardHero } from '@/components/journal/JournalDashboardHero';
import { JournalRoutineCard } from '@/components/journal/JournalRoutineCard';
import { JournalCommunityCard } from '@/components/journal/JournalCommunityCard';
import { JournalIcon } from '@/components/journal/JournalIcon';
import { cn } from '@/lib/cn';

type JournalPersonalDashboardProps = {
  dashboard: JournalDashboard | null;
  isLoading: boolean;
  onRecord: () => void;
  communityPosts: Post[];
  communityLoading: boolean;
};

export function JournalPersonalDashboard({
  dashboard,
  isLoading,
  onRecord,
  communityPosts,
  communityLoading,
}: JournalPersonalDashboardProps) {
  return (
    <div className="mx-auto w-full max-w-app space-y-4">
      <JournalDashboardHeader />
      <JournalDashboardHero dashboard={dashboard} isLoading={isLoading} />

      <button
        type="button"
        onClick={onRecord}
        disabled={isLoading}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-[1rem]',
          'border border-[var(--color-border-tertiary)] bg-[var(--color-background-primary)]',
          'px-4 py-3.5 text-sm font-semibold text-[var(--color-text-primary)] shadow-sm transition-colors',
          'hover:border-primary/30 hover:bg-[var(--color-background-secondary)] disabled:opacity-60',
        )}
      >
        <JournalIcon name="pencil" size={16} />
        오늘 기록하기
      </button>

      <JournalRoutineCard dashboard={dashboard} isLoading={isLoading} />
      <JournalCommunityCard posts={communityPosts} isLoading={communityLoading} />
    </div>
  );
}
