'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useBoards } from '@/hooks/useBoards';
import { getCommunityBoards, getCommunityBoardTabLabel } from '@/domain/board/privateBoard';
import { CloseIcon } from '@/components/ui/ShellIcons';

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
};

const MAIN_LINKS = [
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
    <p className="px-1 text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#9B8B70]">
      {children}
    </p>
  );
}

function MenuListLink({
  href,
  label,
  onClose,
  emphasis = false,
}: {
  href: string;
  label: string;
  onClose: () => void;
  emphasis?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className={
        emphasis
          ? 'flex items-center justify-between rounded-[13px] bg-[#0B3B36] px-3 py-3.5 text-[13px] font-extrabold text-white'
          : 'flex items-center justify-between rounded-[13px] px-3 py-3.5 text-[13px] font-semibold text-[#293530] hover:bg-white'
      }
    >
      {label}
      {!emphasis ? (
        <span className="hf-text-muted" aria-hidden>
          ›
        </span>
      ) : null}
    </Link>
  );
}

function normalizeBoardLabel(label: string) {
  return label.replace(/게시판|방/g, '').trim() || label;
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const router = useRouter();
  const { isLoggedIn, user, logout } = useAuth();
  const { boards } = useBoards();

  if (!open) return null;

  const communityBoards = getCommunityBoards(boards);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const handleLogout = async () => {
    await logout();
    onClose();
    router.replace('/');
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-[#071C18]/45 backdrop-blur-sm"
        aria-label="메뉴 닫기"
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 flex h-full w-[min(100%,21rem)] flex-col overflow-hidden bg-[#F3EDE3] shadow-2xl">
        <div className="border-b border-[#E1D5C1] bg-[#FBF6ED] px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#9B8B70]">
                Herfree Menu
              </p>
              <h2 className="hf-display mt-1 text-[20px] font-extrabold text-[#10231F]">
                전체 메뉴
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#5C645A] shadow-sm"
              aria-label="닫기"
            >
              <CloseIcon />
            </button>
          </div>
          <p className="mt-3 text-[13px] leading-[1.55] text-[#6D746D]">
            익명 커뮤니티, 개인일지, 검증된 정보를 한곳에서 볼 수 있어요.
          </p>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-4 py-5">
          <section className="space-y-2.5">
            <SectionTitle>서비스</SectionTitle>
            <div className="rounded-[18px] border border-[#E2D4BE] bg-[#FBF6ED] p-2">
              {MAIN_LINKS.map((item) => (
                <MenuListLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  onClose={onClose}
                  emphasis={item.href === '/journal'}
                />
              ))}
            </div>
          </section>

          {communityBoards.length > 0 && (
            <section className="space-y-2.5">
              <SectionTitle>게시판 바로가기</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {communityBoards.map((board) => {
                  const label = normalizeBoardLabel(getCommunityBoardTabLabel(board.boardType) ?? board.name);
                  return (
                    <Link
                      key={board.id}
                      href={`/community/${board.id}`}
                      onClick={onClose}
                      className="rounded-full border border-[#D9CBB5] bg-white px-3 py-2 text-[12px] font-bold text-[#33413B]"
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          <section className="space-y-2.5">
            <SectionTitle>이용 안내</SectionTitle>
            <div className="rounded-[18px] border border-[#E2D4BE] bg-[#FBF6ED] p-2">
              {GUIDE_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center justify-between rounded-[13px] px-3 py-3 text-[13px] font-bold text-[#293530] hover:bg-white"
                >
                  {item.label}
                  <span className="text-[#A99468]" aria-hidden>
                    ›
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {isAdmin && (
            <section className="space-y-2.5">
              <SectionTitle>운영</SectionTitle>
              <MenuListLink href="/admin?tab=dashboard" label="관리자 대시보드" onClose={onClose} />
            </section>
          )}
        </nav>

        <div className="border-t border-[#E1D5C1] bg-[#FBF6ED] p-4">
          {isLoggedIn ? (
            <div className="space-y-2">
              <Link
                href="/mypage"
                onClick={onClose}
                className="block rounded-[14px] bg-white px-3.5 py-3 text-[13px] font-extrabold text-[#1E2621]"
              >
                {user?.nickname ?? '회원'}님 계정 관리
              </Link>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="w-full rounded-[14px] border border-[#E8C8BC] bg-white px-3.5 py-3 text-left text-[13px] font-bold text-[#C0512F]"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <MenuListLink href="/login" label="로그인" onClose={onClose} />
              <MenuListLink href="/signup" label="회원가입" onClose={onClose} emphasis />
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
