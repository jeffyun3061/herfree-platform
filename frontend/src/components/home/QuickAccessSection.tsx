import Link from 'next/link';
import { cn } from '@/lib/cn';
import {
  QuickAccessChecklistIcon,
  QuickAccessColumnIcon,
} from '@/components/home/QuickAccessIcons';

function ConsultIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function CommunityIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.9-.9L3 21l1.9-5.6A8.5 8.5 0 1 1 21 11.5z" />
    </svg>
  );
}

const QUICK_ITEMS = [
  { id: 'consult', title: '1:1 비밀상담', href: '/consult', Icon: ConsultIcon },
  { id: 'journal', title: '개인일지', href: '/journal', Icon: QuickAccessChecklistIcon },
  { id: 'column', title: '칼럼', href: '/contents', Icon: QuickAccessColumnIcon },
  { id: 'community', title: '커뮤니티', href: '/community', Icon: CommunityIcon },
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
        isHome && 'px-6 pb-2 pt-[30px]',
        isPanel && !isHome && 'quick-access-panel',
      )}
    >
      <h2
        className={cn(
          isHome
            ? 'mb-[18px] text-[12px] font-semibold tracking-[0.04em] text-[#9A9F94]'
            : 'section-heading mb-6',
          isPanel && !isHome && 'mb-6',
        )}
      >
        바로가기
      </h2>
      <div
        className={cn(
          isHome && 'grid grid-cols-4 gap-2.5',
          isPanel && !isHome && 'quick-access-panel__grid',
          !isPanel && !isHome && 'grid grid-cols-3 gap-2 lg:gap-5',
        )}
      >
        {QUICK_ITEMS.map((item) => {
          const useJournalHandler = item.id === 'journal' && onChecklistClick;
          const className = 'flex flex-col items-center gap-2.5 transition-opacity hover:opacity-80';

          const content = (
            <>
              <span
                className={cn(
                  'flex items-center justify-center border border-[#ECE5D8] bg-[#F6F1E8] text-[#0B3B36] shadow-[0_6px_16px_-10px_rgba(20,30,25,.2)]',
                  isHome ? 'h-14 w-14 rounded-[18px]' : 'quick-access-circle',
                )}
              >
                <item.Icon />
              </span>
              <span className="text-center text-[11px] font-medium leading-[1.35] text-[#5C645A]">
                {item.title}
              </span>
            </>
          );

          if (useJournalHandler) {
            return (
              <button key={item.id} type="button" onClick={onChecklistClick} className={className}>
                {content}
              </button>
            );
          }

          return (
            <Link key={item.id} href={item.href} className={className}>
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
