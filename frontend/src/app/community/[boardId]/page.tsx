'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { CommunityFeed } from '@/components/community/CommunityFeed';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

function BoardPostsContent() {
  const params = useParams();
  const boardId = Number(params.boardId);

  return <CommunityFeed initialBoardId={boardId} />;
}

export default function BoardPostsPage() {
  return (
    <Suspense fallback={<LoadingSpinner label="게시판 불러오는 중…" />}>
      <BoardPostsContent />
    </Suspense>
  );
}
