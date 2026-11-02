'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Board } from '@/domain/board/types';
import { COMMUNITY_ALL_TAB_LABEL, getCommunityBoardTabLabel } from '@/domain/board/privateBoard';
import { cn } from '@/lib/cn';

type BoardTabBarProps = {
  boards: Board[];
  selectedBoardId: number | null;
  onSelect: (boardId: number | null) => void;
  showAllTab?: boolean;
};

function normalizeBoardLabel(board: Board) {
  return getCommunityBoardTabLabel(board.boardType) ?? board.name.replace(/게시판|방/g, '').trim();
}

export function BoardTabBar({ boards, selectedBoardId, onSelect, showAllTab = false }: BoardTabBarProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const selectedTabRef = useRef<HTMLButtonElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const tabs = useMemo(() => [
    ...(showAllTab ? [{ boardId: null, label: COMMUNITY_ALL_TAB_LABEL }] : []),
    ...boards.map((board) => ({ boardId: board.id, label: normalizeBoardLabel(board) })),
  ], [boards, showAllTab]);

  const updateScrollButtons = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    setCanScrollLeft(scroller.scrollLeft > 2);
    setCanScrollRight(scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    updateScrollButtons();
    const observer = new ResizeObserver(updateScrollButtons);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [tabs, updateScrollButtons]);

  useEffect(() => {
    const selected = selectedTabRef.current;
    const scroller = scrollerRef.current;
    if (!selected || !scroller) return;

    const selectedBounds = selected.getBoundingClientRect();
    const scrollerBounds = scroller.getBoundingClientRect();
    if (selectedBounds.left < scrollerBounds.left) {
      scroller.scrollLeft -= scrollerBounds.left - selectedBounds.left + 8;
    } else if (selectedBounds.right > scrollerBounds.right) {
      scroller.scrollLeft += selectedBounds.right - scrollerBounds.right + 8;
    }
  }, [selectedBoardId, tabs]);

  const scrollTabs = (direction: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scroller.scrollBy({
      left: direction * Math.max(scroller.clientWidth * 0.7, 160),
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <div className="community-tabs -mx-4 min-w-0">
      <div
        id="community-board-tabs"
        ref={scrollerRef}
        onScroll={updateScrollButtons}
        className="community-tabs-scroll flex gap-2 overflow-x-auto px-4 pb-1"
        role="tablist"
        aria-label="게시판 카테고리"
      >
        {tabs.map((tab) => {
          const active = tab.boardId === selectedBoardId;
          return (
            <button
              key={tab.boardId ?? 'all'}
              ref={active ? selectedTabRef : undefined}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(tab.boardId)}
              className={cn(
                'min-h-11 shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-[12px] font-semibold leading-none transition-colors',
                active
                  ? 'border-[#0B3B36] bg-[#0B3B36] text-white'
                  : 'border-[#DEDCD5] bg-white text-[#44534B] hover:border-[#A3B7AA]',
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {canScrollLeft && (
        <button
          type="button"
          aria-label="이전 게시판 보기"
          aria-controls="community-board-tabs"
          onClick={() => scrollTabs(-1)}
          className="absolute left-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#DEDCD5] bg-white text-[#0B3B36] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3B36]"
        >
          <span aria-hidden="true" className="text-xl leading-none">‹</span>
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          aria-label="다음 게시판 보기"
          aria-controls="community-board-tabs"
          onClick={() => scrollTabs(1)}
          className="absolute right-1 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#DEDCD5] bg-white text-[#0B3B36] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3B36]"
        >
          <span aria-hidden="true" className="text-xl leading-none">›</span>
        </button>
      )}
    </div>
  );
}
