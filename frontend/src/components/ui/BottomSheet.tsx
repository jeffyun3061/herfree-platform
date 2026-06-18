'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/cn';

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function BottomSheet({ open, onClose, title, children, className }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="닫기"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 w-full max-w-app rounded-t-[1.25rem] bg-white px-5 pb-8 pt-3 shadow-[0_-8px_32px_rgba(0,0,0,0.12)]',
          className,
        )}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-wrtn-border" />
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 10v5M12 7h.01" strokeLinecap="round" />
            </svg>
          </span>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
        </div>
        {children}
      </div>
    </div>
  );
}
