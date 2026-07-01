'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/navigation';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/cn';
import { CloseIcon } from '@/components/ui/ShellIcons';

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
};

const EXTRA_LINKS = [{ href: '/videos', label: '영상' }];

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const router = useRouter();
  const { isLoggedIn, user, logout } = useAuth();

  if (!open) return null;

  const handleLogout = async () => {
    await logout();
    onClose();
    router.replace('/');
  };

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
          <span className="font-display text-lg font-bold text-navy">메뉴</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-canvas-dark"
            aria-label="닫기"
          >
            <CloseIcon />
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
          <div className="my-2 h-px bg-border" />
          {isLoggedIn ? (
            <>
              <Link
                href="/mypage"
                onClick={onClose}
                className="rounded-xl px-3 py-3 text-sm font-medium text-ink hover:bg-canvas-dark"
              >
                {user?.nickname ?? '마이'}님 · 마이페이지
              </Link>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded-xl px-3 py-3 text-left text-sm text-red-600 hover:bg-canvas-dark"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={onClose}
                className="rounded-xl px-3 py-3 text-sm font-medium text-primary hover:bg-canvas-dark"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                onClick={onClose}
                className="rounded-xl px-3 py-3 text-sm text-muted hover:bg-canvas-dark"
              >
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>
    </div>
  );
}
