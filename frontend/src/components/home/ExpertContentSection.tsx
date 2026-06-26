'use client';

import Link from 'next/link';
import type { Content } from '@/domain/content/types';
import type { Post } from '@/domain/post/types';
import type { Board } from '@/domain/board/types';
import { getContentPreview, getContentTypeLabel } from '@/domain/content/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';

type ExpertContentSectionProps = {
  questionBoard?: Board;
  questionPosts: Post[];
  expertContents: Content[];
  isLoading: boolean;
};

export function ExpertContentSection({
  questionBoard,
  questionPosts,
  expertContents,
  isLoading,
}: ExpertContentSectionProps) {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between">
        <h2 className="section-heading">칼럼 / 질문하기</h2>
        <Link href="/contents" className="section-link">
          칼럼 더 보기
        </Link>
      </div>
      <p className="mb-4 text-sm text-muted">
        검증된 칼럼과 커뮤니티 질문을 통해 궁금한 점을 찾아보세요.
      </p>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="surface-card p-5">
            <h3 className="text-sm font-semibold text-ink">전문가 칼럼</h3>
            {expertContents.length === 0 ? (
              <p className="mt-3 text-sm text-muted">등록된 전문가 칼럼이 없습니다.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {expertContents.slice(0, 3).map((item) => (
                  <li key={item.id}>
                    <Link href={`/contents/${item.id}`} className="group block">
                      <div className="flex items-center gap-2">
                        <Badge variant="gold">{getContentTypeLabel(item.contentType)}</Badge>
                        <span className="text-xs text-muted">{item.category}</span>
                      </div>
                      <p className="mt-1.5 font-medium text-ink group-hover:text-primary">
                        {item.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted">
                        {getContentPreview(item.content, 100)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="surface-card p-5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-ink">질문하기</h3>
              {questionBoard ? (
                <Link href={`/community/${questionBoard.id}`} className="text-xs text-primary">
                  더 보기
                </Link>
              ) : null}
            </div>
            {questionPosts.length === 0 ? (
              <p className="mt-3 text-sm text-muted">등록된 질문이 없습니다.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {questionPosts.slice(0, 4).map((post) => (
                  <li key={post.id}>
                    <Link
                      href={`/community/posts/${post.id}`}
                      className="block rounded-lg border border-border/60 px-3 py-2.5 transition-colors hover:border-primary/25 hover:bg-cream/40"
                    >
                      <p className="line-clamp-1 text-sm font-medium text-ink">{post.title}</p>
                      {post.contentPreview && (
                        <p className="mt-1 line-clamp-1 text-xs text-muted">{post.contentPreview}</p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
