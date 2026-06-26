'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBoards } from '@/hooks/useBoards';
import { usePostDetail, usePostMutation } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import { TopBar } from '@/components/layout/TopBar';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { findBoardByType } from '@/domain/board/types';
import {
  PRIVATE_BOARD_META,
  type OffCommunityPrivateBoardType,
} from '@/domain/board/privateBoard';
import { POST_TITLE_MAX_LENGTH, validatePostInput } from '@/domain/post/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { isStaff } from '@/domain/user/types';

const TITLE_UI_MAX = 30;

type PrivateBoardWriteFormProps = {
  boardType: OffCommunityPrivateBoardType;
};

export function PrivateBoardWriteForm({ boardType }: PrivateBoardWriteFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editPostId = Number(searchParams.get('postId')) || null;
  const isEditMode = editPostId !== null;

  const meta = PRIVATE_BOARD_META[boardType];
  const { user } = useAuth();
  const staffUser = isStaff(user?.role);

  const { boards, isLoading: boardsLoading, error: boardsError } = useBoards();
  const board = findBoardByType(boards, boardType);
  const { post: existingPost, isLoading: postLoading } = usePostDetail(editPostId ?? 0);
  const { createPost, updatePost, isSubmitting, error } = usePostMutation();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (staffUser) {
      router.replace(meta.path);
    }
  }, [staffUser, meta.path, router]);

  useEffect(() => {
    if (!isEditMode || !existingPost || initialized) return;
    if (existingPost.boardId !== board?.id) {
      router.replace(meta.path);
      return;
    }
    setTitle(existingPost.title);
    setContent(existingPost.content);
    setInitialized(true);
  }, [isEditMode, existingPost, board?.id, initialized, meta.path, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!board) {
      setValidationError('게시판을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }

    const validation = validatePostInput({ title, content });
    if (validation) {
      setValidationError(validation);
      return;
    }
    if (title.length > POST_TITLE_MAX_LENGTH) {
      setValidationError(`제목은 ${POST_TITLE_MAX_LENGTH}자 이하로 입력해 주세요.`);
      return;
    }
    setValidationError(null);

    if (isEditMode && editPostId) {
      const result = await updatePost(editPostId, {
        title,
        content,
        isAnonymous: false,
        imageUrl: '',
      });
      if (result) router.replace(`/community/posts/${result.id}`);
      return;
    }

    const result = await createPost({
      boardId: board.id,
      title,
      content,
      isAnonymous: false,
      imageUrl: null,
    });
    if (result) {
      router.replace(meta.path);
    }
  };

  if (staffUser) {
    return null;
  }

  if (isEditMode && (postLoading || !initialized)) {
    return <LoadingSpinner label="글 불러오는 중…" />;
  }

  if (boardsLoading) {
    return <LoadingSpinner label="불러오는 중…" />;
  }

  if (boardsError) {
    return (
      <div className="px-4 py-6">
        <ErrorMessage message={boardsError} />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="px-4 py-6">
        <ErrorMessage message="게시판을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." />
      </div>
    );
  }

  const writeTitle = isEditMode ? `${meta.title} 수정` : meta.writeLabel;
  const titlePlaceholder =
    boardType === 'INQUIRY' ? '문의 제목을 입력해 주세요' : '상담 제목을 입력해 주세요';
  const contentPlaceholder =
    boardType === 'INQUIRY'
      ? '서비스 이용·건의·신고 등 운영팀에 전달할 내용을 자세히 적어 주세요.'
      : '상담하고 싶은 내용을 편하게 적어 주세요. 관리자만 열람할 수 있습니다.';
  const titleCounterMax = Math.min(TITLE_UI_MAX, POST_TITLE_MAX_LENGTH);

  return (
    <div className="min-h-screen bg-wrtn-bg">
      <TopBar title={writeTitle} showBack backHref={meta.path} />
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6 px-4 py-5">
        <p className="rounded-xl border border-wrtn-border bg-white px-4 py-3 text-sm leading-relaxed text-muted">
          {meta.description}
        </p>

        <div className="wrtn-field">
          <label htmlFor="title" className="wrtn-label">
            제목<span className="wrtn-required">*</span>
          </label>
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

        <Textarea
          label="내용"
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={contentPlaceholder}
        />

        {validationError && <ErrorMessage message={validationError} />}
        {error && <ErrorMessage message={error} />}

        <Button type="submit" fullWidth size="lg" disabled={isSubmitting}>
          {isSubmitting
            ? '저장 중…'
            : isEditMode
              ? '수정하기'
              : boardType === 'INQUIRY'
                ? '문의 등록하기'
                : '상담 등록하기'}
        </Button>
      </form>
    </div>
  );
}
