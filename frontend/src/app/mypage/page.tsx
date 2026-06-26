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
import { isAdmin, isStaff } from '@/domain/user/types';
import { formatDate } from '@/domain/common/format';
import { KAKAO_CONSULT_URL } from '@/domain/consult/constants';
import { findBoardByType } from '@/domain/board/types';
import { getErrorMessage } from '@/lib/api/client';

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
  trailing,
  external,
  danger,
  onClick,
}: {
  href?: string;
  icon: string;
  label: string;
  trailing?: React.ReactNode;
  external?: boolean;
  danger?: boolean;
  onClick?: () => void;
}) {
  const className = `mypage-menu-row ${danger ? 'text-[#C0512F]' : ''}`;
  const inner = (
  <>
      <span className={`flex items-center gap-2.5 text-[13.5px] ${danger ? 'text-[#C0512F]' : 'text-[#15201D]'}`}>
        <span className="text-[15px] text-[#5B6864]" aria-hidden>
          {icon}
        </span>
        {label}
      </span>
      <span className="flex items-center gap-1.5 text-xs text-[#A6ABA3]">
        {trailing}
        {!danger && <span className="text-[#C7CECB]">›</span>}
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

  if (!isReady) return <LoadingSpinner />;

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-16 text-center">
        <p className="text-sm text-muted">로그인 후 마이페이지를 이용할 수 있습니다.</p>
        <Link href="/login?from=%2Fmypage">
          <Button>로그인</Button>
        </Link>
      </div>
    );
  }

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
  const memberSince = activity?.memberSince ? formatDate(activity.memberSince) : null;

  return (
    <>
      <div className="pb-24 lg:pb-10">
        <section className="mypage-profile-card">
          <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-white/10 text-[22px]">
            🌿
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15.5px] font-semibold text-white">{user?.nickname}</p>
            <p className="mt-0.5 text-[11.5px] text-white/60">
              {memberSince ? `${memberSince} 가입` : '헤르프리 회원'}
            </p>
          </div>
          <div className="ml-auto shrink-0 text-right">
            <p className="text-lg font-bold text-[#FFD566]">{peaceDays}일</p>
            <p className="text-[10.5px] text-white/60">평온 유지중</p>
          </div>
        </section>

        <div className="mx-4 mt-[18px]">
          <p className="mb-2 px-0.5 text-xs text-[#8B9590]">활동</p>
          <div className="mypage-menu-card">
            <MenuRow
              icon="📝"
              label="내가 쓴 글"
              trailing={activityLoading ? '…' : (activity?.totalPosts ?? 0)}
              onClick={() => setShowPosts((v) => !v)}
            />
            <MenuRow
              icon="💬"
              label="받은 공감"
              trailing={activityLoading ? '…' : (activity?.receivedReactions ?? 0)}
              href="/community"
            />
            <MenuRow
              icon="🔖"
              label="스크랩한 글"
              trailing={bookmarkCount}
              href="/community"
            />
          </div>
        </div>

        <div className="mx-4 mt-[18px]">
          <p className="mb-2 px-0.5 text-xs text-[#8B9590]">설정</p>
          <div className="mypage-menu-card">
            <div className="border-b border-[#EAEDEC] px-4 py-3.5">
              <p className="mb-2 text-[13.5px] font-medium text-[#15201D]">닉네임 변경</p>
              <div className="flex gap-2">
                <Input
                  placeholder="새 닉네임"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={20}
                />
                <Button size="sm" disabled={isUpdating} onClick={() => void handleNicknameUpdate()}>
                  저장
                </Button>
              </div>
              {profileError && <div className="mt-2"><ErrorMessage message={profileError} /></div>}
            </div>
            <MenuRow icon="📓" label="개인일지" href="/journal" />
            {isAdmin(user?.role) && (
              <MenuRow icon="⚙️" label="칼럼·영상 올리기" href="/admin?tab=contents" />
            )}
            {isStaff(user?.role) && !isAdmin(user?.role) && (
              <MenuRow icon="⚙️" label="운영 관리" href="/admin" />
            )}
          </div>
        </div>

        <div className="mx-4 mt-[18px]">
          <p className="mb-2 px-0.5 text-xs text-[#8B9590]">고객지원</p>
          <div className="mypage-menu-card">
            <MenuRow icon="❓" label="자주 묻는 질문" href="/community" />
            <MenuRow icon="🔒" label="1:1 비밀상담" href="/consult" />
            <MenuRow
              icon="💬"
              label="카카오톡 상담 신청"
              href={KAKAO_CONSULT_URL}
              external
              trailing={<span className="ext-badge rounded bg-[#F4F6F5] px-1.5 py-0.5 text-[10px]">외부</span>}
            />
            <MenuRow icon="📢" label="공지사항" href={noticeBoard ? `/community/${noticeBoard.id}` : '/community'} />
          </div>
        </div>

        <div className="mx-4 mt-[18px]">
          <div className="mypage-menu-card">
            <MenuRow icon="🚪" label="로그아웃" danger onClick={() => void logout()} />
          </div>
        </div>

        <p className="mt-4 text-center">
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
