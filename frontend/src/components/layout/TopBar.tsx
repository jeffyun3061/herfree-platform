'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';

type TopBarProps = {
  title: string;
  showBack?: boolean;
  rightSlot?: React.ReactNode;
  className?: string;
};

export function TopBar({ title, showBack = false, rightSlot, className }: TopBarProps) {
  const router = useRouter();

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {showBack && (
          <button
            type="button"
            aria-label="뒤로 가기"
            onClick={() => router.back()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-primary hover:bg-cream-dark"
          >
            ←
          </button>
        )}
        <h1 className="truncate text-base font-semibold text-cream-foreground">{title}</h1>
      </div>
      {rightSlot && <div className="shrink-0">{rightSlot}</div>}
    </header>
  );
}
