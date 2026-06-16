'use client';

import { cn } from '@/lib/cn';

export type PostSortOption = 'latest' | 'popular' | 'comments';

const SORT_OPTIONS: { value: PostSortOption; label: string }[] = [
  { value: 'latest', label: '최신' },
  { value: 'popular', label: '인기' },
  { value: 'comments', label: '댓글많은순' },
];

type CommunitySortTabsProps = {
  value: PostSortOption;
  onChange: (value: PostSortOption) => void;
};

export function CommunitySortTabs({ value, onChange }: CommunitySortTabsProps) {
  return (
    <div className="flex gap-1 border-b border-border/60">
      {SORT_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'relative px-4 py-2.5 text-sm font-medium transition-colors',
            value === option.value ? 'text-primary' : 'text-muted hover:text-ink',
          )}
        >
          {option.label}
          {value === option.value && (
            <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
          )}
        </button>
      ))}
    </div>
  );
}

export function postSortToQuery(sort: PostSortOption): string {
  switch (sort) {
    case 'popular':
      return 'viewCount,desc';
    case 'comments':
      return 'createdAt,desc';
    default:
      return 'createdAt,desc';
  }
}
