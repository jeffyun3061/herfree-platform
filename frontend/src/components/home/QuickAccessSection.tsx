import Link from 'next/link';
import { cn } from '@/lib/cn';
import {
  QuickAccessChecklistIcon,
  QuickAccessColumnIcon,
  QuickAccessLockIcon,
  QuickAccessVideoIcon,
} from '@/components/home/QuickAccessIcons';

import {
  PRIVATE_BOARD_META,
} from '@/domain/board/privateBoard';

const QUICK_ITEMS = [
  { title: '1:1 비밀 상담', href: PRIVATE_BOARD_META.PRIVATE_CONSULT.path, Icon: QuickAccessLockIcon },
  { title: '체크리스트', href: '/journal?record=daily', Icon: QuickAccessChecklistIcon },
  { title: '전문가 칼럼', href: '/contents', Icon: QuickAccessColumnIcon },
  { title: '헤르프리 영상', href: '/videos', Icon: QuickAccessVideoIcon },
] as const;

type QuickAccessSectionProps = {
  layout?: 'row' | 'panel' | 'home';
  onChecklistClick?: () => void;
};

export function QuickAccessSection({ layout = 'row', onChecklistClick }: QuickAccessSectionProps) {
  const isPanel = layout === 'panel';
  const isHome = layout === 'home';

  return (
    <section
      className={cn(
        isHome && 'rounded-[1.125rem] bg-white px-4 py-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)]',
        isPanel && !isHome && 'quick-access-panel',
      )}
    >
      <h2
        className={cn(
          'font-serif font-bold text-herfree-gray',
          isHome ? 'mb-4 text-[15px] tracking-tight' : 'section-heading font-display',
          isPanel && !isHome && 'mb-6',
          !isPanel && !isHome && 'mb-6',
        )}
      >
        {isHome ? 'Quick Access' : '바로가기'}
      </h2>
      <div
        className={cn(
          isHome && 'grid grid-cols-4 gap-1',
          isPanel && !isHome && 'quick-access-panel__grid',
          !isPanel && !isHome && 'grid grid-cols-4 gap-2 lg:gap-5',
        )}
      >
        {QUICK_ITEMS.map((item) => {
          const useChecklistHandler = item.title === '체크리스트' && onChecklistClick;
          const className = 'flex flex-col items-center gap-2 transition-opacity hover:opacity-80';

          const content = (
            <>
              <span
                className={cn(
                  'quick-access-circle',
                  isHome && 'h-[3.5rem] w-[3.5rem]',
                  isPanel && !isHome && 'h-[4.5rem] w-[4.5rem]',
                )}
              >
                <item.Icon />
              </span>
              <span
                className={cn(
                  'max-w-[4.5rem] text-center font-normal leading-[1.25] text-herfree-gray',
                  isHome ? 'text-[9px]' : isPanel ? 'text-[10px]' : 'text-[9px] lg:text-[11px]',
                )}
              >
                {item.title}
              </span>
            </>
          );

          if (useChecklistHandler) {
            return (
              <button
                key={item.title}
                type="button"
                onClick={onChecklistClick}
                className={className}
              >
                {content}
              </button>
            );
          }

          return (
            <Link key={item.title} href={item.href} className={className}>
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
