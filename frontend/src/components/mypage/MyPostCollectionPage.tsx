'use client';

import { LoggedOutFeaturePrompt } from '@/components/auth/LoggedOutFeaturePrompt';
import { Pagination } from '@/components/common/Pagination';
import { PostCard, PostCardSkeleton } from '@/components/community/PostCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { useMyPosts, type MyPostCollection } from '@/hooks/useMyPosts';

type MyPostCollectionPageProps = {
  collection: Extract<MyPostCollection, 'received' | 'bookmarked'>;
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyDescription: string;
  pathname: string;
};

export function MyPostCollectionPage({
  collection,
  title,
  subtitle,
  emptyTitle,
  emptyDescription,
  pathname,
}: MyPostCollectionPageProps) {
  const { isReady, isLoggedIn } = useAuth();
  const { postPage, page, setPage, isLoading, error } = useMyPosts(
    isReady && isLoggedIn,
    collection,
    10,
  );

  if (!isReady) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <LoadingSpinner label={`${title} 불러오는 중…`} />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <LoggedOutFeaturePrompt
        title={title}
        subtitle={subtitle}
        body="로그인하면 내 활동을 안전하게 확인할 수 있어요"
        signupFrom={pathname}
      />
    );
  }

  return (
    <>
      <PageHeader title={title} showBack backHref="/mypage" />
      <main className="page-container mx-auto w-full max-w-app hf-scroll-pad-nav lg:max-w-content lg:pb-12">
        <header className="mb-4 px-0.5">
          <h1 className="hf-display text-[24px] font-extrabold text-[#1E2621] lg:hidden">{title}</h1>
          <p className="mt-1 text-[12.5px] leading-[1.65] text-[#7C8279]">{subtitle}</p>
        </header>

        {isLoading ? (
          <div className="space-y-2" aria-label={`${title} 불러오는 중`}>
            {Array.from({ length: 3 }, (_, index) => (
              <PostCardSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          <ErrorMessage message={error} />
        ) : postPage.content.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
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
      </main>
    </>
  );
}
