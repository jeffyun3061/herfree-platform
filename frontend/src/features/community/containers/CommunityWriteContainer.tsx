'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { useBoards } from '@/hooks/useBoards';
import { usePostDetail, usePostMutation } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { SymptomBoardRedirectBanner } from '@/components/community/SymptomBoardRedirectBanner';
import { SecretStoryBoardBanner } from '@/components/community/SecretStoryBoardBanner';
import { getCommunityBoardTabLabel } from '@/domain/board/privateBoard';
import { cn } from '@/lib/cn';
import { CommunityPhotoAttach } from '@/components/community/CommunityPhotoAttach';
import { CommunityWriteTipsSheet } from '@/components/community/CommunityWriteTipsSheet';
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
import { CommunityWriteGuidelines } from '@/components/community/CommunityWriteGuidelines';
import type { PostVisibility } from '@/domain/post/types';

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
  const [visibility, setVisibility] = useState<PostVisibility>('PUBLIC');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);
  const [adminSubmitError, setAdminSubmitError] = useState<string | null>(null);
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);
  const boardScrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollBoardsLeft, setCanScrollBoardsLeft] = useState(false);
  const [canScrollBoardsRight, setCanScrollBoardsRight] = useState(false);

  const updateBoardScrollState = () => {
    const scroller = boardScrollerRef.current;
    if (!scroller) return;
    setCanScrollBoardsLeft(scroller.scrollLeft > 2);
    setCanScrollBoardsRight(scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 2);
  };

  const scrollBoards = (direction: 'left' | 'right') => {
    boardScrollerRef.current?.scrollBy({
      left: direction === 'left' ? -180 : 180,
      behavior: 'smooth',
    });
  };

  const privateWriteRedirect = useMemo(
    () => resolvePrivateBoardWritePath(boards, initialBoardId),
    [boards, initialBoardId],
  );

  useEffect(() => {
    if (!privateWriteRedirect) return;
    router.replace(privateWriteRedirect);
  }, [privateWriteRedirect, router]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(updateBoardScrollState);
    window.addEventListener('resize', updateBoardScrollState);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', updateBoardScrollState);
    };
  }, [writableBoards.length]);

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
    setVisibility(existingPost.visibility);
    setImageUrl(existingPost.imageUrl ?? null);
    setInitialized(true);
  }, [isEditMode, existingPost, initialized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isImageUploading) return;
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
      visibility,
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
          : '새 글 쓰기';
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
        : '서비스 이용·운영 관련 문의를 적어 주세요. 의료 진단·처방·치료 상담은 제공하지 않습니다.'
      : selectedBoard?.boardType === 'QUESTION'
        ? '궁금한 점을 구체적으로 적어 주세요. 다른 회원들이 댓글로 답해 줄 수 있습니다.'
        : '같은 경험을 가진 사람들에게 하고 싶은 이야기를 편하게 적어주세요. 담담하게, 솔직하게.';

  const backHref = boardId > 0 ? `/community/${boardId}` : '/community';
  const submitLabel = isImageUploading
    ? '업로드 중…'
    : isStaffAdminEdit
      ? '저장'
      : isEditMode
        ? '수정'
        : '등록';
  const bottomSubmitLabel = isImageUploading
    ? '사진 업로드 중…'
    : isSubmitting || isAdminSubmitting
      ? '저장 중…'
      : isStaffAdminEdit
        ? '운영자 수정 저장'
        : isEditMode
          ? '수정하기'
          : '등록하기';
  const boardPickerDisabled = isEditMode || lockedPrivateBoard;

  return (
    <div className="flex min-h-screen flex-col bg-white pb-10 hf-subpage-top">
      <header className="flex items-center justify-between border-b border-[#EFE9DD] px-[18px] pb-3.5 pt-0.5">
        <Link
          href={backHref}
          aria-label="뒤로 가기"
          className="shrink-0 text-[22px] leading-none text-[#6E7671]"
        >
          ‹
        </Link>
        <h1 className="min-w-0 flex-1 truncate px-3 text-center text-[15px] font-bold text-[#15201D]">
          {writeTitle}
        </h1>
        <button
          type="submit"
          form="community-write-form"
          disabled={isSubmitting || isAdminSubmitting || isImageUploading || boardId <= 0}
          className="shrink-0 text-[13.5px] font-bold text-[#0B3B36] disabled:opacity-40"
        >
          {submitLabel}
        </button>
      </header>

      <form
        id="community-write-form"
        onSubmit={(e) => void handleSubmit(e)}
        className="flex flex-1 flex-col"
      >
        {isSymptomBoard && !isEditMode && (
          <div className="px-5 pt-4">
            <SymptomBoardRedirectBanner />
          </div>
        )}

        <div className="px-5 pt-[18px]">
          <p className="mb-2.5 text-[12px] font-semibold text-[#9A9F94]">게시판 선택</p>
          <div className="-mx-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => scrollBoards('left')}
              disabled={!canScrollBoardsLeft}
              aria-label="이전 게시판 보기"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E9DFCE] bg-white text-[20px] text-[#496158] shadow-sm disabled:invisible"
            >
              ‹
            </button>
            <div
              ref={boardScrollerRef}
              onScroll={updateBoardScrollState}
              className="min-w-0 flex-1 overflow-x-auto py-0.5 scrollbar-hide"
            >
              <div className="flex w-max gap-2 px-0.5">
              {writableBoards.map((board) => {
                const active = board.id === boardId;
                const label =
                  (getCommunityBoardTabLabel(board.boardType) ?? board.name)
                    .replace(/게시판|방/g, '')
                    .trim() || board.name;

                return (
                  <button
                    key={board.id}
                    type="button"
                    disabled={boardPickerDisabled}
                    onClick={() => setBoardId(board.id)}
                    className={cn(
                      'shrink-0 whitespace-nowrap rounded-full border-[0.5px] px-[15px] py-2 text-[12.5px] font-medium transition-colors disabled:opacity-60',
                      active
                        ? 'border-[#0B3B36] bg-[#0B3B36] text-white'
                        : 'border-[#ECE5D8] bg-white text-[#5C645A]',
                    )}
                  >
                    {label}
                  </button>
                );
              })}
              </div>
            </div>
            <button
              type="button"
              onClick={() => scrollBoards('right')}
              disabled={!canScrollBoardsRight}
              aria-label="다음 게시판 보기"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E9DFCE] bg-white text-[20px] text-[#496158] shadow-sm disabled:invisible"
            >
              ›
            </button>
          </div>
        </div>

        {isSecretStoryWrite && (
          <div className="px-5 pt-4">
            <SecretStoryBoardBanner />
          </div>
        )}

        <div className="px-5 pt-[18px]">
          <div
            className={cn(
              'flex items-center gap-1.5 border-b-2 transition-colors',
              titleFocused ? 'border-[#0B3B36]' : 'border-[#D9CDB8]',
            )}
          >
            <input
              id="title"
              value={title}
              maxLength={POST_TITLE_MAX_LENGTH}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={() => setTitleFocused(true)}
              onBlur={() => setTitleFocused(false)}
              placeholder={titlePlaceholder}
              className="w-full border-0 bg-transparent px-0.5 py-2 text-[16px] font-semibold text-[#1E2621] outline-none"
            />
            <button
              type="button"
              onClick={() => setTipsOpen(true)}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#9A9F94] hover:text-[#0B3B36]"
              aria-label="글쓰기 예시 보기"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 10v4M12 7h.01" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-right text-[11px] text-[#9A9F94]">
            {title.length}/{titleCounterMax}
          </p>
        </div>

        {!isMaskedWrite && (
          <div className="flex-1 px-5 pt-3.5">
            {!isEditMode && <CommunityWriteGuidelines />}
            {!isEditMode && (
              <fieldset className="mt-3 rounded-[14px] border border-[#ECE5D8] bg-[#FFFCF7] p-3">
                <legend className="px-1 text-[12px] font-semibold text-[#5C645A]">공개 범위</legend>
                <div className="mt-1.5 grid grid-cols-2 gap-3">
                  <label className="flex cursor-pointer items-start gap-2 text-[12px] leading-relaxed text-[#1E2621]">
                    <input
                      type="radio"
                      name="post-visibility"
                      value="PUBLIC"
                      checked={visibility === 'PUBLIC'}
                      onChange={() => setVisibility('PUBLIC')}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[#0B3B36]"
                    />
                    <span className="min-w-0 break-keep"><span className="font-semibold">전체 공개</span><br /><span className="text-[#7A8178]">비회원도 볼 수 있어요.</span></span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-2 text-[12px] leading-relaxed text-[#1E2621]">
                    <input
                      type="radio"
                      name="post-visibility"
                      value="MEMBERS_ONLY"
                      checked={visibility === 'MEMBERS_ONLY'}
                      onChange={() => setVisibility('MEMBERS_ONLY')}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[#0B3B36]"
                    />
                    <span className="min-w-0 break-keep"><span className="font-semibold">회원 공개</span><br /><span className="text-[#7A8178]">회원만 볼 수 있어요.</span></span>
                  </label>
                </div>
                <p className="mt-3 break-keep border-t border-[#EEE5D7] pt-2.5 text-[11px] leading-[1.7] text-[#7A8178]">건강정보·실명·연락처처럼 민감한 내용은 공개 게시판 대신 개인일지에 기록해 주세요.</p>
              </fieldset>
            )}
            <label htmlFor="content" className="sr-only">
              본문
            </label>
            <textarea
              id="content"
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={contentPlaceholder}
              className="min-h-[200px] w-full resize-y rounded-[14px] border border-[#ECE5D8] bg-[#F8F4EC] p-[15px] text-[13.5px] leading-[1.7] text-[#1E2621] placeholder:text-[#B4B2A6] outline-none focus:border-[#0B3B36]/35"
            />
            <div className="mt-3">
              <CommunityPhotoAttach
                imageUrl={imageUrl}
                onChange={setImageUrl}
                onUploadingChange={setIsImageUploading}
                disabled={isSubmitting}
                variant="compact"
                emptyText="사진 추가"
              />
            </div>
          </div>
        )}

        {isMaskedWrite && (
          <div className="flex-1 px-5 pt-3.5">
            <label htmlFor="content" className="sr-only">
              본문
            </label>
            <textarea
              id="content"
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={contentPlaceholder}
              className="min-h-[200px] w-full resize-y rounded-[14px] border border-[#ECE5D8] bg-[#F8F4EC] p-[15px] text-[13.5px] leading-[1.7] text-[#1E2621] placeholder:text-[#B4B2A6] outline-none focus:border-[#0B3B36]/35"
            />
          </div>
        )}

        <div className="mt-auto flex items-center gap-2.5 px-5 pt-3">
          {!isMaskedWrite && (
            <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-[#6E766F]">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="sr-only"
              />
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={isAnonymous ? '#0B3B36' : '#9FB6AC'}
                strokeWidth="2"
                aria-hidden
              >
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              비밀글로 작성
            </label>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || isAdminSubmitting || isImageUploading || boardId <= 0}
            className="ml-auto rounded-xl px-[22px] py-[11px] text-[13.5px] font-bold shadow-none"
          >
            {bottomSubmitLabel}
          </Button>
        </div>

        <div className="space-y-3 px-5 pt-4">
          {validationError && <ErrorMessage message={validationError} />}
          {adminSubmitError && <ErrorMessage message={adminSubmitError} />}
          {error && <ErrorMessage message={error} />}
        </div>

      </form>

      <CommunityWriteTipsSheet open={tipsOpen} onClose={() => setTipsOpen(false)} />
    </div>
  );
}

export function CommunityWriteContainer() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <RequireAuth>
        <WritePostForm />
      </RequireAuth>
    </Suspense>
  );
}
