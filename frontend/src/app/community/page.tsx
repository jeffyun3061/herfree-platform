'use client';

import Link from 'next/link';
import { useBoards } from '@/hooks/useBoards';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { getBoardIcon } from '@/domain/board/types';
import { getErrorMessage } from '@/lib/api/client';

export default function CommunityPage() {
  const { boards, isLoading, error } = useBoards();

  return (
    <>
      <TopBar title="커뮤니티" />
      <div className="px-4 py-4">
        {isLoading && <LoadingSpinner />}
        {error && <ErrorMessage message={getErrorMessage(error)} />}
        {!isLoading && !error && boards.length === 0 && (
          <EmptyState title="게시판이 없습니다" description="잠시 후 다시 확인해 주세요." />
        )}
        <div className="space-y-3">
          {boards.map((board) => (
            <Link key={board.id} href={`/community/${board.id}`}>
              <Card>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getBoardIcon(board.boardType)}</span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-medium text-cream-foreground">{board.name}</h2>
                    <p className="mt-1 text-sm text-muted">{board.description}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
