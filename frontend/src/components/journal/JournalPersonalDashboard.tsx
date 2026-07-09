'use client';

import Link from 'next/link';
import type { Post } from '@/domain/post/types';
import { formatRelativeTime } from '@/domain/common/format';
import type { JournalDashboard, JournalRecord } from '@/domain/journal/types';
import type { RoutineItemId } from '@/domain/journal/routine';
import { JournalDashboardCard } from '@/components/journal/JournalDashboardCard';
import { JournalCommunityCard } from '@/components/journal/JournalCommunityCard';
import { HomeColumnPreview } from '@/components/home/HomeColumnPreview';

type JournalPersonalDashboardProps = {
  dashboard: JournalDashboard | null;
  isLoading: boolean;
  onRecordDaily: () => void;
  onRecordRelapse?: () => void;
  onRoutineItemClick?: (itemId: RoutineItemId) => void;
  lastRecord?: JournalRecord | null;
  noticePost?: Post | null;
  noticeLoading?: boolean;
  communityPosts?: Post[];
  communityLoading?: boolean;
  routinePulse?: boolean;
  hasTodayRecord?: boolean;
  showCommunity?: boolean;
  afterCommunity?: React.ReactNode;
};

function HomeNoticeStrip({ post, isLoading }: { post: Post | null; isLoading: boolean }) {
  const href = post ? `/community/posts/${post.id}` : '/notice';

  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-[#EADFCB] bg-[#FBF6EA] px-4 py-3.5 shadow-[0_10px_24px_-22px_rgba(7,37,31,.35)] transition-opacity hover:opacity-95"
    >
      <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#07251F] text-[15px] font-bold text-[#F0C778]">
        !
      </span>
      {isLoading ? (
        <div className="min-w-0 flex-1">
          <div className="h-3 w-16 rounded-full bg-[#EEE5D7]" />
          <div className="mt-2 h-3 w-48 rounded-full bg-[#F3ECE1]" />
        </div>
      ) : (
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-[7px]">
            <span className="text-[10px] font-bold tracking-[0.06em] text-[#15695E]">공지</span>
            {post ? (
              <span className="text-[10.5px] text-[#B4B2A6]">{formatRelativeTime(post.createdAt)}</span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-[13px] font-semibold text-[#1E2621]">
            {post?.title ?? '새 공지가 올라오면 이곳에 보여드릴게요.'}
          </p>
        </div>
      )}
      <span className="shrink-0 text-[#C3B79E]" aria-hidden>
        ›
      </span>
    </Link>
  );
}

export function JournalPersonalDashboard({
  dashboard,
  isLoading,
  onRecordDaily,
  onRecordRelapse,
  lastRecord,
  noticePost = null,
  noticeLoading = false,
  communityPosts = [],
  communityLoading = false,
  showCommunity = true,
  afterCommunity,
}: JournalPersonalDashboardProps) {
  return (
    <div className="journal-home-stack mx-auto w-full max-w-app gap-[22px]">
      <JournalDashboardCard
        dashboard={dashboard}
        isLoading={isLoading}
        lastRecord={lastRecord}
        onRecordDaily={onRecordDaily}
        onRecordRelapse={onRecordRelapse}
      />

      <HomeNoticeStrip post={noticePost} isLoading={noticeLoading} />

      {showCommunity && (
        <JournalCommunityCard posts={communityPosts} isLoading={communityLoading} maxPosts={4} />
      )}

      <HomeColumnPreview maxItems={3} />

      {afterCommunity}
    </div>
  );
}
