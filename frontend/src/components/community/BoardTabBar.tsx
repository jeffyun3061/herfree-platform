'use client';

import type { Board } from '@/domain/board/types';
import { cn } from '@/lib/cn';

type BoardTabBarProps = {
  boards: Board[];
  selectedBoardId: number | null;
  onSelect: (boardId: number | null) => void;
};

export function BoardTabBar({ boards, selectedBoardId, onSelect }: BoardTabBarProps) {
  return (
    <div className="relative -mx-4">
      <div className="hf-chip-rail flex gap-2 overflow-x-auto px-4 pb-1">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            'community-chip',
            selectedBoardId === null ? 'community-chip-active' : 'community-chip-inactive',
          )}
        >
          전체
        </button>
        {boards.map((board) => {
          const active = selectedBoardId === board.id;
          return (
            <button
              key={board.id}
              type="button"
              onClick={() => onSelect(board.id)}
              className={cn(
                'community-chip',
                active ? 'community-chip-active' : 'community-chip-inactive',
              )}
            >
              {board.name.replace(/방$/, '')}
            </button>
          );
        })}
        <span className="w-2 shrink-0" aria-hidden />
      </div>
      <div
        className="pointer-events-none absolute bottom-1 right-0 top-0 w-10 bg-gradient-to-l from-[#F3EDE3] via-[#F3EDE3]/88 to-transparent"
        aria-hidden
      />
    </div>
  );
}
