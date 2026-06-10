'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useMyPosts } from '@/hooks/useMyPosts';
import { TopBar } from '@/components/layout/TopBar';
import { PostCard } from '@/components/community/PostCard';
import { Pagination } from '@/components/common/Pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { isAdmin, USER_ROLE_LABELS } from '@/domain/user/types';
import { getErrorMessage } from '@/lib/api/client';

function ProfileAvatar({ nickname }: { nickname: string }) {
  const initial = nickname.trim().charAt(0) || '?';

  return (
    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-xl font-semibold text-primary-foreground">
      {initial}
    </span>
  );
}

export default function MyPage() {
  const router = useRouter();
  const { isReady, isLoggedIn, user, logout, withdraw, updateNickname } = useAuth();
  const { postPage, page, setPage, isLoading } = useMyPosts(isLoggedIn);
  const [nickname, setNickname] = useState('');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isReady) return <LoadingSpinner />;

  if (!isLoggedIn) {
    return (
      <>
        <TopBar title="마이" />
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
    if (!confirm('정말 탈퇴하시겠습니까? 작성한 글과 활동 기록이 삭제됩니다.')) return;
    try {
      await withdraw();
      router.replace('/');
    } catch (err) {
      setProfileError(getErrorMessage(err));
    }
  };

  return (
    <>
      <TopBar title="마이" />
      <div className="page-container">
        <section className="hero-panel mb-6 py-5">
          <div className="relative z-10 flex items-center gap-4">
            <ProfileAvatar nickname={user?.nickname ?? ''} />
            <div>
              <p className="text-lg font-semibold">{user?.nickname}</p>
              <p className="mt-0.5 text-sm text-primary-foreground/80">
                {user?.role ? USER_ROLE_LABELS[user.role] : '회원'}
              </p>
              {isAdmin(user?.role) && (
                <Link href="/admin" className="mt-2 inline-block text-sm font-medium underline">
                  관리자 페이지
                </Link>
              )}
            </div>
          </div>
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
          <h3 className="mb-3 text-base font-semibold text-cream-foreground">내가 쓴 글</h3>
          {isLoading ? (
            <LoadingSpinner label="글 불러오는 중…" />
          ) : (
            <>
              {postPage.content.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
              <Pagination page={page} totalPages={postPage.totalPages} onPageChange={setPage} />
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
