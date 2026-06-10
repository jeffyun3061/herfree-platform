'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
};

export function Modal({ open, title, onClose, children, className }: ModalProps) {
  // 모달이 열려 있는 동안 배경 스크롤을 막아 모바일 UX를 유지한다
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
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="닫기"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 w-full max-w-app rounded-t-3xl bg-card p-5 shadow-xl sm:rounded-3xl',
          className,
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-cream-foreground">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            닫기
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
