'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAdminModeration } from '@/hooks/useAdminModeration';
import { Pagination } from '@/components/common/Pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AdminListSummary, AdminListToolbar } from '@/components/admin/AdminPublishUi';
import type { AdminModerationStatus } from '@/lib/api/admin';
import { getErrorMessage } from '@/lib/api/client';
import { cn } from '@/lib/cn';

type ModerationTarget = 'posts' | 'comments';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusLabel(status: AdminModerationStatus) {
  return status === 'ACTIVE' ? '노출 중' : '숨김';
}

export function AdminModerationSection() {
  const [target, setTarget] = useState<ModerationTarget>('posts');
  const [statusFilter, setStatusFilter] = useState<AdminModerationStatus | ''>('HIDDEN');
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');

  const {
    postPage,
    commentPage,
    pageIndex,
    setPage,
    isLoading,
    error,
    actionError,
    isProcessing,
    hidePost,
    restorePost,
    hideComment,
    restoreComment,
  } = useAdminModeration(target, statusFilter, keyword);

  const activePage = target === 'posts' ? postPage : commentPage;

  useEffect(() => {
    setPage(0);
  }, [target, statusFilter, keyword, setPage]);

  const handleSearch = () => {
    setKeyword(searchInput.trim());
    setPage(0);
  };

  return (
    <div className="space-y-4">
      <section className="rounded-[20px] border border-[#E7DFD2] bg-white px-4 py-4 shadow-[0_16px_34px_-30px_rgba(20,31,26,.35)]">
        <p className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#8B9590]">
          Moderation
        </p>
        <h2 className="mt-1 text-[18px] font-extrabold text-[#1E2621]">게시글·댓글 관리</h2>
        <p className="mt-2 text-[12.5px] leading-[1.6] text-[#65706B]">
          광고, 개인정보 노출, 공격적인 댓글은 숨김 처리하고 필요할 때 다시 복구합니다. 삭제보다
          기록이 남는 숨김 처리가 운영 추적에 안전합니다.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-2 rounded-[16px] bg-[#E5D9C7] p-1">
        {(
          [
            { id: 'posts' as const, label: '게시글' },
            { id: 'comments' as const, label: '댓글' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTarget(item.id)}
            className={cn(
              'min-h-10 rounded-[12px] px-3 py-2 text-[12px] font-extrabold transition-colors',
              target === item.id ? 'bg-[#0B3B36] text-white shadow-sm' : 'text-[#81786A]',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <AdminListToolbar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={handleSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        searchPlaceholder={target === 'posts' ? '제목·작성자 검색' : '댓글·작성자 검색'}
      />

      {isLoading && <LoadingSpinner label="운영 목록을 불러오는 중..." />}
      {error && <ErrorMessage message={getErrorMessage(error)} />}
      {actionError && <ErrorMessage message={actionError} className="mb-2" />}

      {!isLoading && !error && (
        <AdminListSummary
          totalElements={activePage.totalElements}
          page={pageIndex}
          totalPages={activePage.totalPages}
          currentCount={activePage.content.length}
          label={target === 'posts' ? '게시글' : '댓글'}
        />
      )}

      <div className="space-y-2.5">
        {target === 'posts'
          ? postPage.content.map((item) => (
              <Card key={item.id} className="space-y-3 rounded-[16px] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-bold',
                      item.status === 'ACTIVE'
                        ? 'bg-[#E7F1EC] text-[#0B3B36]'
                        : 'bg-[#F4E9E2] text-[#B6402D]',
                    )}
                  >
                    {statusLabel(item.status)}
                  </span>
                  <span className="text-[10.5px] text-[#8B9590]">
                    {item.boardName} · {item.authorNickname} · {formatDate(item.createdAt)}
                  </span>
                </div>
                <p className="line-clamp-2 text-[13.5px] font-extrabold leading-[1.45] text-[#1E2621]">
                  {item.title}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Link href={`/community/posts/${item.id}`} className="min-w-0">
                    <Button size="sm" variant="secondary" fullWidth>
                      글 보기
                    </Button>
                  </Link>
                  {item.status === 'ACTIVE' ? (
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={isProcessing}
                      onClick={() => void hidePost(item.id)}
                    >
                      숨김 처리
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled={isProcessing}
                      onClick={() => void restorePost(item.id)}
                    >
                      다시 노출
                    </Button>
                  )}
                </div>
              </Card>
            ))
          : commentPage.content.map((item) => (
              <Card key={item.id} className="space-y-3 rounded-[16px] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-bold',
                      item.status === 'ACTIVE'
                        ? 'bg-[#E7F1EC] text-[#0B3B36]'
                        : 'bg-[#F4E9E2] text-[#B6402D]',
                    )}
                  >
                    {statusLabel(item.status)}
                  </span>
                  <span className="text-[10.5px] text-[#8B9590]">
                    {item.authorNickname} · {formatDate(item.createdAt)}
                  </span>
                </div>
                <p className="line-clamp-1 text-[11.5px] text-[#8B9590]">원글: {item.postTitle}</p>
                <p className="line-clamp-3 text-[13px] leading-[1.5] text-[#1E2621]">{item.contentPreview}</p>
                <div className="grid grid-cols-2 gap-2">
                  <Link href={`/community/posts/${item.postId}`} className="min-w-0">
                    <Button size="sm" variant="secondary" fullWidth>
                      원글 보기
                    </Button>
                  </Link>
                  {item.status === 'ACTIVE' ? (
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={isProcessing}
                      onClick={() => void hideComment(item.id)}
                    >
                      숨김 처리
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled={isProcessing}
                      onClick={() => void restoreComment(item.id)}
                    >
                      다시 노출
                    </Button>
                  )}
                </div>
              </Card>
            ))}

        {!isLoading && activePage.content.length === 0 && (
          <p className="rounded-xl border border-dashed border-[#D9CEBC] bg-white/60 px-4 py-8 text-center text-[12.5px] text-[#65706B]">
            조건에 맞는 {target === 'posts' ? '게시글' : '댓글'}이 없습니다.
          </p>
        )}
      </div>

      <Pagination page={pageIndex} totalPages={activePage.totalPages} onPageChange={setPage} />
    </div>
  );
}
