'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useMyPosts } from '@/hooks/useMyPosts';
import { useMyActivity } from '@/hooks/useMyActivity';
import { useJournalDashboard } from '@/hooks/useJournal';
import { PostCard } from '@/components/community/PostCard';
import { Pagination } from '@/components/common/Pagination';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoggedOutMyPagePromptCard } from '@/components/mypage/LoggedOutMyPagePrompt';
import { isAdmin, isStaff } from '@/domain/user/types';
import { formatMemberDays } from '@/domain/common/format';
import { PUBLIC_IMAGES } from '@/domain/assets/static';
import { getErrorMessage } from '@/lib/api/client';
import { InlineTopActions } from '@/components/layout/InlineTopActions';
import { HealthStatisticsConsentCard } from '@/components/mypage/HealthStatisticsConsentCard';

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
  const { isReady, isLoggedIn, user, logout, withdraw } = useAuth();
  const { activity, isLoading: activityLoading } = useMyActivity(isLoggedIn);
  const { data: journalDashboard } = useJournalDashboard(isLoggedIn);
  const [showWrittenPosts, setShowWrittenPosts] = useState(false);
  const {
    postPage,
    page,
    setPage,
    isLoading: postsLoading,
    error: postsError,
  } = useMyPosts(
    isLoggedIn && showWrittenPosts,
    'written',
    10,
  );
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  if (!isReady) return <LoadingSpinner label="마이페이지 불러오는 중…" />;

  if (!isLoggedIn) return <LoggedOutMyPagePromptCard />;

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    setWithdrawError(null);
    try {
      await withdraw();
      router.replace('/');
    } catch (err) {
      setWithdrawError(getErrorMessage(err));
    } finally {
      setIsWithdrawing(false);
      setWithdrawOpen(false);
    }
  };

  const toggleWrittenPosts = () => {
    setPage(0);
    setShowWrittenPosts((current) => !current);
  };

  const peaceDays = journalDashboard?.relapseFreeDays ?? 0;
  const recordedDays = journalDashboard?.timelineDays?.filter((day) => day.recorded).length ?? 0;
  const memberDaysLabel = formatMemberDays(activity?.memberSince);

  return (
    <>
      <div className="hf-scroll-pad-nav lg:pb-10">
        <section className="relative h-[172px] overflow-hidden">
          <img
            src={PUBLIC_IMAGES.homeHero}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[50%_40%]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,37,31,.45)_0%,rgba(7,37,31,.25)_50%,rgba(243,237,227,.95)_100%)]" />
          <div className="absolute inset-x-0 top-0 z-10 hf-screen-header-block">
            <div className="flex justify-end">
              <InlineTopActions variant="onDark" />
            </div>
          </div>
          <div className="absolute bottom-[14px] left-0 right-0 flex items-center gap-[13px] hf-page-x">
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

        <section className="hf-page-mx mt-[14px] rounded-[18px] bg-white px-2.5 py-[18px] shadow-[0_1px_2px_rgba(20,30,25,.04),0_14px_30px_-24px_rgba(20,30,25,.22)]">
          <div className="grid grid-cols-3">
            {[
              { value: peaceDays, label: '무증상 일수' },
              { value: recordedDays, label: '기록한 날' },
              {
                value: activityLoading ? '…' : (activity?.totalPosts ?? 0),
                label: '남긴 글',
              },
            ].map((stat, index) => (
              <div
                key={stat.label}
                className={`text-center ${index > 0 ? 'border-l border-[#F0EADF]' : ''}`}
              >
                <p className="hf-display text-[23px] font-extrabold text-[#0B3B36]">{stat.value}</p>
                <p className="mt-[3px] text-[11px] text-[#9A9F94]">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="hf-page-mx mt-4">
          <div className="mypage-menu-card">
            <MenuRow
              icon="📝"
              label="내가 쓴 글"
              sub="커뮤니티 · FAQ"
              onClick={toggleWrittenPosts}
            />
            <MenuRow icon="📓" label="내 기록 모아보기" sub="개인일지" href="/journal" />
            <MenuRow icon="📨" label="문의하기" sub="서비스 이용·운영 문의" href="/inquiry" />
            <MenuRow icon="📢" label="공지사항" href="/notice" />
            <MenuRow icon="📄" label="이용약관" href="/terms" />
            <MenuRow icon="🛡️" label="개인정보처리방침" href="/privacy" />
          </div>
        </div>

        <div className="hf-page-mx mt-4">
          <p className="mb-2 px-0.5 text-[11px] font-semibold text-[#9A9F94]">계정</p>
          <div className="mypage-menu-card">
            <MenuRow
              icon="⚙️"
              label="회원정보 수정"
              sub="닉네임 · 비밀번호"
              href="/mypage/account"
            />
            <MenuRow
              icon="💬"
              label="받은 공감"
              sub="내 글에 달린 반응"
              trailing={activityLoading ? '…' : (activity?.receivedReactions ?? 0)}
              href="/mypage/received-reactions"
            />
            <MenuRow
              icon="🔖"
              label="스크랩한 글"
              sub="나중에 다시 볼 글"
              trailing={activityLoading ? '…' : (activity?.bookmarkCount ?? 0)}
              href="/mypage/bookmarks"
            />
            <MenuRow
              icon="💬"
              label="1:1 비밀 상담"
              sub="상담 안내 및 신청"
              href="/consult"
            />
          </div>
        </div>

        <div className="hf-page-mx mt-4">
          <p className="mb-2 px-0.5 text-[11px] font-semibold text-[#9A9F94]">개인정보 선택 동의</p>
          <HealthStatisticsConsentCard />
        </div>

        {isStaff(user?.role) && (
          <div className="hf-page-mx mt-4">
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

        <p className="hf-page-mx mt-4 text-center">
          <button
            type="button"
            className="text-[12.5px] text-[#A6ABA0] underline underline-offset-[3px]"
            onClick={() => {
              void (async () => {
                await logout();
                router.replace('/');
              })();
            }}
          >
            로그아웃
          </button>
        </p>

        {withdrawError && (
          <div className="hf-page-mx mt-3">
            <ErrorMessage message={withdrawError} />
          </div>
        )}

        <p className="mt-2 text-center">
          <button
            type="button"
            className="text-[11px] text-[#C7CECB]"
            onClick={() => setWithdrawOpen(true)}
          >
            회원탈퇴
          </button>
        </p>

        {showWrittenPosts && (
          <section className="hf-page-mx mt-6">
            <h3 className="mb-3 text-base font-semibold text-[#15201D]">내가 쓴 글</h3>
            {postsLoading ? (
              <LoadingSpinner label="글 불러오는 중…" />
            ) : postsError ? (
              <ErrorMessage message={postsError} />
            ) : postPage.content.length === 0 ? (
              <EmptyState
                title="작성한 글이 없습니다"
                description="커뮤니티에서 첫 이야기를 남겨 보세요"
              />
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
