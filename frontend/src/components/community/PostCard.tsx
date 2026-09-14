'use client';

import Link from 'next/link';
import type { Post } from '@/domain/post/types';
import { formatRelativeTime } from '@/domain/common/format';
import { formatAuthorIpLabel } from '@/domain/post/ipDisplay';
import { getBoardTagClass } from '@/domain/board/types';
import { getCommunityBoardTabLabel, isMaskedBoardType, isSecretStoryBoardType } from '@/domain/board/privateBoard';
import { cn } from '@/lib/cn';

type PostCardProps = {
  post: Post;
  boardName?: string;
};

function MetaDot() {
  return <span className="h-0.5 w-0.5 shrink-0 rounded-full bg-[#CBD0C7]" aria-hidden />;
}

function normalizeBoardLabel(label: string | undefined, boardType?: string) {
  const tabLabel = boardType ? getCommunityBoardTabLabel(boardType) : undefined;
  return (tabLabel ?? label ?? '커뮤니티').replace(/게시판|방/g, '').trim() || '커뮤니티';
}

export function PostCard({ post, boardName }: PostCardProps) {
  const displayBoard = normalizeBoardLabel(boardName ?? post.boardName, post.boardType);
  const isSecretStory = isSecretStoryBoardType(post.boardType);
  const canOpen = post.readable !== false || isSecretStory;
  const showReplyStatus = isMaskedBoardType(post.boardType) && (post.readable !== false || isSecretStory);
  const tagClass = getBoardTagClass(post.boardType);
  const authorIpLabel = formatAuthorIpLabel(post.authorIpMasked);

  if (!canOpen) {
    return (
      <article className="community-feed-row opacity-70">
        <div className="community-feed-row__header">
          <div className="community-feed-row__title-line">
            <span className={cn('community-feed-tag', tagClass)}>{displayBoard}</span>
            <span className="community-feed-row__title text-muted" title={post.title}>{post.title}</span>
          </div>
        </div>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#7D8580]">다른 회원의 비공개 글입니다.</p>
      </article>
    );
  }

  return (
    <Link href={`/community/posts/${post.id}`} className="block">
      <article className="community-feed-row transition-colors hover:bg-[#F7EFE5]">
        <div className="community-feed-row__header">
          <div className="community-feed-row__title-line">
            <span className={cn('community-feed-tag', tagClass)}>{displayBoard}</span>
            {showReplyStatus && (
              <span
                className={cn(
                  'shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold',
                  post.staffReplied ? 'bg-primary/15 text-primary' : 'bg-[#F4F6F5] text-[#8B9590]',
                )}
              >
                {post.staffReplied ? '답변 완료' : '답변 대기'}
              </span>
            )}
            <span className="community-feed-row__title" title={post.title}>{post.title}</span>
          </div>
          <div className="community-feed-row__meta">
            <span className="max-w-[46%] truncate" title={post.authorNickname}>{post.authorNickname}</span>
            {authorIpLabel ? (
              <>
                <MetaDot />
                <span>{authorIpLabel}</span>
              </>
            ) : null}
            <MetaDot />
            <time dateTime={post.createdAt}>{formatRelativeTime(post.createdAt)}</time>
            <span className="ml-auto flex shrink-0 items-center gap-3">
              <span aria-label={`좋아요 ${post.reactionCount ?? 0}개`}>♡ {post.reactionCount ?? 0}</span>
              <span aria-label={`댓글 ${post.commentCount ?? 0}개`}>💬 {post.commentCount ?? 0}</span>
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="community-feed-row animate-pulse">
      <div className="community-feed-row__header">
        <div className="community-feed-row__title-line">
          <div className="h-5 w-14 shrink-0 rounded-md bg-[#E3E6E4]" />
          <div className="h-5 min-w-0 flex-1 rounded bg-[#E3E6E4]" />
        </div>
        <div className="community-feed-row__meta">
          <div className="h-3 w-20 rounded bg-[#E3E6E4]" />
          <div className="ml-auto h-3 w-24 rounded bg-[#E3E6E4]" />
        </div>
      </div>
    </div>
  );
}
