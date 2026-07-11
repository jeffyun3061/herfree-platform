'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useBoards } from '@/hooks/useBoards';
import { getCommunityBoards, getCommunityBoardTabLabel } from '@/domain/board/privateBoard';
import { isCommunityListRoute } from '@/lib/navigation';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/body-scroll-lock';
import { cn } from '@/lib/cn';

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
};

const SERVICE_LINKS = [
  { href: '/', label: '홈' },
  { href: '/community', label: '커뮤니티' },
  { href: '/journal', label: '개인일지' },
  { href: '/contents', label: '칼럼' },
  { href: '/videos', label: '영상' },
  { href: '/qna', label: 'FAQ' },
  { href: '/consult', label: '1:1 비밀상담' },
  { href: '/mypage', label: '마이페이지' },
] as const;

const GUIDE_LINKS = [
  { href: '/notice', label: '공지사항' },
  { href: '/terms', label: '이용약관' },
  { href: '/privacy', label: '개인정보 처리방침' },
] as const;

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-0.5 pb-2.5 text-[12px] font-bold tracking-[0.04em] text-[#9A9F94]">{children}</p>
  );
}

function normalizeBoardLabel(label: string) {
  return label.replace(/게시판|방/g, '').trim() || label;
}

function isServiceActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  if (href === '/community') {
    return isCommunityListRoute(pathname) || pathname.startsWith('/community/');
  }
  if (href === '/journal') {
    return pathname === '/journal' || pathname.startsWith('/record');
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, user, logout } = useAuth();
  const { boards } = useBoards();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [open]);

  useEffect(() => {
    if (!isLoggedIn && open) {
      onClose();
    }
  }, [isLoggedIn, open, onClose]);

  if (!open || !mounted) return null;

  const communityBoards = getCommunityBoards(boards);
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
      className="fixed inset-0 z-[100] flex justify-center bg-[#F3EDE3] lg:bg-[rgba(7,22,18,.45)]"
      role="dialog"
      aria-modal="true"
      aria-label="전체 메뉴"
    >
      <button type="button" className="absolute inset-0 hidden lg:block" aria-label="메뉴 닫기" onClick={onClose} />
      <div
        className="hf-menu-panel relative flex h-full w-full max-w-app flex-col overflow-y-auto bg-[#F3EDE3] lg:my-8 lg:h-[min(844px,calc(100vh-4rem))] lg:rounded-[48px] lg:shadow-[0_50px_90px_-34px_rgba(24,34,28,.5)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-8 top-[34%] h-[340px] w-[210px] rounded-[46%] bg-[#E5C3A0]/42" />
          <div className="absolute -right-20 top-[48%] h-[260px] w-[180px] rounded-[42%] bg-[#DDB896]/28" />
        </div>

        <div className="hf-screen-header-block pb-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 pr-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B5A690]">
                HERFREE MENU
              </p>
              <h2 className="hf-display mt-1.5 text-[28px] font-extrabold leading-[1.15] tracking-[-0.02em] text-[#1E2621]">
                전체 메뉴
              </h2>
              <p className="mt-2.5 max-w-[290px] text-[12.5px] leading-[1.7] text-[#9A9F94]">
                익명 커뮤니티, 개인일지, 검증된 정보를 한곳에서 이어서 볼 수 있어요.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full bg-white text-[17px] leading-none text-[#A6ABA0] shadow-[0_4px_14px_-6px_rgba(20,30,25,.22)]"
            >
              ✕
            </button>
          </div>
        </div>

        <section className="relative hf-page-x pb-5">
          <SectionTitle>서비스</SectionTitle>
          <div className="grid grid-cols-2 gap-2.5">
            {SERVICE_LINKS.map((item) => {
              const active = isServiceActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex min-h-[52px] items-center justify-center rounded-[16px] px-2 py-3.5 text-center text-[14px] font-semibold leading-[1.25]',
                    active
                      ? 'bg-[#07251F] text-white shadow-[0_12px_24px_-14px_rgba(7,37,31,.55)]'
                      : 'bg-white text-[#1E2621] shadow-[0_4px_14px_-8px_rgba(20,30,25,.14)]',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </section>

        {communityBoards.length > 0 && (
          <section className="relative hf-page-x pb-5">
            <SectionTitle>게시판 바로가기</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {communityBoards.map((board) => {
                const label = normalizeBoardLabel(getCommunityBoardTabLabel(board.boardType) ?? board.name);
                return (
                  <Link
                    key={board.id}
                    href={`/community/${board.id}`}
                    onClick={onClose}
                    className="rounded-full border border-[#EADFCB] bg-white px-3.5 py-2 text-[12.5px] font-medium text-[#3C443E]"
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <section className="relative hf-page-x pb-5">
          <SectionTitle>이용 안내</SectionTitle>
          <div className="overflow-hidden rounded-[16px] border border-[#EADFCB] bg-white/70">
            {GUIDE_LINKS.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center justify-between px-4 py-[15px] text-[14px] font-semibold text-[#1E2621]',
                  index < GUIDE_LINKS.length - 1 && 'border-b border-[#EDE4D4]',
                )}
              >
                <span>{item.label}</span>
                <span className="text-[15px] text-[#CBD0C7]" aria-hidden>
                  ›
                </span>
              </Link>
            ))}
            {isAdmin ? (
              <Link
                href="/admin?tab=dashboard"
                onClick={onClose}
                className="flex items-center justify-between border-t border-[#EDE4D4] px-4 py-[15px] text-[14px] font-semibold text-[#1E2621]"
              >
                <span>관리자 대시보드</span>
                <span className="text-[15px] text-[#CBD0C7]" aria-hidden>
                  ›
                </span>
              </Link>
            ) : null}
          </div>
        </section>

        <div className="relative mt-auto hf-page-x pb-[calc(34px+env(safe-area-inset-bottom))] pt-1">
          {isLoggedIn ? (
            <div className="flex gap-2.5">
              <Link
                href="/mypage"
                onClick={onClose}
                className="flex flex-1 items-center justify-center rounded-[14px] border border-[#EADFCB] bg-white py-[15px] text-[14px] font-bold text-[#1E2621] shadow-[0_2px_8px_-6px_rgba(20,30,25,.12)]"
              >
                마이페이지
              </Link>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="flex flex-1 items-center justify-center rounded-[14px] bg-[#07251F] py-[15px] text-[14px] font-bold text-white shadow-[0_14px_30px_-14px_rgba(7,37,31,.55)]"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <div className="flex gap-2.5">
              <Link
                href="/login"
                onClick={onClose}
                className="flex flex-1 items-center justify-center rounded-[14px] border border-[#EADFCB] bg-white py-[15px] text-[14px] font-bold text-[#1E2621] shadow-[0_2px_8px_-6px_rgba(20,30,25,.12)]"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                onClick={onClose}
                className="flex flex-1 items-center justify-center rounded-[14px] bg-[#07251F] py-[15px] text-[14px] font-bold text-white shadow-[0_14px_30px_-14px_rgba(7,37,31,.55)]"
              >
                회원가입
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
