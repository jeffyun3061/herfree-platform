'use client';

import { useMemo, useState } from 'react';
import type { Board } from '@/domain/board/types';
import { cn } from '@/lib/cn';

type BoardTabBarProps = {
  boards: Board[];
  selectedBoardId: number | null;
  onSelect: (boardId: number | null) => void;
};

function cleanBoardName(name: string) {
  return name.replace(/방$/, '');
}

export function BoardTabBar({ boards, selectedBoardId, onSelect }: BoardTabBarProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const visibleBoards = useMemo(() => boards.slice(0, 2), [boards]);
  const hiddenBoards = useMemo(() => boards.slice(2), [boards]);
  const hiddenActive = hiddenBoards.some((board) => board.id === selectedBoardId);

  const handleSelect = (boardId: number | null) => {
    setMoreOpen(false);
    onSelect(boardId);
  };

  return (
    <div className="relative">
      <div className="flex flex-nowrap items-center gap-2 overflow-visible pb-1">
        <button
          type="button"
          onClick={() => handleSelect(null)}
          className={cn(
            'community-chip',
            selectedBoardId === null ? 'community-chip-active' : 'community-chip-inactive',
          )}
        >
          전체
        </button>

        {visibleBoards.map((board) => {
          const active = selectedBoardId === board.id;
          return (
            <button
              key={board.id}
              type="button"
              onClick={() => handleSelect(board.id)}
              className={cn('community-chip', active ? 'community-chip-active' : 'community-chip-inactive')}
            >
              {cleanBoardName(board.name)}
            </button>
          );
        })}

        {hiddenBoards.length > 0 && (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMoreOpen((open) => !open)}
              className={cn('community-chip', hiddenActive ? 'community-chip-active' : 'community-chip-inactive')}
              aria-expanded={moreOpen}
            >
              더보기
            </button>
            {moreOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-30 min-w-[10rem] overflow-hidden rounded-[16px] border border-[#ECE5D8] bg-white p-1.5 shadow-[0_18px_40px_-26px_rgba(20,30,25,.35)]">
                {hiddenBoards.map((board) => {
                  const active = selectedBoardId === board.id;
                  return (
                    <button
                      key={board.id}
                      type="button"
                      onClick={() => handleSelect(board.id)}
                      className={cn(
                        'block w-full rounded-[12px] px-3 py-2.5 text-left text-[12.5px] font-semibold',
                        active ? 'bg-[#0B3B36] text-white' : 'text-[#5B6864] hover:bg-[#F6F1E8]',
                      )}
                    >
                      {cleanBoardName(board.name)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
