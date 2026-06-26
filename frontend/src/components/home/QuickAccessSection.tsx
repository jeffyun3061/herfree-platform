import Link from 'next/link';

import { cn } from '@/lib/cn';

import {

  QuickAccessChecklistIcon,

  QuickAccessColumnIcon,

  QuickAccessVideoIcon,

} from '@/components/home/QuickAccessIcons';



const QUICK_ITEMS = [

  { id: 'journal', title: '개인일지', href: '/journal', Icon: QuickAccessChecklistIcon },

  { id: 'column', title: '칼럼', href: '/contents', Icon: QuickAccessColumnIcon },

  { id: 'video', title: '헤르프리', href: '/videos', Icon: QuickAccessVideoIcon },

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

        isHome && 'rounded-[1.125rem] border border-[#DDE3E1] bg-white px-4 pt-4 pb-3 shadow-[0_1px_8px_rgba(0,0,0,0.04)]',

        isPanel && !isHome && 'quick-access-panel',

      )}

    >

      <h2

        className={cn(

          'font-serif font-bold text-[#15201D]',

          isHome ? 'mb-3 text-[15px] tracking-tight' : 'section-heading font-display',

          isPanel && !isHome && 'mb-6',

          !isPanel && !isHome && 'mb-6',

        )}

      >

        바로가기

      </h2>

      <div

        className={cn(

          isHome && 'grid grid-cols-3 gap-2',

          isPanel && !isHome && 'quick-access-panel__grid',

          !isPanel && !isHome && 'grid grid-cols-3 gap-2 lg:gap-5',

        )}

      >

        {QUICK_ITEMS.map((item) => {

          const useJournalHandler = item.id === 'journal' && onChecklistClick;

          const className = 'flex flex-col items-center gap-2 transition-opacity hover:opacity-80';



          const content = (

            <>

              <span

                className={cn(

                  'quick-access-circle border border-[#E3E6E4] bg-[#F4F6F5]',

                  isHome && 'h-[3rem] w-[3rem]',

                  isPanel && !isHome && 'h-[4.5rem] w-[4.5rem]',

                )}

              >

                <item.Icon />

              </span>

              <span

                className={cn(

                  'max-w-[4.5rem] text-center font-normal leading-[1.25] text-[#3C443E]',

                  isHome ? 'text-[11px]' : isPanel ? 'text-[11px]' : 'text-[10px] lg:text-[11px]',

                )}

              >

                {item.title}

              </span>

            </>

          );



          if (useJournalHandler) {

            return (

              <button

                key={item.id}

                type="button"

                onClick={onChecklistClick}

                className={className}

              >

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

