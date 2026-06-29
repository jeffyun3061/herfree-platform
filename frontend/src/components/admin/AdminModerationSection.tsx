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
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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
      <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3.5">
        <h2 className="text-[15px] font-semibold text-cream-foreground">숨김 관리</h2>
        <p className="mt-1 text-[12px] leading-relaxed text-muted">
          커뮤니티 게시글·댓글을 숨기거나 다시 노출합니다. 완전 삭제가 아니라 상태 변경으로
          처리됩니다.
        </p>
      </div>

      <div className="flex gap-2">
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
              'rounded-full px-4 py-1.5 text-sm',
              target === item.id ? 'bg-primary text-primary-foreground' : 'bg-cream-dark text-muted',
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
      />

      {isLoading && <LoadingSpinner />}
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

      <div className="space-y-2">
        {target === 'posts'
          ? postPage.content.map((item) => (
              <Card key={item.id} className="space-y-2 rounded-[16px] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-medium',
                      item.status === 'ACTIVE'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-cream-dark text-muted',
                    )}
                  >
                    {item.status === 'ACTIVE' ? '노출 중' : '숨김'}
                  </span>
                  <span className="text-[10px] text-muted">
                    {item.boardName} · {item.authorNickname} · {formatDate(item.createdAt)}
                  </span>
                </div>
                <p className="line-clamp-2 text-[13px] font-semibold leading-[1.45] text-cream-foreground">{item.title}</p>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/community/posts/${item.id}`}>
                    <Button size="sm" variant="secondary">
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
              <Card key={item.id} className="space-y-2 rounded-[16px] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-medium',
                      item.status === 'ACTIVE'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-cream-dark text-muted',
                    )}
                  >
                    {item.status === 'ACTIVE' ? '노출 중' : '숨김'}
                  </span>
                  <span className="text-[10px] text-muted">
                    {item.authorNickname} · {formatDate(item.createdAt)}
                  </span>
                </div>
                <p className="line-clamp-1 text-[11px] text-muted">원글: {item.postTitle}</p>
                <p className="line-clamp-2 text-[13px] leading-[1.45] text-cream-foreground">{item.contentPreview}</p>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/community/posts/${item.postId}`}>
                    <Button size="sm" variant="secondary">
                      글 보기
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
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-[12px] text-muted">
            조건에 맞는 {target === 'posts' ? '게시글' : '댓글'}이 없습니다.
          </p>
        )}
      </div>

      <Pagination page={pageIndex} totalPages={activePage.totalPages} onPageChange={setPage} />
    </div>
  );
}
