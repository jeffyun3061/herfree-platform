'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { useBoards } from '@/hooks/useBoards';
import { usePostDetail, usePostMutation } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import { TopBar } from '@/components/layout/TopBar';
import { SymptomBoardRedirectBanner } from '@/components/community/SymptomBoardRedirectBanner';
import { CommunityPhotoAttach } from '@/components/community/CommunityPhotoAttach';
import { CommunityWriteTipsSheet } from '@/components/community/CommunityWriteTipsSheet';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { getWritableBoards, isStaffOnlyBoardType } from '@/domain/board/types';
import {
  getPrivateBoardMetaByType,
  isMaskedBoardType,
  isOffCommunityPrivateBoardType,
  isSecretStoryBoardType,
  resolvePrivateBoardWritePath,
  SECRET_STORY_BOARD_COPY,
} from '@/domain/board/privateBoard';
import { POST_TITLE_MAX_LENGTH, validatePostInput, pickPostImageUrlForCreate } from '@/domain/post/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { isStaff } from '@/domain/user/types';
import { getErrorMessage } from '@/lib/api/client';
import * as adminApi from '@/lib/api/admin';

const TITLE_UI_MAX = 30;

function WritePostForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editPostId = Number(searchParams.get('postId')) || null;
  const initialBoardId = Number(searchParams.get('boardId')) || 0;
  const isAdminEdit = searchParams.get('admin') === '1';
  const isEditMode = editPostId !== null;

  const { user } = useAuth();
  const staffUser = isStaff(user?.role);
  const isStaffAdminEdit = isEditMode && isAdminEdit && staffUser;

  const { boards, isLoading: boardsLoading, error: boardsError } = useBoards();
  const writableBoards = getWritableBoards(boards).filter(
    (board) => !(staffUser && isMaskedBoardType(board.boardType)),
  );
  const { post: existingPost, isLoading: postLoading } = usePostDetail(editPostId ?? 0);
  const { createPost, updatePost, isSubmitting, error } = usePostMutation();

  const [boardId, setBoardId] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [adminSubmitError, setAdminSubmitError] = useState<string | null>(null);
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);

  const privateWriteRedirect = useMemo(
    () => resolvePrivateBoardWritePath(boards, initialBoardId),
    [boards, initialBoardId],
  );

  useEffect(() => {
    if (!privateWriteRedirect) return;
    router.replace(privateWriteRedirect);
  }, [privateWriteRedirect, router]);

  useEffect(() => {
    if (boardsLoading || boards.length === 0) return;
    if (privateWriteRedirect) return;
    if (isEditMode) return;
    const target = boards.find((board) => board.id === initialBoardId);
    if (target && isStaffOnlyBoardType(target.boardType)) {
      router.replace('/admin?tab=notices');
    }
  }, [boardsLoading, boards, initialBoardId, isEditMode, privateWriteRedirect, router]);

  useEffect(() => {
    if (!isEditMode || !existingPost || boards.length === 0) return;
    const board = boards.find((item) => item.id === existingPost.boardId);
    if (board && isOffCommunityPrivateBoardType(board.boardType)) {
      const meta = getPrivateBoardMetaByType(board.boardType);
      if (meta) {
        router.replace(`${meta.writePath}?postId=${existingPost.id}`);
      }
      return;
    }
    if (board && isStaffOnlyBoardType(board.boardType)) {
      router.replace('/admin?tab=notices');
    }
  }, [isEditMode, existingPost, boards, router]);

  useEffect(() => {
    if (isEditMode) return;
    if (privateWriteRedirect) return;
    if (writableBoards.length === 0 || initialized) return;
    const defaultBoardId = writableBoards.some((b) => b.id === initialBoardId)
      ? initialBoardId
      : writableBoards[0].id;
    setBoardId(defaultBoardId);
    setInitialized(true);
  }, [isEditMode, privateWriteRedirect, writableBoards, initialBoardId, initialized]);

  useEffect(() => {
    if (!isEditMode || !existingPost || initialized) return;
    setBoardId(existingPost.boardId);
    setTitle(existingPost.title);
    setContent(existingPost.content);
    setIsAnonymous(existingPost.isAnonymous);
    setImageUrl(existingPost.imageUrl ?? null);
    setInitialized(true);
  }, [isEditMode, existingPost, initialized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const validation = validatePostInput({ title, content });
    if (validation) {
      setValidationError(validation);
      return;
    }
    if (title.length > POST_TITLE_MAX_LENGTH) {
      setValidationError(`제목은 ${POST_TITLE_MAX_LENGTH}자 이하로 입력해 주세요.`);
      return;
    }
    if (!boardId) {
      setValidationError('게시판을 선택해 주세요.');
      return;
    }
    const selected = boards.find((board) => board.id === boardId);
    if (selected && isStaffOnlyBoardType(selected.boardType)) {
      setValidationError('이 게시판에는 운영 관리 화면에서만 글을 등록할 수 있습니다.');
      return;
    }
    if (selected && isMaskedBoardType(selected.boardType) && staffUser) {
      setValidationError('문의·상담·비밀사연 글은 일반 회원만 작성할 수 있습니다.');
      return;
    }
    setValidationError(null);

    if (isEditMode && editPostId) {
      if (isStaffAdminEdit) {
        setIsAdminSubmitting(true);
        setAdminSubmitError(null);
        try {
          await adminApi.updateAdminPost(editPostId, {
            title: title.trim(),
            content: content.trim(),
          });
          router.replace(`/community/posts/${editPostId}`);
        } catch (err) {
          setAdminSubmitError(getErrorMessage(err));
        } finally {
          setIsAdminSubmitting(false);
        }
        return;
      }

      const result = await updatePost(editPostId, {
        title,
        content,
        isAnonymous,
        imageUrl: imageUrl ?? '',
      });
      if (result) router.replace(`/community/posts/${result.id}`);
      return;
    }

    const result = await createPost({
      boardId,
      title,
      content,
      isAnonymous,
      imageUrl: pickPostImageUrlForCreate(imageUrl),
    });
    if (result) {
      const createdBoard = boards.find((item) => item.id === boardId);
      const privateMeta = createdBoard ? getPrivateBoardMetaByType(createdBoard.boardType) : null;
      if (privateMeta) {
        router.replace(privateMeta.path);
      } else if (createdBoard && isSecretStoryBoardType(createdBoard.boardType)) {
        router.replace(`/community/${boardId}`);
      } else {
        router.replace(`/community/posts/${result.id}`);
      }
    }
  };

  if (!isEditMode && (boardsLoading || privateWriteRedirect)) {
    return <LoadingSpinner label="불러오는 중…" />;
  }

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

  const selectedBoard = writableBoards.find((b) => b.id === boardId);
  const isSymptomBoard = selectedBoard?.boardType === 'SYMPTOM';
  const privateMeta = selectedBoard ? getPrivateBoardMetaByType(selectedBoard.boardType) : null;
  const isSecretStoryWrite = selectedBoard != null && isSecretStoryBoardType(selectedBoard.boardType);
  const isMaskedWrite = Boolean(privateMeta) || isSecretStoryWrite;
  const lockedPrivateBoard =
    !isEditMode &&
    initialBoardId > 0 &&
    writableBoards.some((board) => board.id === initialBoardId && isOffCommunityPrivateBoardType(board.boardType));
  const titleCounterMax = Math.min(TITLE_UI_MAX, POST_TITLE_MAX_LENGTH);
  const writeTitle = isStaffAdminEdit
    ? '운영자 글 수정'
    : isEditMode
      ? '글 수정'
      : privateMeta
        ? privateMeta.writeLabel
        : isSecretStoryWrite
          ? SECRET_STORY_BOARD_COPY.writeLabel
          : '커뮤니티 글쓰기';
  const titlePlaceholder = isSecretStoryWrite
    ? '사연 제목을 입력해 주세요'
    : privateMeta
      ? selectedBoard?.boardType === 'INQUIRY'
        ? '문의 제목을 입력해 주세요'
        : '상담 제목을 입력해 주세요'
      : selectedBoard?.boardType === 'QUESTION'
        ? '질문 제목을 입력해 주세요'
        : '주제를 입력해 주세요';
  const contentPlaceholder = isSecretStoryWrite
    ? '헤르프리에게 전하고 싶은 사연을 편하게 적어 주세요. 운영자만 전체 내용을 확인합니다.'
    : privateMeta
      ? selectedBoard?.boardType === 'INQUIRY'
        ? '문의·건의·신고 내용을 자세히 적어 주세요. 운영팀만 전체 내용을 확인합니다.'
        : '상담하고 싶은 내용을 편하게 적어 주세요. 관리자만 열람할 수 있습니다.'
      : selectedBoard?.boardType === 'QUESTION'
        ? '궁금한 점을 구체적으로 적어 주세요. 다른 회원들이 댓글로 답해 줄 수 있습니다.'
        : '경험, 질문, 위로의 말을 자유롭게 적어 주세요.';

  return (
    <div className="min-h-screen bg-wrtn-bg">
      <TopBar
        title={writeTitle}
        showBack
        backHref={boardId > 0 ? `/community/${boardId}` : '/community'}
      />
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6 px-4 py-5">
        {isSymptomBoard && !isEditMode && <SymptomBoardRedirectBanner />}

        <div className="wrtn-field">
          <label htmlFor="board" className="wrtn-label">
            게시물 종류<span className="wrtn-required">*</span>
          </label>
          <select
            id="board"
            value={boardId}
            disabled={isEditMode || lockedPrivateBoard}
            onChange={(e) => setBoardId(Number(e.target.value))}
            className="wrtn-select disabled:opacity-60"
          >
            {writableBoards.map((board) => (
              <option key={board.id} value={board.id}>
                {board.name}
              </option>
            ))}
          </select>
        </div>

        <div className="wrtn-field">
          <div className="flex items-center gap-1.5">
            <label htmlFor="title" className="wrtn-label">
              게시물 주제<span className="wrtn-required">*</span>
            </label>
            <button
              type="button"
              onClick={() => setTipsOpen(true)}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-wrtn-bg text-wrtn-muted hover:text-primary"
              aria-label="글쓰기 예시 보기"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 10v4M12 7h.01" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <input
            id="title"
            value={title}
            maxLength={POST_TITLE_MAX_LENGTH}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={titlePlaceholder}
            className="wrtn-input"
          />
          <p className="wrtn-char-count">
            {title.length}/{titleCounterMax}
          </p>
        </div>

        {!isMaskedWrite && (
          <CommunityPhotoAttach imageUrl={imageUrl} onChange={setImageUrl} disabled={isSubmitting} />
        )}

        <Textarea
          label="본문"
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={contentPlaceholder}
        />

        {!isMaskedWrite && (
          <label className="flex items-center gap-3 rounded-xl border border-wrtn-border bg-white px-4 py-3.5 text-sm text-ink">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-4 w-4 rounded border-wrtn-border text-primary focus:ring-primary"
            />
            익명으로 작성
          </label>
        )}

        {validationError && <ErrorMessage message={validationError} />}
        {adminSubmitError && <ErrorMessage message={adminSubmitError} />}
        {error && <ErrorMessage message={error} />}

        <Button
          type="submit"
          fullWidth
          size="lg"
          disabled={isSubmitting || isAdminSubmitting || boardId <= 0}
        >
          {isSubmitting || isAdminSubmitting
            ? '저장 중…'
            : isStaffAdminEdit
              ? '운영자 수정 저장'
              : isEditMode
                ? '수정하기'
                : '등록하기'}
        </Button>
      </form>

      <CommunityWriteTipsSheet open={tipsOpen} onClose={() => setTipsOpen(false)} />
    </div>
  );
}

export default function WritePostPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <RequireAuth>
        <WritePostForm />
      </RequireAuth>
    </Suspense>
  );
}
