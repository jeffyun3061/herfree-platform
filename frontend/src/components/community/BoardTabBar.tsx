'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Board } from '@/domain/board/types';
import { COMMUNITY_ALL_TAB_LABEL, getCommunityBoardTabLabel } from '@/domain/board/privateBoard';
import { cn } from '@/lib/cn';

type BoardTabBarProps = {
  boards: Board[];
  selectedBoardId: number | null;
  onSelect: (boardId: number | null) => void;
  showAllTab?: boolean;
};

type TabItem = {
  boardId: number | null;
  label: string;
};

const PAGE_SIZE = 4;

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {direction === 'left' ? <path d="M15 6l-6 6 6 6" /> : <path d="M9 6l6 6-6 6" />}
    </svg>
  );
}

function normalizeBoardLabel(board: Board) {
  return (getCommunityBoardTabLabel(board.boardType) ?? board.name)
    .replace(/게시판|방/g, '')
    .trim();
}

function chunkTabs(items: TabItem[], size: number): TabItem[][] {
  const pages: TabItem[][] = [];
  for (let index = 0; index < items.length; index += size) {
    pages.push(items.slice(index, index + size));
  }
  return pages;
}

function tabButtonClass(active: boolean) {
  return cn(
    'min-w-0 truncate rounded-full border-[0.5px] px-2 py-2 text-center text-[11.5px] font-medium leading-tight sm:text-[12px]',
    active
      ? 'border-[#0B3B36] bg-[#0B3B36] text-white'
      : 'border-[#ECE5D8] bg-white text-[#5C645A]',
  );
}

export function BoardTabBar({ boards, selectedBoardId, onSelect, showAllTab = false }: BoardTabBarProps) {
  const tabs = useMemo<TabItem[]>(() => {
    const items: TabItem[] = [];
    if (showAllTab) {
      items.push({ boardId: null, label: COMMUNITY_ALL_TAB_LABEL });
    }
    boards.forEach((board) => {
      items.push({ boardId: board.id, label: normalizeBoardLabel(board) });
    });
    return items;
  }, [boards, showAllTab]);

  const pages = useMemo(() => chunkTabs(tabs, PAGE_SIZE), [tabs]);
  const pageCount = pages.length;

  const selectedPageIndex = useMemo(() => {
    const tabIndex = tabs.findIndex((tab) => tab.boardId === selectedBoardId);
    if (tabIndex < 0) return 0;
    return Math.floor(tabIndex / PAGE_SIZE);
  }, [selectedBoardId, tabs]);

  const [pageIndex, setPageIndex] = useState(selectedPageIndex);

  useEffect(() => {
    setPageIndex(selectedPageIndex);
  }, [selectedPageIndex]);

  const currentPage = pages[pageIndex] ?? [];
  const canGoPrev = pageIndex > 0;
  const canGoNext = pageIndex < pageCount - 1;
  const showPager = pageCount > 1;

  return (
    <div className="community-tabs w-full min-w-0">
      <div className="flex items-center gap-2">
        {showPager ? (
          <button
            type="button"
            onClick={() => setPageIndex((value) => Math.max(0, value - 1))}
            disabled={!canGoPrev}
            aria-disabled={!canGoPrev}
            className={cn('community-tabs-nav shrink-0', !canGoPrev && 'pointer-events-none opacity-35')}
            aria-label="이전 카테고리 페이지"
          >
            <ChevronIcon direction="left" />
          </button>
        ) : (
          <div className="w-8 shrink-0" aria-hidden />
        )}

        <div
          className="grid min-w-0 flex-1 grid-cols-4 gap-1.5 sm:gap-2"
          role="tablist"
          aria-label={
            showPager
              ? `게시판 카테고리 ${pageIndex + 1}페이지, 총 ${pageCount}페이지`
              : '게시판 카테고리'
          }
        >
          {currentPage.map((tab) => {
            const active = tab.boardId === selectedBoardId;
            return (
              <button
                key={tab.boardId ?? 'all'}
                type="button"
                role="tab"
                aria-selected={active}
                title={tab.label}
                onClick={() => onSelect(tab.boardId)}
                className={tabButtonClass(active)}
              >
                {tab.label}
              </button>
            );
          })}
          {Array.from({ length: PAGE_SIZE - currentPage.length }).map((_, index) => (
            <div key={`empty-${index}`} aria-hidden className="min-w-0" />
          ))}
        </div>

        {showPager ? (
          <button
            type="button"
            onClick={() => setPageIndex((value) => Math.min(pageCount - 1, value + 1))}
            disabled={!canGoNext}
            aria-disabled={!canGoNext}
            className={cn('community-tabs-nav shrink-0', !canGoNext && 'pointer-events-none opacity-35')}
            aria-label="다음 카테고리 페이지"
          >
            <ChevronIcon direction="right" />
          </button>
        ) : (
          <div className="w-8 shrink-0" aria-hidden />
        )}
      </div>

      {showPager && (
        <p className="mt-1.5 text-center text-[10px] text-[#8A9089]" aria-live="polite">
          {pageIndex + 1} / {pageCount}
        </p>
      )}
    </div>
  );
}
