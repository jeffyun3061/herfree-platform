'use client';

import Link from 'next/link';
import type { Post } from '@/domain/post/types';
import type { Video } from '@/domain/video/types';
import { getVideoThumbnail } from '@/domain/video/types';
import { formatRelativeTime, formatRelativeTimeMedia } from '@/domain/common/format';
import type { JournalDashboard, JournalRecord } from '@/domain/journal/types';
import type { RoutineItemId } from '@/domain/journal/routine';
import { JournalDashboardCard } from '@/components/journal/JournalDashboardCard';
import { JournalCommunityCard } from '@/components/journal/JournalCommunityCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

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
  latestVideo?: Video | null;
  videoLoading?: boolean;
  routinePulse?: boolean;
  hasTodayRecord?: boolean;
  showCommunity?: boolean;
  afterCommunity?: React.ReactNode;
};

function HomeNoticeStrip({ post, isLoading }: { post: Post | null; isLoading: boolean }) {
  return (
    <section className="rounded-[20px] border border-[#DED2BE] bg-[#F8F1E6] px-4 py-3 shadow-[0_16px_34px_-30px_rgba(7,37,31,.5)]">
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
        <Link href="/community" className="shrink-0 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-bold text-[#0B3B36]">
          보기
        </Link>
      </div>
    </section>
  );
}

function HomeLatestVideoCard({ video, isLoading }: { video: Video | null; isLoading: boolean }) {
  return (
    <section className="overflow-hidden rounded-[22px] border border-[#DCD0BA] bg-[#F7EEDF] shadow-[0_18px_42px_-32px_rgba(7,37,31,.55)]">
      <div className="flex items-center justify-between px-4 pb-3 pt-4">
        <div>
          <p className="text-[10px] font-bold tracking-[0.14em] text-[#9B7430]">HERFREE VIDEO</p>
          <h2 className="mt-1 font-display text-[17px] font-bold text-[#1E2621]">최신 영상</h2>
        </div>
        <Link href="/videos" className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-bold text-[#0B3B36]">
          더보기 &gt;
        </Link>
      </div>

      {isLoading ? (
        <div className="px-4 pb-4">
          <LoadingSpinner label="영상 불러오는 중..." />
        </div>
      ) : video ? (
        <Link href={`/videos/${video.id}`} className="group block px-4 pb-4">
          <div className="relative aspect-video overflow-hidden rounded-[18px] bg-[#07342E] shadow-[0_16px_34px_-24px_rgba(7,37,31,.7)]">
            <img
              src={getVideoThumbnail(video)}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
            <span className="absolute left-3 top-3 rounded-full bg-[#F2C86B] px-2.5 py-1 text-[10px] font-bold text-[#082F2A]">
              YouTube
            </span>
            <span className="absolute inset-0 m-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-sm font-bold text-[#0B3B36] shadow-lg">
              ▶
            </span>
            <div className="absolute inset-x-0 bottom-0 p-3">
              <p className="line-clamp-2 text-[14px] font-bold leading-snug text-white">{video.title}</p>
              <p className="mt-1 text-[10.5px] text-white/70">{formatRelativeTimeMedia(video.createdAt)}</p>
            </div>
          </div>
        </Link>
      ) : (
        <p className="px-4 pb-4 text-sm text-[#7B8179]">등록된 영상이 없습니다.</p>
      )}
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
  latestVideo = null,
  videoLoading = false,
  showCommunity = true,
  afterCommunity,
}: JournalPersonalDashboardProps) {
  return (
    <div className="journal-home-stack mx-auto w-full max-w-app gap-3">
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

      <HomeLatestVideoCard video={latestVideo} isLoading={videoLoading} />

      {afterCommunity}
    </div>
  );
}
