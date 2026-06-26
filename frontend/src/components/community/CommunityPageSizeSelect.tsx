'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

const PAGE_SIZE_OPTIONS = [20, 30, 50] as const;
export type CommunityPageSize = (typeof PAGE_SIZE_OPTIONS)[number];

type CommunityPageSizeSelectProps = {
  value: CommunityPageSize;
  onChange: (size: CommunityPageSize) => void;
};

export function CommunityPageSizeSelect({ value, onChange }: CommunityPageSizeSelectProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative flex justify-center py-4">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#DDE3E1] bg-white px-[18px] py-2.5 text-[13px] text-[#15201D]"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {value}개씩 보기
        <span className="text-[11px] text-[#A6ABA3]" aria-hidden>
          ⌵
        </span>
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute bottom-12 z-20 min-w-[140px] overflow-hidden rounded-[10px] border border-[#DDE3E1] bg-white shadow-[0_6px_16px_rgba(0,0,0,0.1)]"
        >
          {PAGE_SIZE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={value === option}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className={cn(
                'block w-full border-t border-[#EAEDEC] px-[18px] py-2.5 text-center text-[13px] text-[#3C443E] first:border-t-0',
                value === option && 'bg-[#F4F6F5] font-medium',
              )}
            >
              {option}개씩 보기
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
