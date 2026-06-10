import Link from 'next/link';
import type { Board } from '@/domain/board/types';
import { getBoardAccentClass, getBoardBannerClass } from '@/domain/board/types';
import { BoardIconBadge } from '@/components/icons/BoardIcon';
import { cn } from '@/lib/cn';

type BoardListItemProps = {
  board: Board;
  variant?: 'row' | 'tile';
};

export function BoardListItem({ board, variant = 'row' }: BoardListItemProps) {
  const accent = getBoardAccentClass(board.boardType);

  if (variant === 'tile') {
    return (
      <Link href={`/community/${board.id}`} className="board-tile group">
        <BoardIconBadge boardType={board.boardType} accentClass={accent} />
        <p className="mt-3 text-sm font-medium leading-snug text-cream-foreground group-hover:text-primary">
          {board.name}
        </p>
      </Link>
    );
  }

  return (
    <Link href={`/community/${board.id}`} className="block">
      <div className="flex items-start gap-3 rounded-2xl border border-border/80 bg-card p-4 transition-shadow hover:shadow-md">
        <BoardIconBadge boardType={board.boardType} accentClass={accent} />
        <div className="min-w-0 flex-1">
          <h2 className="font-medium text-cream-foreground">{board.name}</h2>
          <p className="mt-1 line-clamp-2 text-sm text-muted">{board.description}</p>
        </div>
        <svg
          viewBox="0 0 24 24"
          className="mt-1 h-4 w-4 shrink-0 text-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </Link>
  );
}

export function BoardBanner({ board }: { board: Board }) {
  const banner = getBoardBannerClass(board.boardType);

  return (
    <div className={cn('mb-4 rounded-2xl px-4 py-4', banner)}>
      <div className="flex items-center gap-3">
        <BoardIconBadge boardType={board.boardType} accentClass="bg-white/20 text-inherit" />
        <div>
          <p className="font-semibold">{board.name}</p>
          {board.description && <p className="mt-0.5 text-sm opacity-85">{board.description}</p>}
        </div>
      </div>
    </div>
  );
}
