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
  centerTitle?: boolean;
};

export function TopBar({
  title,
  showBack = false,
  backHref,
  rightSlot,
  className,
  brand = false,
  centerTitle = false,
}: TopBarProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
      return;
    }
    router.back();
  };

  if (centerTitle) {
    return (
      <header
        className={cn(
          'sticky top-0 z-30 grid h-14 grid-cols-[3rem_1fr_3rem] items-center border-b border-wrtn-border bg-white px-2',
          className,
        )}
      >
        <div className="flex justify-start">
          {showBack ? (
            <button
              type="button"
              aria-label="뒤로 가기"
              onClick={handleBack}
              className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-wrtn-bg"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <span />
          )}
        </div>
        <h1 className="truncate text-center text-base font-semibold text-ink">{title}</h1>
        <div className="flex justify-end">{rightSlot ?? <span />}</div>
      </header>
    );
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center justify-between border-b border-wrtn-border bg-white px-4',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {showBack && (
          <button
            type="button"
            aria-label="뒤로 가기"
            onClick={handleBack}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-wrtn-bg"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <h1
          className={cn(
            'truncate',
            brand ? 'text-lg font-bold tracking-tight text-primary' : 'text-base font-semibold text-ink',
          )}
        >
          {title}
        </h1>
      </div>
      {rightSlot && <div className="shrink-0">{rightSlot}</div>}
    </header>
  );
}
