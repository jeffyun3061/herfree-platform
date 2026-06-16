'use client';

import type { Board } from '@/domain/board/types';
import { BoardIcon } from '@/components/icons/BoardIcon';
import { cn } from '@/lib/cn';

type BoardTabBarProps = {
  boards: Board[];
  selectedBoardId: number | null;
  onSelect: (boardId: number | null) => void;
};

export function BoardTabBar({ boards, selectedBoardId, onSelect }: BoardTabBarProps) {
  const selectedBoard =
    selectedBoardId != null ? boards.find((board) => board.id === selectedBoardId) : null;

  return (
    <div className="space-y-3">
      {selectedBoard?.description && (
        <p className="rounded-xl bg-cream px-3 py-2 text-xs leading-relaxed text-muted">
          <span className="font-medium text-ink">{selectedBoard.name}</span>
          {' — '}
          {selectedBoard.description}
        </p>
      )}
      <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          'flex shrink-0 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] transition-colors',
          selectedBoardId === null
            ? 'bg-primary text-primary-foreground'
            : 'bg-card text-muted ring-1 ring-border/70',
        )}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
          </svg>
        </span>
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
              'flex shrink-0 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted ring-1 ring-border/70',
            )}
          >
            <span
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full',
                active ? 'bg-white/15' : 'bg-cream',
              )}
            >
              <BoardIcon boardType={board.boardType} className="h-4 w-4" />
            </span>
            <span className="max-w-[4.5rem] truncate">{board.name.replace(/방$/, '')}</span>
          </button>
        );
      })}
      </div>
    </div>
  );
}
