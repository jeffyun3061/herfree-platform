'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useBoards } from '@/hooks/useBoards';
import { getCommunityBoards, getCommunityBoardTabLabel } from '@/domain/board/privateBoard';
import {
  MenuBellIcon,
  MenuColumnIcon,
  MenuCommunityIcon,
  MenuConsultIcon,
  MenuDocIcon,
  MenuFaqIcon,
  MenuHomeIcon,
  MenuJournalIcon,
  MenuShieldIcon,
  MenuUserIcon,
} from '@/components/layout/MenuDrawerIcons';

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
};

const FEATURE_LINKS = [
  { href: '/', label: '홈', Icon: MenuHomeIcon },
  { href: '/community', label: '커뮤니티', Icon: MenuCommunityIcon },
  { href: '/journal', label: '개인일지', Icon: MenuJournalIcon },
  { href: '/contents', label: '칼럼', Icon: MenuColumnIcon },
  { href: '/qna', label: '자주 묻는 질문(FAQ)', Icon: MenuFaqIcon },
  { href: '/consult', label: '1:1 비밀 상담', Icon: MenuConsultIcon },
  { href: '/mypage', label: '마이페이지', Icon: MenuUserIcon },
] as const;

const GUIDE_LINKS = [
  { href: '/notice', label: '공지사항', Icon: MenuBellIcon },
  { href: '/terms', label: '이용약관', Icon: MenuDocIcon },
  { href: '/privacy', label: '개인정보처리방침', Icon: MenuShieldIcon },
] as const;

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="px-[18px] pb-1.5 pt-[18px]">
      <p className="px-1 pb-2 text-[12px] font-bold tracking-[0.06em] text-[#9A9F94]">{title}</p>
      {children}
    </section>
  );
}

function MenuRow({
  href,
  label,
  Icon,
  onClose,
}: {
  href: string;
  label: string;
  Icon: (props: { className?: string }) => JSX.Element;
  onClose: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="flex items-center gap-3 px-1.5 py-[11px]"
    >
      <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] border border-[#EADFCB] bg-[#FBF6EA]">
        <Icon />
      </span>
      <span className="flex-1 text-[13.5px] font-semibold text-[#1E2621]">{label}</span>
      <span className="shrink-0 text-[#CBD0C7]" aria-hidden>
        ›
      </span>
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
    <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(7,22,18,.45)] lg:hidden">
      <button type="button" className="absolute inset-0" aria-label="메뉴 닫기" onClick={onClose} />
      <aside
        className="relative flex h-full w-[min(100%,300px)] flex-col overflow-y-auto bg-[#F3EDE3] shadow-[-18px_0_40px_-20px_rgba(7,37,31,.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#07251F] px-[22px] pb-[18px] pt-[54px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(243,237,227,.14)] text-[16px] font-bold text-[#F3EDE3]">
                h.
              </span>
              <span className="hf-display text-[18px] font-extrabold text-[#F3EDE3]">헤르프리</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-[20px] leading-none text-white/70"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>
          <p className="mt-2.5 text-[12px] text-white/55">익명 기반 비공개 커뮤니티</p>
        </div>

        <MenuSection title="메뉴">
          {FEATURE_LINKS.map((item) => (
            <MenuRow key={item.href} href={item.href} label={item.label} Icon={item.Icon} onClose={onClose} />
          ))}
        </MenuSection>

        {communityBoards.length > 0 && (
          <MenuSection title="게시판">
            <div className="flex flex-wrap gap-2 px-1 py-0.5">
              {communityBoards.map((board) => {
                const label = normalizeBoardLabel(getCommunityBoardTabLabel(board.boardType) ?? board.name);
                return (
                  <Link
                    key={board.id}
                    href={`/community/${board.id}`}
                    onClick={onClose}
                    className="rounded-full border border-[#EADFCB] bg-[#FBF6EA] px-3.5 py-2 text-[12.5px] font-medium text-[#3C443E]"
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </MenuSection>
        )}

        <MenuSection title="이용안내">
          {GUIDE_LINKS.map((item) => (
            <MenuRow key={item.href} href={item.href} label={item.label} Icon={item.Icon} onClose={onClose} />
          ))}
        </MenuSection>

        {isAdmin && (
          <MenuSection title="운영">
            <MenuRow href="/admin?tab=dashboard" label="관리자 대시보드" Icon={MenuShieldIcon} onClose={onClose} />
          </MenuSection>
        )}

        <div className="px-[22px] pb-[34px] pt-2 text-center">
          {isLoggedIn ? (
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="text-[12.5px] text-[#A6ABA0] underline underline-offset-[3px]"
            >
              로그아웃
            </button>
          ) : (
            <div className="space-y-2">
              <Link
                href="/login"
                onClick={onClose}
                className="block text-[12.5px] font-semibold text-[#0B3B36]"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                onClick={onClose}
                className="block text-[12.5px] text-[#A6ABA0] underline underline-offset-[3px]"
              >
                회원가입
              </Link>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
