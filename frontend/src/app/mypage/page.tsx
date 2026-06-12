'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useMyPosts } from '@/hooks/useMyPosts';
import { useMyActivity } from '@/hooks/useMyActivity';
import { useBoards } from '@/hooks/useBoards';
import { TopBar } from '@/components/layout/TopBar';
import { PostCard } from '@/components/community/PostCard';
import { Pagination } from '@/components/common/Pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { EmptyState } from '@/components/ui/EmptyState';
import { isAdmin, USER_ROLE_LABELS } from '@/domain/user/types';
import { findBoardByType } from '@/domain/board/types';
import { getErrorMessage } from '@/lib/api/client';
import { cn } from '@/lib/cn';

type PostFilter = 'all' | 'symptom' | 'free';

const FILTER_LABELS: Record<PostFilter, string> = {
  all: '전체',
  symptom: '증상 기록',
  free: '자유글',
};

function ProfileAvatar({ nickname }: { nickname: string }) {
  const initial = nickname.trim().charAt(0) || '?';

  return (
    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-xl font-semibold text-primary-foreground">
      {initial}
    </span>
  );
}

function formatLastPostAt(iso: string | null | undefined): string {
  if (!iso) return '아직 없음';
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function MyPage() {
  const router = useRouter();
  const { isReady, isLoggedIn, user, logout, withdraw, updateNickname } = useAuth();
  const { boards } = useBoards();
  const { activity, isLoading: activityLoading } = useMyActivity(isLoggedIn);
  const { postPage, page, setPage, isLoading: postsLoading } = useMyPosts(isLoggedIn, 10);
  const [nickname, setNickname] = useState('');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [postFilter, setPostFilter] = useState<PostFilter>('all');

  const symptomBoard = findBoardByType(boards, 'SYMPTOM');
  const freeBoard = findBoardByType(boards, 'FREE');

  const filteredPosts = useMemo(() => {
    if (postFilter === 'symptom' && symptomBoard) {
      return postPage.content.filter((post) => post.boardId === symptomBoard.id);
    }
    if (postFilter === 'free' && freeBoard) {
      return postPage.content.filter((post) => post.boardId === freeBoard.id);
    }
    return postPage.content;
  }, [postFilter, postPage.content, symptomBoard, freeBoard]);

  if (!isReady) return <LoadingSpinner />;

  if (!isLoggedIn) {
    return (
      <>
        <TopBar title="마이" className="lg:hidden" />
        <div className="flex flex-col items-center gap-4 px-4 py-16 text-center">
          <p className="text-sm text-muted">로그인 후 내 정보와 작성 글을 확인할 수 있습니다.</p>
          <Link href="/login">
            <Button>로그인</Button>
          </Link>
        </div>
      </>
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
    const confirmed = confirm(
      '정말 탈퇴하시겠습니까?\n작성한 글은 익명 처리되며, 계정은 복구할 수 없습니다.',
    );
    if (!confirmed) return;
    try {
      await withdraw();
      router.replace('/');
    } catch (err) {
      setProfileError(getErrorMessage(err));
    }
  };

  return (
    <>
      <TopBar title="마이" className="lg:hidden" />
      <div className="page-container">
        <section className="mb-6 rounded-2xl border border-border/80 bg-card p-4">
          <div className="flex items-center gap-4">
            <ProfileAvatar nickname={user?.nickname ?? ''} />
            <div>
              <p className="text-lg font-semibold text-cream-foreground">{user?.nickname}</p>
              <p className="mt-0.5 text-sm text-muted">
                {user?.role ? USER_ROLE_LABELS[user.role] : '회원'}
              </p>
              {isAdmin(user?.role) && (
                <Link href="/admin" className="mt-2 inline-block text-sm font-medium text-primary">
                  관리자 페이지
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h3 className="mb-3 text-base font-semibold text-cream-foreground">활동 요약</h3>
          {activityLoading ? (
            <LoadingSpinner label="활동 정보 불러오는 중…" />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-border/80 bg-card px-3 py-4 text-center">
                <p className="text-[11px] text-muted">작성 글</p>
                <p className="mt-1 text-xl font-semibold">{activity?.totalPosts ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-card px-3 py-4 text-center">
                <p className="text-[11px] text-muted">증상 기록</p>
                <p className="mt-1 text-xl font-semibold">{activity?.symptomPosts ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-card px-3 py-4 text-center">
                <p className="text-[11px] text-muted">받은 공감</p>
                <p className="mt-1 text-xl font-semibold">{activity?.receivedReactions ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-card px-3 py-4 text-center">
                <p className="text-[11px] text-muted">최근 작성</p>
                <p className="mt-1 text-sm font-semibold leading-snug">
                  {formatLastPostAt(activity?.lastPostAt)}
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-3 rounded-2xl border border-border/80 bg-card p-4">
          <h3 className="font-medium text-cream-foreground">닉네임 변경</h3>
          <Input
            placeholder="새 닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
          />
          {profileError && <ErrorMessage message={profileError} />}
          <Button disabled={isUpdating} onClick={() => void handleNicknameUpdate()}>
            {isUpdating ? '저장 중…' : '저장'}
          </Button>
        </section>

        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-cream-foreground">내가 쓴 글</h3>
            <Link href="/routine" className="text-xs font-medium text-primary">
              기록 대시보드
            </Link>
          </div>
          <div className="mb-4 flex gap-2">
            {(Object.keys(FILTER_LABELS) as PostFilter[]).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setPostFilter(filter)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs transition-colors',
                  postFilter === filter
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted',
                )}
              >
                {FILTER_LABELS[filter]}
              </button>
            ))}
          </div>
          {postsLoading ? (
            <LoadingSpinner label="글 불러오는 중…" />
          ) : filteredPosts.length === 0 ? (
            <EmptyState
              title="표시할 글이 없습니다"
              description={
                postFilter === 'symptom'
                  ? '증상 기록방에 첫 글을 남겨 보세요.'
                  : '커뮤니티에서 이야기를 나눠 보세요.'
              }
              action={
                symptomBoard ? (
                  <Link href={`/community/write?boardId=${symptomBoard.id}`}>
                    <Button size="sm">글쓰기</Button>
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <>
              {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
              {postFilter === 'all' && (
                <Pagination page={page} totalPages={postPage.totalPages} onPageChange={setPage} />
              )}
            </>
          )}
        </section>

        <section className="mt-8 flex flex-col gap-3">
          <Button variant="secondary" onClick={() => void logout()}>
            로그아웃
          </Button>
          <Button variant="ghost" className="text-red-600" onClick={() => void handleWithdraw()}>
            회원 탈퇴
          </Button>
        </section>
      </div>
    </>
  );
}
