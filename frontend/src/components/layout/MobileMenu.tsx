'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/body-scroll-lock';

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
};

const SERVICE_LINKS = [
  { href: '/', label: '홈', description: '오늘 상태와 요약' },
  { href: '/community', label: '커뮤니티', description: '같은 경험을 나누는 공간' },
  { href: '/journal', label: '개인일지', description: '매일 컨디션 기록' },
  { href: '/contents', label: '칼럼', description: '경험에서 나온 이야기' },
  { href: '/qna', label: 'FAQ', description: '자주 묻는 질문' },
  { href: '/consult', label: '1:1 비밀상담', description: '편하게 나누는 1:1' },
  { href: '/mypage', label: '마이페이지', description: '내 활동과 기록' },
] as const;

const GUIDE_LINKS = [
  { href: '/notice', label: '공지사항' },
  { href: '/terms', label: '이용약관' },
  { href: '/privacy', label: '개인정보처리방침' },
] as const;

function MenuSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-0.5 pb-1 pt-[22px] text-[12px] font-bold tracking-[0.04em] text-[#A08E6A]">
      {children}
    </p>
  );
}

function MenuItem({
  href,
  label,
  description,
  onClose,
}: {
  href: string;
  label: string;
  description?: string;
  onClose: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="flex min-h-[54px] items-center justify-between gap-3 border-b border-[#E7DECC] px-0.5 py-[15px] text-[#1E2621] last:border-b-0"
    >
      <span className="shrink-0 text-[15px] font-semibold tracking-normal">{label}</span>
      {description ? (
        <span className="min-w-0 truncate text-right text-[11.5px] font-medium text-[#A8A08E]">
          {description}
        </span>
      ) : null}
    </Link>
  );
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const router = useRouter();
  const { isLoggedIn, user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    setPortalTarget(document.querySelector<HTMLElement>('.app-phone-shell'));
  }, []);

  useEffect(() => {
    if (!open) return;
    const shell = document.querySelector<HTMLElement>('.app-phone-shell');
    const bottomNav = document.querySelector<HTMLElement>('nav[aria-label="하단 메뉴"]');
    const previousShellOverflowY = shell?.style.overflowY;
    const previousShellOverscroll = shell?.style.overscrollBehavior;
    const previousBottomNavVisibility = bottomNav?.style.visibility;
    const previousBottomNavPointerEvents = bottomNav?.style.pointerEvents;

    lockBodyScroll();
    if (shell) {
      shell.style.overflowY = 'hidden';
      shell.style.overscrollBehavior = 'contain';
    }
    if (bottomNav) {
      bottomNav.style.visibility = 'hidden';
      bottomNav.style.pointerEvents = 'none';
    }

    return () => {
      if (shell) {
        shell.style.overflowY = previousShellOverflowY ?? '';
        shell.style.overscrollBehavior = previousShellOverscroll ?? '';
      }
      if (bottomNav) {
        bottomNav.style.visibility = previousBottomNavVisibility ?? '';
        bottomNav.style.pointerEvents = previousBottomNavPointerEvents ?? '';
      }
      unlockBodyScroll();
    };
  }, [open]);

  if (!open || !mounted || !portalTarget) return null;

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const handleLogout = () => {
    onClose();
    void (async () => {
      await logout();
      router.replace('/');
    })();
  };

  return createPortal(
    <div
      className="absolute inset-0 z-[100] overflow-hidden rounded-[inherit] bg-[rgba(7,22,18,.40)] backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="전체 메뉴"
    >
      <button type="button" className="absolute inset-0" aria-label="메뉴 닫기" onClick={onClose} />
      <aside
        className="hf-menu-panel absolute bottom-0 right-0 top-0 flex h-full w-[82%] max-w-[340px] animate-[hfMenuSlideIn_.28s_cubic-bezier(.2,.7,.3,1)_both] flex-col overflow-hidden rounded-bl-[30px] bg-[#F3EDE3] shadow-[-20px_0_50px_-20px_rgba(7,37,31,.5)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shrink-0 bg-[#07251F] px-[22px] pb-[18px] pt-[52px] text-white">
          <div className="mb-3.5 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-white/10 text-[16px] font-bold text-[#F3EDE3]">
                h.
              </span>
              <span className="truncate text-[16px] font-bold tracking-normal text-[#F3EDE3]">
                헤르프리
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="flex h-8 w-8 shrink-0 items-center justify-center text-[28px] font-light leading-none text-[#F3EDE3]/80"
            >
              ×
            </button>
          </div>

          {isLoggedIn ? (
            <p className="text-[12.5px] text-[#F3EDE3]/70">담담한 하루를 함께 기록해요</p>
          ) : (
            <>
              <p className="text-[12px] text-[#F3EDE3]/60">익명 기반 비공개 커뮤니티</p>
              <div className="mt-4 flex gap-[9px]">
                <Link
                  href="/login"
                  onClick={onClose}
                  className="flex flex-1 items-center justify-center rounded-[12px] border border-[#F3EDE3]/[0.28] bg-white/10 py-3 text-[13.5px] font-bold text-[#F3EDE3]"
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  onClick={onClose}
                  className="flex flex-1 items-center justify-center rounded-[12px] bg-[#F3EDE3] py-3 text-[13.5px] font-bold text-[#0B3B36]"
                >
                  회원가입
                </Link>
              </div>
            </>
          )}
        </div>

        <nav
          className="hf-menu-panel flex-1 overflow-y-auto overscroll-contain px-[22px] pb-[calc(72px+env(safe-area-inset-bottom))] pt-2.5"
          aria-label="전체 메뉴 링크"
        >
          {SERVICE_LINKS.map((item) => (
            <MenuItem
              key={item.href}
              href={item.href}
              label={item.label}
              description={item.description}
              onClose={onClose}
            />
          ))}

          <MenuSectionTitle>이용 안내</MenuSectionTitle>
          {GUIDE_LINKS.map((item) => (
            <MenuItem key={item.href} href={item.href} label={item.label} onClose={onClose} />
          ))}

          {isAdmin ? (
            <>
              <MenuSectionTitle>운영</MenuSectionTitle>
              <MenuItem href="/admin?tab=dashboard" label="관리자 대시보드" onClose={onClose} />
            </>
          ) : null}

          {isLoggedIn ? (
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="w-full py-6 text-center text-[13px] text-[#A8A08E]"
            >
              로그아웃
            </button>
          ) : null}

        </nav>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 flex h-[64px] items-end justify-center bg-gradient-to-t from-[#F3EDE3] via-[#F3EDE3]/95 to-[#F3EDE3]/0 pb-[calc(14px+env(safe-area-inset-bottom))]"
          aria-hidden
        >
          <span className="h-[3px] w-12 rounded-full bg-[#D8CDB9]/75" />
        </div>
      </aside>
    </div>,
    portalTarget,
  );
}
