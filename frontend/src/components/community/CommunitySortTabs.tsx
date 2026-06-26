'use client';

import { cn } from '@/lib/cn';
import type { PostListPeriod, PostSortOption } from '@/domain/post/sort';

const SORT_OPTIONS: { value: PostSortOption; label: string }[] = [
  { value: 'latest', label: '최신' },
  { value: 'popular', label: '인기' },
  { value: 'comments', label: '댓글' },
];

type CommunitySortTabsProps = {
  value: PostSortOption;
  onChange: (value: PostSortOption) => void;
};

export function CommunitySortTabs({ value, onChange }: CommunitySortTabsProps) {
  return (
    <div className="inline-flex gap-1" role="tablist" aria-label="게시글 정렬">
      {SORT_OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-lg border px-2.5 py-1 text-[11.5px] font-medium transition-colors',
              selected
                ? 'border-primary bg-primary text-white'
                : 'border-[#DDE3E1] bg-white text-[#5B6864] hover:bg-[#F4F6F5]',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

const PERIOD_OPTIONS: { value: PostListPeriod; label: string }[] = [
  { value: 'week', label: '이번 주' },
  { value: 'all', label: '전체' },
];

type CommunityPeriodToggleProps = {
  value: PostListPeriod;
  onChange: (value: PostListPeriod) => void;
};

export function CommunityPeriodToggle({ value, onChange }: CommunityPeriodToggleProps) {
  return (
    <div className="inline-flex gap-1" role="group" aria-label="정렬 기간">
      {PERIOD_OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-lg border px-2.5 py-1 text-[11.5px] font-medium transition-colors',
              selected
                ? 'border-primary bg-primary text-white'
                : 'border-[#DDE3E1] bg-white text-[#5B6864] hover:bg-[#F4F6F5]',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export type { PostListPeriod, PostSortOption } from '@/domain/post/sort';
export { postSortToQuery } from '@/domain/post/sort';
