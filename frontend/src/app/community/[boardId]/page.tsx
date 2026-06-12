'use client';

import { useParams } from 'next/navigation';
import { CommunityFeed } from '@/components/community/CommunityFeed';
import { TopBar } from '@/components/layout/TopBar';
import { useBoards } from '@/hooks/useBoards';

export default function BoardPostsPage() {
  const params = useParams();
  const boardId = Number(params.boardId);
  const { boards } = useBoards();
  const board = boards.find((b) => b.id === boardId);

  return (
    <>
      <TopBar title={board?.name ?? '게시판'} showBack />
      <CommunityFeed initialBoardId={boardId} />
    </>
  );
}
