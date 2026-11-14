'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Board } from '@/domain/board/types';
import { COMMUNITY_ALL_TAB_LABEL, getCommunityBoardTabLabel } from '@/domain/board/privateBoard';
import { cn } from '@/lib/cn';

type BoardTabBarProps = {
  boards: Board[];
  selectedBoardId: number | null;
  onSelect: (boardId: number | null) => void;
  showAllTab?: boolean;
  disabled?: boolean;
};

function normalizeBoardLabel(board: Board) {
  return getCommunityBoardTabLabel(board.boardType) ?? board.name.replace(/게시판|방/g, '').trim();
}

export function BoardTabBar({ boards, selectedBoardId, onSelect, showAllTab = false, disabled = false }: BoardTabBarProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollerId = useId();
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
    Array.from(scroller.children).forEach(tab => observer.observe(tab));
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

  const renderArrow = (direction: -1 | 1, available: boolean) => (
    <button
      type="button"
      aria-controls={scrollerId}
      aria-label={direction < 0 ? '이전 게시판 보기' : '다음 게시판 보기'}
      disabled={!available}
      onClick={() => scrollTabs(direction)}
      className="flex h-10 w-9 items-center justify-center self-center rounded-full border border-[#DEDCD5] bg-white text-[#0B3B36] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B3B36] disabled:invisible"
    >
      <span aria-hidden="true" className="text-xl leading-none">{direction < 0 ? '‹' : '›'}</span>
    </button>
  );

  return (
    <div className="-mx-2 grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] gap-1">
      {renderArrow(-1, canScrollLeft)}
      <div
        id={scrollerId}
        ref={scrollerRef}
        onScroll={updateScrollButtons}
        className="community-tabs-scroll flex min-w-0 gap-1.5 overflow-x-auto px-0.5 py-1"
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
              disabled={disabled}
              onClick={() => onSelect(tab.boardId)}
              className={cn(
                'min-h-11 shrink-0 whitespace-nowrap rounded-full border px-3 py-2 text-[12px] font-semibold leading-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary disabled:cursor-default',
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
      {renderArrow(1, canScrollRight)}
    </div>
  );
}
