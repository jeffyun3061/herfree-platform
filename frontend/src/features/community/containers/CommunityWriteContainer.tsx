'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { useBoards } from '@/hooks/useBoards';
import { usePostDetail, usePostMutation } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { SymptomBoardRedirectBanner } from '@/components/community/SymptomBoardRedirectBanner';
import { SecretStoryBoardBanner } from '@/components/community/SecretStoryBoardBanner';
import { BoardTabBar } from '@/components/community/BoardTabBar';
import { CommunityPhotoAttach } from '@/components/community/CommunityPhotoAttach';
import { CommunityWriteTipsSheet } from '@/components/community/CommunityWriteTipsSheet';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { getWritableBoards, isStaffOnlyBoardType } from '@/domain/board/types';
import {
  getPrivateBoardMetaByType,
  isMaskedBoardType,
  isAnonymousConcernBoard,
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
import { Modal } from '@/components/ui/Modal';
import { ReadableContent } from '@/components/content/ReadableContent';
import type { PostVisibility } from '@/domain/post/types';

const NEW_POST_TITLE_MAX_LENGTH = 50;

function WritePostForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editPostId = Number(searchParams.get('postId')) || null;
  const initialBoardId = Number(searchParams.get('boardId')) || 0;
  const isAdminEdit = searchParams.get('admin') === '1';
  const isEditMode = editPostId !== null;
  const titleMaxLength = isEditMode ? POST_TITLE_MAX_LENGTH : NEW_POST_TITLE_MAX_LENGTH;

  const { user } = useAuth();
  const staffUser = isStaff(user?.role);
  const isStaffAdminEdit = isEditMode && isAdminEdit && staffUser;

  const { boards, isLoading: boardsLoading, error: boardsError } = useBoards();
  const writableBoards = useMemo(
    () => getWritableBoards(boards).filter((board) => !(staffUser && isMaskedBoardType(board.boardType))),
    [boards, staffUser],
  );
  const { post: existingPost, isLoading: postLoading } = usePostDetail(editPostId ?? 0);
  const { createPost, updatePost, isSubmitting, error } = usePostMutation();

  const [boardId, setBoardId] = useState(0);
  const [title, setTitle] = useState('');
  const titleOverLimit = title.length > titleMaxLength;
  const [content, setContent] = useState('');
  const [showContentPreview, setShowContentPreview] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [visibility, setVisibility] = useState<PostVisibility>('PUBLIC');
  const [publicDisclosureAccepted, setPublicDisclosureAccepted] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [adminSubmitError, setAdminSubmitError] = useState<string | null>(null);
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [draftStatus, setDraftStatus] = useState('');
  const submitting = useRef(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const disclosureRef = useRef<HTMLInputElement>(null);
  const draftKey = user && !isEditMode ? `herfree:community-draft:${user.userId}:${initialBoardId}` : null;
  const closeConfirmation = useCallback(() => setConfirmOpen(false), []);

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
    if (draftKey) {
      try {
        const draft = JSON.parse(sessionStorage.getItem(draftKey) ?? 'null');
        const draftBoard = writableBoards.find((board) => board.id === draft?.boardId);
        if (draftBoard && !isMaskedBoardType(draftBoard.boardType) && typeof draft.title === 'string' && typeof draft.content === 'string') {
          setBoardId(draftBoard.id);
          setTitle(draft.title);
          setContent(draft.content);
          setVisibility(draft.visibility === 'MEMBERS_ONLY' ? 'MEMBERS_ONLY' : 'PUBLIC');
          setIsAnonymous(draft.isAnonymous === true);
          setDraftStatus('임시저장한 글을 불러왔어요.');
        }
      } catch {
        // Storage may be unavailable in some browser sessions.
      }
    }
    setInitialized(true);
  }, [isEditMode, privateWriteRedirect, writableBoards, initialBoardId, initialized, draftKey]);

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

  const submitPost = async (confirmed = false) => {
    if (submitting.current || isSubmitting || isAdminSubmitting || isImageUploading) return;
    if (titleOverLimit) {
      setValidationError(`제목을 ${titleMaxLength}자 이내로 줄여 주세요.`);
      titleRef.current?.focus();
      return;
    }
    const validation = validatePostInput({ title, content });
    if (validation) {
      setValidationError(validation);
      if (!title.trim()) titleRef.current?.focus();
      else if (!content.trim()) {
        setShowContentPreview(false);
        requestAnimationFrame(() => contentRef.current?.focus());
      }
      return;
    }
    if (!boardId) {
      setValidationError('게시판을 선택해 주세요.');
      return;
    }
    const selected = boards.find((board) => board.id === boardId);
    const concern = isAnonymousConcernBoard(selected?.boardType);
    if (concern && !isEditMode && !publicDisclosureAccepted) {
      setValidationError('제목 공개 및 회원 본문 열람 범위를 확인해 주세요.');
      disclosureRef.current?.focus();
      return;
    }
    if (selected && isStaffOnlyBoardType(selected.boardType)) {
      setValidationError('이 게시판에는 운영 관리 화면에서만 글을 등록할 수 있습니다.');
      return;
    }
    if (selected && isMaskedBoardType(selected.boardType) && staffUser) {
      setValidationError('문의·상담·비밀사연 글은 일반 회원만 작성할 수 있습니다.');
      return;
    }
    setValidationError(null);
    if (!confirmed && !isEditMode && selected && !isMaskedBoardType(selected.boardType)) {
      setConfirmOpen(true);
      return;
    }

    submitting.current = true;
    setConfirmOpen(false);
    try {
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
          isAnonymous: concern || isAnonymous,
          imageUrl: imageUrl ?? '',
        });
        if (result) router.replace(`/community/posts/${result.id}`);
        return;
      }

      const result = await createPost({
        boardId,
        title,
        content,
        isAnonymous: concern || isAnonymous,
        visibility: concern ? 'PUBLIC' : visibility,
        publicDisclosureAccepted: concern && publicDisclosureAccepted,
        imageUrl: pickPostImageUrlForCreate(imageUrl),
      });
      if (result) {
        if (draftKey) {
          try { sessionStorage.removeItem(draftKey); } catch {}
        }
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
    } finally {
      submitting.current = false;
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
  const isConcernWrite = isAnonymousConcernBoard(selectedBoard?.boardType);
  const isSymptomBoard = selectedBoard?.boardType === 'SYMPTOM';
  const privateMeta = selectedBoard ? getPrivateBoardMetaByType(selectedBoard.boardType) : null;
  const isSecretStoryWrite = selectedBoard != null && isSecretStoryBoardType(selectedBoard.boardType);
  const isMaskedWrite = Boolean(privateMeta) || isSecretStoryWrite;
  const lockedPrivateBoard =
    !isEditMode &&
    initialBoardId > 0 &&
    writableBoards.some((board) => board.id === initialBoardId && isOffCommunityPrivateBoardType(board.boardType));
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
  const saving = isSubmitting || isAdminSubmitting || isImageUploading;
  const scopeDescription = isConcernWrite
    ? '목록과 공유 미리보기에 제목이 표시될 수 있어요. 본문과 댓글은 로그인 후 볼 수 있어요.'
    : visibility === 'PUBLIC'
      ? '비회원에게 제목이 표시될 수 있어요. 본문을 보려면 로그인해야 해요.'
      : '목록은 회원에게 표시돼요. 링크를 공유하면 비회원에게도 제목이 표시될 수 있어요.';
  const authorDescription = isConcernWrite || isAnonymous ? '익명' : '내 닉네임';
  const saveDraft = () => {
    if (!draftKey || isMaskedWrite) return;
    if (!title.trim() && !content.trim()) {
      setDraftStatus('제목이나 본문을 작성해 주세요.');
      return;
    }
    try {
      sessionStorage.setItem(draftKey, JSON.stringify({ boardId, title, content, visibility, isAnonymous }));
      setDraftStatus('이 탭에 임시저장했어요. 사진은 저장되지 않아요.');
    } catch {
      setDraftStatus('이 브라우저에서는 임시저장할 수 없어요.');
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[720px] flex-col pb-6 hf-subpage-top">
      <header className="mx-4 mb-4 grid grid-cols-[1fr_auto_1fr] items-center border-b border-[#E6DFD2] pb-2">
        <Link href={backHref} aria-label="뒤로 가기" className="flex h-11 w-11 items-center justify-center rounded-lg text-[24px] text-primary hover:bg-primary/5">
          ‹
        </Link>
        <h1 className="text-[17px] font-bold text-ink">{writeTitle}</h1>
      </header>

      <form
        id="community-write-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submitPost();
        }}
        className="flex flex-1 flex-col gap-3 px-4"
      >
        {isSymptomBoard && !isEditMode && <SymptomBoardRedirectBanner />}
        <section aria-labelledby="write-board-heading" className="rounded-2xl border border-[#E6DFD2] bg-[#FFFEFA] p-4">
          <h2 id="write-board-heading" className="mb-2 text-[15px] font-bold text-ink">게시판 선택</h2>
          <BoardTabBar
            boards={writableBoards}
            selectedBoardId={boardId}
            onSelect={(next) => {
              if (next === null) return;
              setBoardId(next);
              setPublicDisclosureAccepted(false);
              setDraftStatus('');
              setValidationError(null);
            }}
            disabled={boardPickerDisabled || saving}
          />
          {isConcernWrite && (
            <p className="mt-2 rounded-lg bg-[#EDF4F0] px-3 py-2 text-[13px] text-[#263B32]">
              닉네임을 숨겨 고민을 나눌 수 있어요. 제목은 비회원에게도 보일 수 있어요.
            </p>
          )}
        </section>

        {isSecretStoryWrite && <SecretStoryBoardBanner />}

        <section aria-label="제목과 본문 입력" className="rounded-2xl border border-[#E6DFD2] bg-[#FFFEFA] p-4">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="title" className="text-[15px] font-bold text-ink">제목 <span className="text-xs font-medium text-muted">필수</span></label>
            <button type="button" onClick={() => setTipsOpen(true)} className="min-h-10 rounded-lg px-2 text-[13px] font-semibold text-primary hover:bg-primary/5">
              글쓰기 예시
            </button>
          </div>
          <input
            id="title"
            ref={titleRef}
            required
            value={title}
            maxLength={titleMaxLength}
            onChange={(event) => { setTitle(event.target.value); setDraftStatus(''); setValidationError(null); }}
            placeholder={titlePlaceholder}
            aria-describedby="community-title-count"
            aria-invalid={titleOverLimit || undefined}
            className="w-full rounded-[10px] border border-[#CCC7BB] bg-white px-3 py-2.5 text-[16px] text-ink placeholder:text-[#737C73] focus-visible:outline-primary"
          />
          <p id="community-title-count" className={`mt-1 text-right text-xs ${titleOverLimit ? 'text-red-700' : 'text-muted'}`}>
            {titleOverLimit && `제목을 ${titleMaxLength}자 이내로 줄여 주세요. `}
            {title.length} / {titleMaxLength}
          </p>

          <div className="mt-3 flex items-center justify-between gap-2">
            <label htmlFor={showContentPreview ? undefined : 'content'} className="text-[15px] font-bold text-ink">본문 <span className="text-xs font-medium text-muted">필수</span></label>
            {showContentPreview && <span className="text-xs font-semibold text-primary">미리보기</span>}
          </div>
          {showContentPreview ? (
            <div data-testid="community-post-preview" className="mt-2 min-h-[150px] rounded-[10px] border border-[#CCC7BB] bg-[#F8F5EF] p-3">
              {content.trim() ? <ReadableContent text={content} variant="community" /> : (
                <p className="hf-community-writing-content text-muted">본문을 입력하면 여기에 표시돼요.</p>
              )}
            </div>
          ) : (
            <textarea
              id="content"
              ref={contentRef}
              required
              value={content}
              onChange={(event) => { setContent(event.target.value); setDraftStatus(''); setValidationError(null); }}
              placeholder={contentPlaceholder}
              className="hf-community-writing-content mt-2 min-h-[150px] w-full resize-y rounded-[10px] border border-[#CCC7BB] bg-white p-3 placeholder:text-[#737C73] focus-visible:outline-primary"
            />
          )}

          {!isMaskedWrite && (
            <div className="mt-3">
              <CommunityPhotoAttach
                imageUrl={imageUrl}
                onChange={setImageUrl}
                onUploadingChange={setIsImageUploading}
                disabled={saving}
                variant="compact"
                emptyText="사진 추가"
              />
            </div>
          )}
        </section>

        {!isMaskedWrite && (
          <section aria-label="공개 및 작성자 설정" className="rounded-2xl border border-[#E6DFD2] bg-[#FFFEFA] p-4">
            {isConcernWrite ? (
              <>
                <h2 className="text-[15px] font-bold text-ink">공개 범위 · 익명 고민</h2>
                <div className="mt-2 rounded-xl bg-[#EDF4F0] p-3 text-[13px] leading-relaxed text-[#263B32]">
                  <p className="font-bold">닉네임 비공개로 작성됩니다.</p>
                  <p>{scopeDescription}</p>
                  {!isEditMode && (
                    <label className="mt-2 flex min-h-11 cursor-pointer items-center gap-2">
                      <input ref={disclosureRef} type="checkbox" checked={publicDisclosureAccepted} onChange={(event) => { setPublicDisclosureAccepted(event.target.checked); setValidationError(null); }} className="h-4 w-4 shrink-0 accent-primary" />
                      제목 공개 및 회원 본문 열람 범위를 확인했습니다.
                    </label>
                  )}
                </div>
              </>
            ) : (
              <>
                {!isEditMode && (
                  <fieldset>
                    <legend className="text-[15px] font-bold text-ink">공개 범위</legend>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {([
                        ['PUBLIC', '전체 공개', '제목은 공개될 수 있고 본문은 로그인 후'],
                        ['MEMBERS_ONLY', '회원 공개', '목록은 회원에게만 표시'],
                      ] as const).map(([value, label, hint]) => (
                        <label key={value} className="flex min-w-0 cursor-pointer items-start gap-2 rounded-xl border border-[#CCC7BB] bg-white p-3 has-[:checked]:border-primary has-[:checked]:bg-[#EDF4F0]">
                          <input
                            type="radio"
                            name="post-visibility"
                            value={value}
                            checked={visibility === value}
                            onChange={() => { setVisibility(value); setDraftStatus(''); }}
                            className="mt-1 h-4 w-4 shrink-0 accent-primary"
                          />
                          <span className="min-w-0">
                            <strong className="block text-[14px] text-ink">{label}</strong>
                            <span className="mt-1 block break-keep text-xs leading-relaxed text-muted">{hint}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}
                <label className="flex min-h-14 cursor-pointer items-center justify-between gap-3 py-2">
                  <span><strong className="block text-[14px] text-ink">익명으로 작성</strong><span className="text-xs text-muted">닉네임을 숨겨요</span></span>
                  <span className="relative shrink-0">
                    <input
                      type="checkbox"
                      role="switch"
                      checked={isAnonymous}
                      onChange={(event) => { setIsAnonymous(event.target.checked); setDraftStatus(''); }}
                      className="peer sr-only"
                    />
                    <span aria-hidden className="block h-6 w-11 rounded-full bg-[#CCD3CA] after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-5 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary" />
                  </span>
                </label>
                <p className="rounded-xl bg-[#EDF4F0] px-3 py-2.5 text-[13px] leading-relaxed text-[#263B32]" aria-live="polite">
                  {scopeDescription} {isAnonymous ? '작성자는 익명으로 표시돼요.' : '내 닉네임이 표시돼요.'}
                </p>
              </>
            )}
          </section>
        )}

        {!isMaskedWrite && !isEditMode && (
          <details className="px-1 text-[13px] text-muted">
            <summary className="cursor-pointer rounded-lg py-2 font-semibold text-primary">글쓰기 안내</summary>
            <p className="pb-2 leading-relaxed">제목, 본문, 사진에 실명이나 연락처 등 개인정보를 넣지 마세요. 나만 볼 건강 기록은 개인일지에 남길 수 있어요.</p>
          </details>
        )}

        {(validationError || adminSubmitError || error) && (
          <div className="space-y-2" role="alert">
            {validationError && <ErrorMessage message={validationError} />}
            {adminSubmitError && <ErrorMessage message={adminSubmitError} />}
            {error && <ErrorMessage message={error} />}
          </div>
        )}
        {draftStatus && <p role="status" className="text-[13px] text-muted">{draftStatus}</p>}

        <div className="sticky bottom-0 z-10 mt-auto flex flex-wrap items-center justify-end gap-2 border-t border-[#E6DFD2] bg-[#F8F5EF] pt-2 pb-[max(.5rem,env(safe-area-inset-bottom))]">
          {draftKey && !isMaskedWrite && <Button type="button" variant="ghost" size="sm" className="mr-auto min-h-11 px-1.5" onClick={saveDraft} disabled={saving}>임시저장</Button>}
          {!isMaskedWrite && (
            <Button type="button" variant="secondary" size="sm" aria-pressed={showContentPreview} onClick={() => {
              setShowContentPreview(!showContentPreview);
              requestAnimationFrame(() => {
                const target = showContentPreview ? contentRef.current : document.querySelector('[data-testid="community-post-preview"]');
                target?.scrollIntoView({ block: 'center' });
              });
            }} className="min-h-11">
              {showContentPreview ? '계속 쓰기' : '미리보기'}
            </Button>
          )}
          <Button type="submit" disabled={saving || boardId <= 0} className="min-h-11">{bottomSubmitLabel}</Button>
        </div>
      </form>

      <CommunityWriteTipsSheet open={tipsOpen} onClose={() => setTipsOpen(false)} />
      <Modal open={confirmOpen} title="이 설정으로 등록할까요?" onClose={closeConfirmation}>
        <p className="break-words text-[15px] font-bold text-ink">{title.trim()}</p>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 rounded-xl bg-[#EDF4F0] p-3 text-[13px] text-ink">
          <dt className="text-muted">게시판</dt><dd className="font-semibold">{selectedBoard?.name}</dd>
          <dt className="text-muted">공개 범위</dt><dd>{scopeDescription}</dd>
          <dt className="text-muted">작성자 표시</dt><dd>{authorDescription}</dd>
        </dl>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">제목, 본문, 사진에 개인정보가 없는지 확인해 주세요.</p>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={closeConfirmation}>계속 수정</Button>
          <Button type="button" disabled={saving} onClick={() => void submitPost(true)}>글 등록</Button>
        </div>
      </Modal>
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
