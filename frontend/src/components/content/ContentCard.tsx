'use client';

import Link from 'next/link';
import type { Content } from '@/domain/content/types';
import { CONTENT_THUMB_GRADIENTS, estimateReadMinutes } from '@/domain/content/types';
import { formatDate } from '@/domain/common/format';
import { PUBLIC_IMAGES } from '@/domain/assets/static';
import { cn } from '@/lib/cn';

type ContentCardProps = {
  content: Content;
  featured?: boolean;
};

function MetaDot() {
  return <span className="h-0.5 w-0.5 shrink-0 rounded-full bg-[#C7CECB]" aria-hidden />;
}

export function ContentCard({ content, featured }: ContentCardProps) {
  const thumbClass = CONTENT_THUMB_GRADIENTS[content.id % CONTENT_THUMB_GRADIENTS.length];
  const readMinutes = estimateReadMinutes(content.content);

  return (
    <Link href={`/contents/${content.id}`} className="block" aria-label={`${content.title} 칼럼 보기`}>
      <article className={cn('column-feed-card', featured && 'column-feed-card--featured')}>
        <div className="column-feed-card__media">
          {content.imageUrl ? (
            <img src={content.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <>
              <img src={PUBLIC_IMAGES.homeHero} alt="" className="h-full w-full object-cover" />
              <div className={cn('absolute inset-0 mix-blend-multiply opacity-55', thumbClass)} />
            </>
          )}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,37,31,.02)_0%,rgba(7,37,31,.18)_42%,rgba(7,37,31,.48)_100%)]" />
          {featured && (
            <span className="absolute right-3 top-3 rounded-full bg-[#F0C778] px-2.5 py-1 text-[12px] font-extrabold text-[#07251F]">
              최신 칼럼
            </span>
          )}
          <span className="absolute bottom-3 left-3 rounded-[7px] bg-white/90 px-2.5 py-1 text-[12px] font-extrabold text-[#04342C]">
            {content.category}
          </span>
        </div>
        <div className="column-feed-card__body">
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
      <div className="column-feed-card__media bg-[#0B3B36]/15" />
      <div className="column-feed-card__body space-y-2">
        <div className="h-4 w-16 rounded-md bg-[#E3E6E4]" />
        <div className="h-4 w-full rounded bg-[#E3E6E4]" />
        <div className="h-3 w-28 rounded bg-[#E3E6E4]" />
      </div>
    </div>
  );
}
