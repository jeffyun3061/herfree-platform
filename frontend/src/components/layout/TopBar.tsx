'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';

type TopBarProps = {
  title: string;
  showBack?: boolean;
  backHref?: string;
  rightSlot?: React.ReactNode;
  className?: string;
  brand?: boolean;
};

export function TopBar({
  title,
  showBack = false,
  backHref,
  rightSlot,
  className,
  brand = false,
}: TopBarProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
      return;
    }
    router.back();
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/70 bg-surface/95 px-4 backdrop-blur-md',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {showBack && (
          <button
            type="button"
            aria-label="뒤로 가기"
            onClick={handleBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-cream-dark"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <h1
          className={cn(
            'truncate',
            brand
              ? 'text-lg font-semibold tracking-tight text-primary'
              : 'text-base font-semibold text-cream-foreground',
          )}
        >
          {title}
        </h1>
      </div>
      {rightSlot && <div className="shrink-0">{rightSlot}</div>}
    </header>
  );
}
