'use client';

import { BackButton } from '@/components/ui/BackButton';
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
  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-12 items-center gap-1 border-b border-wrtn-border bg-white px-2',
        className,
      )}
    >
      {showBack ? (
        <BackButton backHref={backHref} className="text-ink hover:bg-wrtn-bg" />
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
