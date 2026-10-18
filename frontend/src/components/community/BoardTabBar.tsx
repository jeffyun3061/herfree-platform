'use client';

import { useEffect, useMemo, useRef } from 'react';
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
  const selectedTabRef = useRef<HTMLButtonElement>(null);
  const tabs = useMemo(() => [
    ...(showAllTab ? [{ boardId: null, label: COMMUNITY_ALL_TAB_LABEL }] : []),
    ...boards.map((board) => ({ boardId: board.id, label: normalizeBoardLabel(board) })),
  ], [boards, showAllTab]);

  useEffect(() => {
    selectedTabRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [selectedBoardId, tabs]);

  return (
    <div className="community-tabs -mx-4 min-w-0">
      <div className="community-tabs-scroll flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="게시판 카테고리">
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
    </div>
  );
}
