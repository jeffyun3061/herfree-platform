'use client';

import { useBoards } from '@/hooks/useBoards';
import { TopBar } from '@/components/layout/TopBar';
import { BoardListItem } from '@/components/community/BoardListItem';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { getErrorMessage } from '@/lib/api/client';

export default function CommunityPage() {
  const { boards, isLoading, error } = useBoards();

  return (
    <>
      <TopBar title="커뮤니티" />
      <div className="page-container">
        <div className="hero-panel mb-5 py-5">
          <p className="relative z-10 text-sm text-primary-foreground/85">함께 나누는 이야기</p>
          <h2 className="relative z-10 mt-1 text-lg font-semibold">익명으로도, 닉네임으로도</h2>
          <p className="relative z-10 mt-2 text-sm leading-relaxed text-primary-foreground/80">
            경험과 고민을 주제별 게시판에서 나눠 보세요.
          </p>
        </div>

        {isLoading && <LoadingSpinner />}
        {error && <ErrorMessage message={getErrorMessage(error)} />}
        {!isLoading && !error && boards.length === 0 && (
          <EmptyState title="게시판이 없습니다" description="잠시 후 다시 확인해 주세요." />
        )}
        <div className="space-y-3">
          {boards.map((board) => (
            <BoardListItem key={board.id} board={board} />
          ))}
        </div>
      </div>
    </>
  );
}
