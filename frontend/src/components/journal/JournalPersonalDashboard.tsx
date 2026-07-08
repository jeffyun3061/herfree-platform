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
  return (
    <section className="rounded-[18px] border border-[#E3D7C3] bg-[#FFF9EE] px-4 py-3 shadow-[0_14px_30px_-26px_rgba(7,37,31,.45)]">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0B3B36] text-[15px] font-black text-[#F4D27E] shadow-[0_10px_22px_-16px_rgba(11,59,54,.8)]">
          !
        </span>
        {isLoading ? (
          <div className="min-w-0 flex-1">
            <div className="h-3 w-16 rounded-full bg-[#EEE5D7]" />
            <div className="mt-2 h-3 w-48 rounded-full bg-[#F3ECE1]" />
          </div>
        ) : post ? (
          <Link href={`/community/posts/${post.id}`} className="group min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-[0.12em] text-[#9B7430]">NOTICE</span>
              <span className="text-[10px] text-[#9A9187]">{formatRelativeTime(post.createdAt)}</span>
            </div>
            <p className="mt-0.5 truncate text-[13px] font-bold text-[#1E2621] group-hover:text-[#0B3B36]">
              {post.title}
            </p>
          </Link>
        ) : (
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold tracking-[0.12em] text-[#9B7430]">NOTICE</p>
            <p className="mt-0.5 text-[13px] font-bold text-[#1E2621]">새 공지가 올라오면 이곳에 보여드릴게요.</p>
          </div>
        )}
        <Link href={post ? `/community/posts/${post.id}` : '/notice'} className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#0B3B36] shadow-[0_8px_18px_-16px_rgba(7,37,31,.45)]">
          보기
        </Link>
      </div>
    </section>
  );
}

function HomeStatusTabs({ dashboard }: { dashboard: JournalDashboard | null }) {
  const todayRecord = dashboard?.todayRecord ?? null;
  const active = todayRecord?.hadSymptoms
    ? 'symptom'
    : (todayRecord?.prodromalSymptoms ?? []).length > 0
      ? 'prodrome'
      : 'none';
  const tabs = [
    { id: 'none', label: '증상 없음' },
    { id: 'prodrome', label: '전조 증상' },
    { id: 'symptom', label: '증상 발현' },
  ] as const;

  return (
    <section className="rounded-[16px] bg-[#EBE2D1] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,.55)]">
      <div className="grid grid-cols-3 gap-1">
        {tabs.map((tab) => {
          const selected = active === tab.id;
          return (
            <div
              key={tab.id}
              className={
                selected
                  ? 'rounded-[12px] bg-[#0B3B36] px-2 py-2 text-center text-[12px] font-extrabold text-white shadow-[0_10px_20px_-16px_rgba(11,59,54,.85)]'
                  : 'rounded-[12px] px-2 py-2 text-center text-[12px] font-bold text-[#8A9089]'
              }
              aria-current={selected ? 'true' : undefined}
            >
              {tab.label}
            </div>
          );
        })}
      </div>
    </section>
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
    <div className="journal-home-stack mx-auto w-full max-w-app gap-3">
      <HomeStatusTabs dashboard={dashboard} />

      <JournalDashboardCard
        dashboard={dashboard}
        isLoading={isLoading}
        lastRecord={lastRecord}
        onRecordDaily={onRecordDaily}
        onRecordRelapse={onRecordRelapse}
      />

      <HomeNoticeStrip post={noticePost} isLoading={noticeLoading} />

      {showCommunity && (
        <JournalCommunityCard posts={communityPosts} isLoading={communityLoading} />
      )}

      <HomeColumnPreview maxItems={3} />

      {afterCommunity}
    </div>
  );
}
