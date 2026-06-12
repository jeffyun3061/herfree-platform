'use client';

import Link from 'next/link';
import type { Post } from '@/domain/post/types';
import { PostCard } from '@/components/community/PostCard';
import { PostListHeader, PostListRow } from '@/components/community/PostListRow';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';

type CommunityPreviewSectionProps = {
  posts: Post[];
  totalElements: number;
  isLoading: boolean;
};

export function CommunityPreviewSection({
  posts,
  totalElements,
  isLoading,
}: CommunityPreviewSectionProps) {
  return (
    <section>
      <SectionHeader title="익명 커뮤니티 미리보기" href="/community" linkLabel="전체 보기" />
      <p className="section-desc mb-4">
        실제 환우들의 경험과 질문을 익명으로 확인할 수 있습니다.
      </p>

      {isLoading ? (
        <LoadingSpinner label="글 불러오는 중…" />
      ) : posts.length === 0 ? (
        <div className="surface-card p-6 text-center text-sm text-muted">
          아직 글이 없습니다. 첫 이야기를 남겨 보세요.
        </div>
      ) : (
        <>
          <div className="surface-card overflow-hidden lg:block">
            <div className="hidden lg:block">
              <PostListHeader />
              {posts.map((post, index) => (
                <PostListRow
                  key={post.id}
                  post={post}
                  rowNumber={totalElements - index}
                />
              ))}
            </div>
            <div className="space-y-0 p-3 lg:hidden">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
          <div className="mt-4 flex justify-center lg:justify-start">
            <Link href="/community">
              <Button variant="secondary" size="sm">
                커뮤니티 참여하기
              </Button>
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
