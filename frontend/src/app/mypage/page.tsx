'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useMyPosts } from '@/hooks/useMyPosts';
import { useMyActivity } from '@/hooks/useMyActivity';
import { useBoards } from '@/hooks/useBoards';
import { useJournalDashboard } from '@/hooks/useJournal';
import { PostCard } from '@/components/community/PostCard';
import { Pagination } from '@/components/common/Pagination';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoggedOutMyPagePromptCard } from '@/components/mypage/LoggedOutMyPagePrompt';
import { isAdmin, isStaff } from '@/domain/user/types';
import { formatMemberDays } from '@/domain/common/format';
import { KAKAO_CONSULT_URL } from '@/domain/consult/constants';
import { PUBLIC_IMAGES } from '@/domain/assets/static';
import { findBoardByType } from '@/domain/board/types';
import { getErrorMessage } from '@/lib/api/client';
import { InlineTopActions } from '@/components/layout/InlineTopActions';

const BOOKMARK_KEY = 'herfree-bookmarks';

function loadBookmarkCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(BOOKMARK_KEY);
    return raw ? (JSON.parse(raw) as number[]).length : 0;
  } catch {
    return 0;
  }
}

function MenuRow({
  href,
  icon,
  label,
  sub,
  trailing,
  external,
  danger,
  onClick,
}: {
  href?: string;
  icon: string;
  label: string;
  sub?: string;
  trailing?: React.ReactNode;
  external?: boolean;
  danger?: boolean;
  onClick?: () => void;
}) {
  const className = `mypage-menu-row ${danger ? 'text-[#C0512F]' : ''}`;
  const inner = (
    <>
      <span className="flex min-w-0 items-center gap-[13px]">
        <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-[#F6F1E8] text-[16px] text-[#0B3B36]" aria-hidden>
          {icon}
        </span>
        <span className="min-w-0">
          <span className={`block truncate text-[13.5px] font-semibold ${danger ? 'text-[#C0512F]' : 'text-[#15201D]'}`}>
            {label}
          </span>
          {sub && <span className="mt-0.5 block truncate text-[11px] font-medium text-[#A6ABA0]">{sub}</span>}
        </span>
      </span>
      <span className="flex items-center gap-1.5 text-xs text-[#A6ABA3]">
        {trailing}
        {!danger && <span className="text-[#CBD0C7]">›</span>}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${className} w-full text-left`}>
        {inner}
      </button>
    );
  }

  if (external && href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }

  return (
    <Link href={href ?? '#'} className={className}>
      {inner}
    </Link>
  );
}

export default function MyPage() {
  const router = useRouter();
  const { isReady, isLoggedIn, user, logout, withdraw, updateNickname } = useAuth();
  const { activity, isLoading: activityLoading } = useMyActivity(isLoggedIn);
  const { boards } = useBoards();
  const { data: journalDashboard } = useJournalDashboard(isLoggedIn);
  const { postPage, page, setPage, isLoading: postsLoading } = useMyPosts(isLoggedIn, 10);
  const [showPosts, setShowPosts] = useState(false);
  const [nickname, setNickname] = useState('');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  const noticeBoard = findBoardByType(boards, 'NOTICE');

  useEffect(() => {
    setBookmarkCount(loadBookmarkCount());
  }, []);

  if (!isReady) return <LoggedOutMyPagePromptCard />;

  if (!isLoggedIn) return <LoggedOutMyPagePromptCard />;

  const handleNicknameUpdate = async () => {
    if (!nickname.trim()) {
      setProfileError('닉네임을 입력해 주세요.');
      return;
    }
    setIsUpdating(true);
    setProfileError(null);
    try {
      await updateNickname(nickname.trim());
      setNickname('');
    } catch (err) {
      setProfileError(getErrorMessage(err));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    try {
      await withdraw();
      router.replace('/');
    } catch (err) {
      setProfileError(getErrorMessage(err));
    } finally {
      setIsWithdrawing(false);
      setWithdrawOpen(false);
    }
  };

  const peaceDays = journalDashboard?.relapseFreeDays ?? 0;
  const recordedDays = journalDashboard?.timelineDays?.filter((day) => day.recorded).length ?? 0;
  const memberDaysLabel = formatMemberDays(activity?.memberSince);

  return (
    <>
      <div className="pb-[96px] lg:pb-10">
        <section className="relative h-[172px] overflow-hidden">
          <img
            src={PUBLIC_IMAGES.homeHero}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[50%_40%]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,37,31,.45)_0%,rgba(7,37,31,.25)_50%,rgba(243,237,227,.95)_100%)]" />
          <div className="absolute right-5 top-[52px] text-white">
            <InlineTopActions className="text-white" />
          </div>
          <div className="absolute bottom-[14px] left-0 right-0 flex items-center gap-[13px] px-[22px]">
            <span className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full bg-white/[0.92] text-[26px] shadow-[0_8px_18px_-8px_rgba(0,0,0,.3)]">
              🌙
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[18px] font-extrabold tracking-[-0.01em] text-white drop-shadow-[0_1px_8px_rgba(7,37,31,.4)]">
                {user?.nickname ?? '헤르프리'}
              </p>
              <p className="mt-0.5 text-[11.5px] text-white/85">
                {activityLoading ? '활동 정보 확인 중' : memberDaysLabel}
              </p>
            </div>
          </div>
        </section>

        <section className="mx-5 mt-[14px] rounded-[18px] bg-white px-2.5 py-[18px] shadow-[0_1px_2px_rgba(20,30,25,.04),0_14px_30px_-24px_rgba(20,30,25,.22)]">
          <div className="grid grid-cols-3 divide-x divide-[#F0EADF]">
            <div className="text-center">
              <p className="hf-display text-[23px] font-extrabold text-[#0B3B36]">{peaceDays}</p>
              <p className="mt-[3px] text-[11px] text-[#9A9F94]">무증상 일수</p>
            </div>
            <div className="text-center">
              <p className="hf-display text-[23px] font-extrabold text-[#0B3B36]">{recordedDays}</p>
              <p className="mt-[3px] text-[11px] text-[#9A9F94]">기록한 날</p>
            </div>
            <div className="text-center">
              <p className="hf-display text-[23px] font-extrabold text-[#0B3B36]">
                {activityLoading ? '…' : activity?.totalPosts ?? 0}
              </p>
              <p className="mt-[3px] text-[11px] text-[#9A9F94]">남긴 글</p>
            </div>
          </div>
        </section>

        <div className="mx-5 mt-4">
          <div className="mypage-menu-card">
            <MenuRow
              icon="📝"
              label="내가 쓴 글"
              sub="커뮤니티 · FAQ"
              trailing={activityLoading ? '…' : (activity?.totalPosts ?? 0)}
              onClick={() => setShowPosts((v) => !v)}
            />
            <MenuRow icon="📓" label="내 기록 모아보기" sub="개인일지" href="/journal" />
            <MenuRow icon="🔒" label="1:1 비밀 상담 내역" href="/consult" />
            <MenuRow
              icon="📢"
              label="공지사항"
              href={noticeBoard ? `/community/${noticeBoard.id}` : '/notice'}
            />
            <MenuRow icon="📄" label="이용약관" href="/terms" />
            <MenuRow icon="🛡️" label="개인정보처리방침" href="/privacy" />
          </div>
        </div>

        <div className="mx-5 mt-4">
          <p className="mb-2 px-0.5 text-[11px] font-semibold text-[#9A9F94]">계정</p>
          <div className="mypage-menu-card">
            <div className="border-b border-[#F2ECE1] px-[17px] py-[15px]">
              <p className="mb-2 text-[13.5px] font-semibold text-[#15201D]">닉네임 변경</p>
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1 [&_.wrtn-input]:mt-0">
                  <Input
                    placeholder="새 닉네임"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    maxLength={20}
                  />
                </div>
                <Button
                  size="sm"
                  disabled={isUpdating}
                  className="h-11 shrink-0 px-4"
                  onClick={() => void handleNicknameUpdate()}
                >
                  저장
                </Button>
              </div>
              {profileError && (
                <div className="mt-2">
                  <ErrorMessage message={profileError} />
                </div>
              )}
            </div>
            <MenuRow
              icon="💬"
              label="받은 공감"
              sub="내 글에 달린 반응"
              trailing={activityLoading ? '…' : (activity?.receivedReactions ?? 0)}
              href="/community"
            />
            <MenuRow
              icon="🔖"
              label="스크랩한 글"
              sub="나중에 다시 볼 글"
              trailing={bookmarkCount}
              href="/community"
            />
            <MenuRow
              icon="💬"
              label="카카오톡 상담 신청"
              sub="오픈채팅으로 이동"
              href={KAKAO_CONSULT_URL}
              external
              trailing={<span className="rounded bg-[#F4F6F5] px-1.5 py-0.5 text-[10px]">외부</span>}
            />
          </div>
        </div>

        {isStaff(user?.role) && (
          <div className="mx-5 mt-4">
            <p className="mb-2 px-0.5 text-[11px] font-semibold text-[#9A9F94]">운영</p>
            <div className="mypage-menu-card">
              <MenuRow icon="📊" label="운영 대시보드" sub="오늘 운영 지표" href="/admin?tab=dashboard" />
              <MenuRow icon="🚨" label="신고·숨김 관리" sub="신고 접수 확인" href="/admin?tab=reports" />
              <MenuRow icon="🛡️" label="회원 제재 관리" sub="닉네임·이용 제한" href="/admin?tab=users" />
              {isAdmin(user?.role) && (
                <>
                  <MenuRow icon="📢" label="공지사항 관리" sub="공지 등록" href="/admin?tab=notices" />
                  <MenuRow icon="📝" label="칼럼 관리" sub="칼럼 등록·수정" href="/admin?tab=contents" />
                  <MenuRow icon="🎬" label="영상 관리" sub="영상 링크 관리" href="/admin?tab=videos" />
                </>
              )}
            </div>
          </div>
        )}

        <p className="mt-4 text-center">
          <button
            type="button"
            className="text-[12.5px] text-[#A6ABA0] underline underline-offset-[3px]"
            onClick={() => void logout()}
          >
            로그아웃
          </button>
        </p>

        <p className="mt-3 text-center">
          <button
            type="button"
            className="text-[11px] text-[#C7CECB]"
            onClick={() => setWithdrawOpen(true)}
          >
            회원탈퇴
          </button>
        </p>

        {showPosts && (
          <section className="page-container mt-6">
            <h3 className="mb-3 text-base font-semibold text-[#15201D]">내가 쓴 글</h3>
            {postsLoading ? (
              <LoadingSpinner label="글 불러오는 중…" />
            ) : postPage.content.length === 0 ? (
              <EmptyState title="작성한 글이 없습니다" description="커뮤니티에서 첫 이야기를 남겨 보세요." />
            ) : (
              <>
                <div className="community-feed-list">
                  {postPage.content.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
                <Pagination page={page} totalPages={postPage.totalPages} onPageChange={setPage} />
              </>
            )}
          </section>
        )}
      </div>

      <ConfirmModal
        open={withdrawOpen}
        title="회원 탈퇴"
        message={'정말 탈퇴하시겠습니까?\n작성한 글은 익명 처리되며, 계정은 복구할 수 없습니다.'}
        confirmLabel="탈퇴하기"
        variant="danger"
        isLoading={isWithdrawing}
        onConfirm={() => void handleWithdraw()}
        onClose={() => setWithdrawOpen(false)}
      />
    </>
  );
}
