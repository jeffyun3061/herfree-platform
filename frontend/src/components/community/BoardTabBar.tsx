'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Board } from '@/domain/board/types';
import { getCommunityBoardTabLabel } from '@/domain/board/privateBoard';
import { cn } from '@/lib/cn';

type BoardTabBarProps = {
  boards: Board[];
  selectedBoardId: number;
  onSelect: (boardId: number) => void;
};

const SCROLL_EPSILON = 4;
const SCROLL_STEP = 132;

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

export function BoardTabBar({ boards, selectedBoardId, onSelect }: BoardTabBarProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ left: false, right: false });

  const updateEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= SCROLL_EPSILON) {
      setEdge({ left: false, right: false });
      return;
    }

    setEdge({
      left: el.scrollLeft > SCROLL_EPSILON,
      right: el.scrollLeft < maxScroll - SCROLL_EPSILON,
    });
  }, []);

  const scrollByStep = useCallback((direction: -1 | 1) => {
    scrollerRef.current?.scrollBy({ left: direction * SCROLL_STEP, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    updateEdges();

    const observer = new ResizeObserver(updateEdges);
    observer.observe(el);
    window.addEventListener('resize', updateEdges);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateEdges);
    };
  }, [boards, updateEdges]);

  return (
    <div className="community-tabs relative -mx-4 w-[calc(100%+2rem)] min-w-0">
      <div
        ref={scrollerRef}
        onScroll={updateEdges}
        className={cn(
          'community-tabs-scroller scrollbar-hide w-full min-w-0 touch-pan-x overflow-x-auto overflow-y-hidden overscroll-x-contain',
          edge.right && 'community-tabs-scroller--peek-right',
          edge.left && 'community-tabs-scroller--peek-left',
        )}
        role="tablist"
        aria-label="게시판 카테고리"
      >
        <div className="flex w-max gap-2 px-4 pb-1 pr-12">
          {boards.map((board) => {
            const active = selectedBoardId === board.id;
            const label = getCommunityBoardTabLabel(board.boardType) ?? board.name.replace(/방$/, '');

            return (
              <button
                key={board.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelect(board.id)}
                className={cn(
                  'community-chip shrink-0 whitespace-nowrap',
                  active ? 'community-chip-active' : 'community-chip-inactive',
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {edge.left && (
        <button
          type="button"
          onClick={() => scrollByStep(-1)}
          className="community-tabs-nav community-tabs-nav-left"
          aria-label="이전 카테고리 보기"
        >
          <ChevronIcon direction="left" />
        </button>
      )}

      {edge.right && (
        <button
          type="button"
          onClick={() => scrollByStep(1)}
          className="community-tabs-nav community-tabs-nav-right"
          aria-label="다음 카테고리 보기"
        >
          <ChevronIcon direction="right" />
        </button>
      )}
    </div>
  );
}
