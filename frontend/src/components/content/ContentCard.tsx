'use client';

import Link from 'next/link';
import type { Content } from '@/domain/content/types';
import { CONTENT_THUMB_GRADIENTS, estimateReadMinutes } from '@/domain/content/types';
import { formatDate } from '@/domain/common/format';
import { cn } from '@/lib/cn';

type ContentCardProps = {
  content: Content;
};

function MetaDot() {
  return <span className="h-0.5 w-0.5 shrink-0 rounded-full bg-[#C7CECB]" aria-hidden />;
}

export function ContentCard({ content }: ContentCardProps) {
  const thumbClass = CONTENT_THUMB_GRADIENTS[content.id % CONTENT_THUMB_GRADIENTS.length];
  const readMinutes = estimateReadMinutes(content.content);

  return (
    <Link href={`/contents/${content.id}`} className="block">
      <article className="column-feed-card">
        <div className={cn('column-feed-card__thumb', thumbClass)} />
        <div className="column-feed-card__body">
          <span className="column-feed-card__tag">{content.category}</span>
          <h2 className="column-feed-card__title">{content.title}</h2>
          <div className="column-feed-card__meta">
            <span>{formatDate(content.createdAt)}</span>
            <MetaDot />
            <span>{readMinutes}분 읽기</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export function ContentCardSkeleton() {
  return (
    <div className="column-feed-card animate-pulse overflow-hidden">
      <div className="bg-[#0B3B36]/15" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-16 rounded-md bg-[#E3E6E4]" />
        <div className="h-4 w-full rounded bg-[#E3E6E4]" />
        <div className="h-3 w-28 rounded bg-[#E3E6E4]" />
      </div>
    </div>
  );
}
