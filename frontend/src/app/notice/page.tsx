'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useBoards } from '@/hooks/useBoards';
import { usePostList } from '@/hooks/usePosts';
import { formatRelativeTime } from '@/domain/common/format';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Pagination } from '@/components/common/Pagination';
import { getErrorMessage } from '@/lib/api/client';

export default function NoticePage() {
  const { boards } = useBoards();
  const noticeBoardId = useMemo(
    () => boards.find((board) => board.boardType === 'NOTICE')?.id ?? null,
    [boards],
  );
  const { postPage, page, setPage, isLoading, error } = usePostList(
    noticeBoardId,
    20,
    '',
    'createdAt,desc',
    undefined,
    { enabled: noticeBoardId !== null },
  );

  return (
    <>
      <PageHeader title="공지사항" showBack backHref="/mypage" />
      <main className="page-container mx-auto max-w-app pb-8 lg:max-w-content lg:pb-12">
      <section className="rounded-[26px] border border-[#E1D5C1] bg-[#FBF6ED] px-5 py-5 shadow-[0_18px_42px_-34px_rgba(7,37,31,.45)]">
        <p className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#9B8B70]">
          Herfree Notice
        </p>
        <h1 className="hf-display mt-1 text-[25px] font-extrabold text-[#10231F]">
          공지사항
        </h1>
        <p className="mt-1 text-[12.5px] leading-[1.65] text-[#6D746D]">
          서비스 운영 안내와 중요한 변경사항을 한곳에서 확인할 수 있어요.
        </p>
      </section>

      <section className="mt-4 overflow-hidden rounded-[22px] border border-[#E4D8C4] bg-[#FFFCF7] shadow-[0_14px_32px_-28px_rgba(7,37,31,.45)]">
        {isLoading ? (
          <div className="px-4 py-8">
            <LoadingSpinner label="공지사항을 불러오는 중..." />
          </div>
        ) : error ? (
          <div className="px-4 py-8">
            <ErrorMessage message={getErrorMessage(error)} />
          </div>
        ) : postPage.content.length > 0 ? (
          postPage.content.map((post, index) => (
            <Link
              key={post.id}
              href={`/community/posts/${post.id}`}
              className="group block border-t border-[#EFE6D5] px-4 py-4 first:border-t-0 hover:bg-white"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0B3B36] text-[14px] font-black text-[#F0C778]">
                  {page === 0 && index === 0 ? '!' : page * 20 + index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-extrabold tracking-[0.12em] text-[#9B7430]">
                      NOTICE
                    </span>
                    <span className="text-[12px] hf-text-muted">
                      {formatRelativeTime(post.createdAt)}
                    </span>
                  </div>
                  <h2 className="mt-1 line-clamp-2 text-[14.5px] font-extrabold leading-[1.45] text-[#1E2621] group-hover:text-[#0B3B36]">
                    {post.title}
                  </h2>
                  {post.contentPreview && (
                    <p className="mt-1 line-clamp-2 text-[12.5px] leading-[1.6] text-[#65706B]">
                      {post.contentPreview}
                    </p>
                  )}
                </div>
                <span className="mt-4 shrink-0 text-[#B89A63]">&gt;</span>
              </div>
            </Link>
          ))
        ) : (
          <div className="px-4 py-10 text-center">
            <p className="text-[15px] font-extrabold text-[#1E2621]">아직 등록된 공지가 없어요.</p>
            <p className="mt-2 text-[12.5px] leading-[1.6] text-[#65706B]">
              새 안내가 생기면 이곳에 먼저 보여드릴게요.
            </p>
          </div>
        )}
      </section>
      <Pagination page={page} totalPages={postPage.totalPages} onPageChange={setPage} />
      </main>
    </>
  );
}
