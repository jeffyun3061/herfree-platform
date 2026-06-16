'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Post } from '@/domain/post/types';
import { formatRelativeTime } from '@/domain/common/format';

type PostCardProps = {
  post: Post;
  boardName?: string;
};

const BOOKMARK_KEY = 'herfree-bookmarks';

function loadBookmarks(): Set<number> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(BOOKMARK_KEY);
    return raw ? new Set(JSON.parse(raw) as number[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveBookmarks(ids: Set<number>) {
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify(Array.from(ids)));
}

export function PostCard({ post, boardName }: PostCardProps) {
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    setBookmarked(loadBookmarks().has(post.id));
  }, [post.id]);

  const toggleBookmark = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const next = loadBookmarks();
    if (next.has(post.id)) {
      next.delete(post.id);
      setBookmarked(false);
    } else {
      next.add(post.id);
      setBookmarked(true);
    }
    saveBookmarks(next);
  };

  const displayBoard = boardName ?? post.boardName;

  return (
    <Link href={`/community/posts/${post.id}`} className="block">
      <article className="post-card">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-pill bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
            {displayBoard.replace(/방$/, '')}
          </span>
          <button
            type="button"
            onClick={toggleBookmark}
            aria-label={bookmarked ? '북마크 해제' : '북마크'}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-canvas-dark hover:text-primary"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill={bookmarked ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="mb-2 flex items-center gap-1.5 text-xs text-muted">
          <span>{post.authorNickname}</span>
          <span>·</span>
          <span>{formatRelativeTime(post.createdAt)}</span>
        </div>

        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink">{post.title}</h3>

        {post.contentPreview && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{post.contentPreview}</p>
        )}

        <div className="mt-3 flex items-center gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {post.viewCount}
          </span>
        </div>
      </article>
    </Link>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="post-card animate-pulse">
      <div className="mb-3 h-5 w-16 rounded-pill bg-canvas-dark" />
      <div className="mb-2 h-3 w-24 rounded bg-canvas-dark" />
      <div className="mb-1.5 h-5 w-full rounded bg-canvas-dark" />
      <div className="h-4 w-3/4 rounded bg-canvas-dark" />
    </div>
  );
}
