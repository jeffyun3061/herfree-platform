'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { useBoards } from '@/hooks/useBoards';
import { usePostDetail, usePostMutation } from '@/hooks/usePosts';
import { TopBar } from '@/components/layout/TopBar';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { getWritableBoards } from '@/domain/board/types';
import { validatePostInput } from '@/domain/post/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

function WritePostForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editPostId = Number(searchParams.get('postId')) || null;
  const initialBoardId = Number(searchParams.get('boardId')) || 0;
  const isEditMode = editPostId !== null;

  const { boards, isLoading: boardsLoading, error: boardsError } = useBoards();
  const writableBoards = getWritableBoards(boards);
  const { post: existingPost, isLoading: postLoading } = usePostDetail(editPostId ?? 0);
  const { createPost, updatePost, isSubmitting, error } = usePostMutation();

  const [boardId, setBoardId] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (isEditMode) return;
    if (writableBoards.length === 0 || initialized) return;
    const defaultBoardId = writableBoards.some((b) => b.id === initialBoardId)
      ? initialBoardId
      : writableBoards[0].id;
    setBoardId(defaultBoardId);
    setInitialized(true);
  }, [isEditMode, writableBoards, initialBoardId, initialized]);

  useEffect(() => {
    if (!isEditMode || !existingPost || initialized) return;
    setBoardId(existingPost.boardId);
    setTitle(existingPost.title);
    setContent(existingPost.content);
    setIsAnonymous(existingPost.isAnonymous);
    setInitialized(true);
  }, [isEditMode, existingPost, initialized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validatePostInput({ title, content });
    if (validation) {
      setValidationError(validation);
      return;
    }
    if (!boardId) {
      setValidationError('게시판을 선택해 주세요.');
      return;
    }
    setValidationError(null);

    if (isEditMode && editPostId) {
      const result = await updatePost(editPostId, { title, content, isAnonymous });
      if (result) router.replace(`/community/posts/${result.id}`);
      return;
    }

    const result = await createPost({ boardId, title, content, isAnonymous });
    if (result) router.replace(`/community/posts/${result.id}`);
  };

  if (isEditMode && (postLoading || !initialized)) {
    return <LoadingSpinner label="글 불러오는 중…" />;
  }

  if (boardsLoading) {
    return <LoadingSpinner label="게시판 불러오는 중…" />;
  }

  if (boardsError) {
    return (
      <div className="px-4 py-6">
        <ErrorMessage message={boardsError} />
      </div>
    );
  }

  if (writableBoards.length === 0) {
    return (
      <div className="px-4 py-6">
        <ErrorMessage message="글을 쓸 수 있는 게시판을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." />
      </div>
    );
  }

  return (
    <>
      <TopBar title={isEditMode ? '글 수정' : '글쓰기'} showBack />
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-4 py-5">
        <div>
          <label htmlFor="board" className="mb-1.5 block text-sm font-medium text-cream-foreground">
            게시판
          </label>
          <select
            id="board"
            value={boardId}
            disabled={isEditMode}
            onChange={(e) => setBoardId(Number(e.target.value))}
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm focus:border-primary focus:outline-none disabled:opacity-60"
          >
            {writableBoards.map((board) => (
              <option key={board.id} value={board.id}>
                {board.name}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
        />
        <Textarea label="내용" value={content} onChange={(e) => setContent(e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
          />
          익명으로 작성
        </label>
        {validationError && <ErrorMessage message={validationError} />}
        {error && <ErrorMessage message={error} />}
        <Button type="submit" fullWidth disabled={isSubmitting || boardId <= 0}>
          {isSubmitting ? '저장 중…' : isEditMode ? '수정하기' : '등록하기'}
        </Button>
      </form>
    </>
  );
}

export default function WritePostPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<LoadingSpinner />}>
        <WritePostForm />
      </Suspense>
    </RequireAuth>
  );
}
