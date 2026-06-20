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
  /** @deprecated 인라인 제목 레이아웃으로 통일됨 — 무시됩니다 */
  centerTitle?: boolean;
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
        'sticky top-0 z-30 flex h-12 items-center gap-1 border-b border-wrtn-border bg-white px-2',
        className,
      )}
    >
      {showBack ? (
        <button
          type="button"
          aria-label="뒤로 가기"
          onClick={handleBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-wrtn-bg"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : (
        <span className="w-1 shrink-0" aria-hidden />
      )}
      <h1
        className={cn(
          'min-w-0 flex-1 truncate',
          brand ? 'text-base font-bold tracking-tight text-primary' : 'text-base font-semibold text-ink',
        )}
      >
        {title}
      </h1>
      {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
    </header>
  );
}
