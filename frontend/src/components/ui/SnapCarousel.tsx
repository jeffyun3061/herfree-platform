'use client';

import { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

export type SnapCarouselPanel = {
  id: string;
  label: string;
  content: React.ReactNode;
};

type SnapCarouselProps = {
  panels: SnapCarouselPanel[];
  className?: string;
  panelClassName?: string;
  /** 탭 버튼 + 사용 안내 (인사이트 등) */
  showTabs?: boolean;
};

export function SnapCarousel({
  panels,
  className,
  panelClassName,
  showTabs = false,
}: SnapCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(Math.min(Math.max(index, 0), panels.length - 1));
  }, [panels.length]);

  const scrollTo = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
    setActiveIndex(index);
  };

  if (panels.length === 0) return null;

  return (
    <div className={cn('w-full', className)}>
      {showTabs ? (
        <>
          <div
            className="mb-2 flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide"
            role="tablist"
            aria-label="인사이트 섹션"
          >
            {panels.map((panel, index) => (
              <button
                key={panel.id}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                onClick={() => scrollTo(index)}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition-colors',
                  index === activeIndex
                    ? 'bg-[#0B3B36] text-white'
                    : 'border border-[#DDE3E1] bg-white text-[#5B6864]',
                )}
              >
                {panel.label}
              </button>
            ))}
          </div>
          <p className="mb-2 flex items-center justify-center gap-1.5 text-[10.5px] text-[#8B9590]">
            <span aria-hidden>‹</span>
            <span>탭을 누르거나 옆으로 밀어서 볼 수 있어요</span>
            <span aria-hidden>›</span>
          </p>
        </>
      ) : (
        <p className="mb-2 text-center text-[11px] font-medium text-[var(--color-text-secondary)]">
          {panels[activeIndex]?.label}
        </p>
      )}

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={cn(
          'scrollbar-hide flex snap-x snap-mandatory overflow-x-auto',
          showTabs && '-mx-1 px-1',
        )}
      >
        {panels.map((panel) => (
          <div
            key={panel.id}
            className={cn(
              'w-full shrink-0 snap-center snap-always',
              showTabs && 'min-h-[min(58vh,430px)]',
              panelClassName,
            )}
          >
            {panel.content}
          </div>
        ))}
      </div>

      {panels.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-3">
          <div className="flex gap-1.5" role="presentation">
            {panels.map((panel, index) => (
              <button
                key={panel.id}
                type="button"
                aria-label={`${panel.label} 보기`}
                onClick={() => scrollTo(index)}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  index === activeIndex ? 'w-4 bg-primary' : 'w-1.5 bg-[var(--color-border-tertiary)]',
                )}
              />
            ))}
          </div>
          {showTabs && (
            <span className="text-[10.5px] font-medium tabular-nums text-[#8B9590]">
              {activeIndex + 1} / {panels.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
