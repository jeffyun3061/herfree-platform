'use client';

import { InlineTopActions } from '@/components/layout/InlineTopActions';
import { cn } from '@/lib/cn';

type ScreenHeaderProps = {
  title: React.ReactNode;
  subtitle?: string;
  eyebrow?: string;
  titleAs?: 'h1' | 'h2' | 'div';
  titleClassName?: string;
  tone?: 'default' | 'editorial' | 'media' | 'community';
  actions?: React.ReactNode | false;
  align?: 'start' | 'center';
  className?: string;
  topPadding?: boolean;
  inset?: 'default' | 'narrow';
};

export function ScreenHeader({
  title,
  subtitle,
  eyebrow,
  titleAs = 'h1',
  titleClassName,
  tone = 'default',
  actions,
  align = 'start',
  className,
  topPadding = true,
  inset = 'default',
}: ScreenHeaderProps) {
  const TitleTag = titleAs;

  return (
    <div
      className={cn(
        'hf-screen-header-block',
        `hf-screen-header--${tone}`,
        inset === 'narrow' && 'hf-screen-header-block--narrow',
        !topPadding && 'hf-screen-header-block--flat',
        className,
      )}
    >
      <div className={cn('hf-screen-header-row', align === 'center' && 'items-center')}>
        <div className="min-w-0 flex-1">
          {eyebrow && <p className="hf-screen-eyebrow">{eyebrow}</p>}
          <TitleTag
            className={cn(
              'hf-display hf-screen-title break-words text-[24px] font-extrabold leading-[1.2] tracking-[-0.02em] text-[#1E2621]',
              titleClassName,
            )}
          >
            {title}
          </TitleTag>
        </div>
        {actions !== false ? (
          <div className="ml-1 shrink-0">{actions ?? <InlineTopActions />}</div>
        ) : null}
      </div>
      {subtitle ? <p className="hf-screen-subtitle">{subtitle}</p> : null}
    </div>
  );
}
