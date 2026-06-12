'use client';

import Link from 'next/link';
import { NAV_ITEMS } from '@/lib/navigation';
import { cn } from '@/lib/cn';

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
};

const EXTRA_LINKS = [
  { href: '/journal', label: '개인 일지' },
  { href: '/login', label: '로그인' },
  { href: '/signup', label: '회원가입' },
];

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
        aria-label="메뉴 닫기"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 flex h-full w-[min(100%,280px)] flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <span className="font-serif text-lg font-semibold text-navy">메뉴</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-canvas-dark"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="rounded-xl px-3 py-3 text-sm font-medium text-ink hover:bg-canvas-dark"
            >
              {item.label}
            </Link>
          ))}
          <div className="my-2 h-px bg-border" />
          {EXTRA_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn('rounded-xl px-3 py-3 text-sm text-muted hover:bg-canvas-dark')}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
