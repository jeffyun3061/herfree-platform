import Link from 'next/link';
import { cn } from '@/lib/cn';

const QUICK_ITEMS = [
  {
    title: '1:1 비밀 상담',
    href: '/community',
    variant: 'default' as const,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 lg:h-6 lg:w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 1 1 8 0v3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: '체크리스트',
    href: '/journal',
    variant: 'default' as const,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 lg:h-6 lg:w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: '전문가 칼럼',
    href: '/contents',
    variant: 'default' as const,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 lg:h-6 lg:w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 4h9l3 3v13H6V4Z" />
        <path d="M15 4v3h3M9 12h6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: '헤르프리 영상',
    href: '/lounge',
    variant: 'video' as const,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 lg:h-6 lg:w-6" fill="currentColor" stroke="none">
        <path d="m10 8.5 7 3.5-7 3.5V8.5Z" />
      </svg>
    ),
  },
] as const;

type QuickAccessSectionProps = {
  layout?: 'row' | 'panel';
};

export function QuickAccessSection({ layout = 'row' }: QuickAccessSectionProps) {
  const isPanel = layout === 'panel';

  return (
    <section className={cn(isPanel && 'quick-access-panel')}>
      <h2 className={cn('section-heading', isPanel ? 'mb-6' : 'mb-6')}>Quick Access</h2>
      <div
        className={cn(
          isPanel ? 'quick-access-panel__grid' : 'grid grid-cols-4 gap-2 lg:gap-5',
        )}
      >
        {QUICK_ITEMS.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className={cn(
              'flex flex-col items-center gap-2.5 transition-opacity hover:opacity-80',
              isPanel && 'rounded-2xl p-2 hover:bg-canvas/80',
            )}
          >
            <span
              className={cn(
                'quick-access-circle',
                isPanel && 'h-[4.5rem] w-[4.5rem]',
                item.variant === 'video' && 'quick-access-circle--video',
              )}
            >
              {item.icon}
            </span>
            <span
              className={cn(
                'text-center font-medium leading-tight text-ink-soft',
                isPanel ? 'text-xs' : 'text-[9px] lg:text-[11px]',
              )}
            >
              {item.title}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
