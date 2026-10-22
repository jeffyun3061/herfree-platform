'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { CommunityGuestPostPanel } from '@/components/community/CommunityGuestPostPanel';
import { ReportModal } from '@/components/community/ReportModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { useBoards } from '@/hooks/useBoards';
import { useComments } from '@/hooks/useComments';
import { usePostBookmark } from '@/hooks/usePostBookmark';
import { usePostDetail } from '@/hooks/usePosts';
import { isStaffOnlyBoardType, getBoardTagClass } from '@/domain/board/types';
import {
  getCommunityBoardTabLabel,
  getMaskedBoardBackHref,
  isMaskedBoardType,
  isAnonymousConcernBoard,
} from '@/domain/board/privateBoard';
import { validateCommentInput } from '@/domain/comment/types';
import { isAdmin, isStaff } from '@/domain/user/types';
import { getErrorMessage } from '@/lib/api/client';
import { navigateBack } from '@/lib/navigateBack';
import { communityPostUrl, shareCommunityPost } from '@/domain/post/share';
import { CommentComposer } from '@/features/community/post-detail/CommentComposer';
import { CommentThread } from '@/features/community/post-detail/CommentThread';
import { PostDetailView } from '@/features/community/post-detail/PostDetailView';
import {
  getPostDetailConfirmationCopy,
  type PendingPostDetailConfirmation,
} from '@/features/community/post-detail/types';
import { usePostDetailActions } from '@/features/community/post-detail/usePostDetailActions';

function normalizeBoardTagLabel(boardType: string | undefined, boardName: string) {
  const tabLabel = boardType ? getCommunityBoardTabLabel(boardType) : undefined;
  return (tabLabel ?? boardName).replace(/게시판|방/g, '').trim() || boardName;
}

export default function PostDetailContainer() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const postId = Number(params.postId);
  const { isLoggedIn, isReady, user } = useAuth();
  const { boards, isLoading: boardsLoading } = useBoards();
  const { post, isLoading, error, errorStatus, refetch: refetchPost } = usePostDetail(postId);
  const postBoard = boards.find((board) => board.id === post?.boardId);
  const bookmarkEnabled =
    isReady && isLoggedIn && post != null && postBoard != null && !isMaskedBoardType(postBoard.boardType);
  const {
    bookmarked,
    isLoading: bookmarkLoading,
    isUpdating: bookmarkUpdating,
    error: bookmarkError,
    toggle: toggleBookmark,
  } = usePostBookmark(postId, bookmarkEnabled);
  const {
    commentPage,
    page,
    setPage,
    isLoading: commentsLoading,
    mutationError,
    isSubmitting,
    addComment,
    removeComment,
    refetch: refetchComments,
  } = useComments(postId);
  const postActions = usePostDetailActions(postId);

  const [commentText, setCommentText] = useState('');
  const [commentIdentity, setCommentIdentity] = useState<{ postId: number; isAnonymous: boolean } | null>(null);
  const [replyParentId, setReplyParentId] = useState<number | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportCommentId, setReportCommentId] = useState<number | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingPostDetailConfirmation | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const loginHref = `/login?from=${encodeURIComponent(`/community/posts/${postId}`)}`;
  const staffUser = isStaff(user?.role);
  const isConcernPost = isAnonymousConcernBoard(postBoard?.boardType);
  const commentIsAnonymous = (isConcernPost && post?.isMyPost)
    || (commentIdentity?.postId === postId ? commentIdentity.isAnonymous : isConcernPost);
  const replyTarget = replyParentId === null
    ? null
    : commentPage.content.find((comment) => comment.id === replyParentId) ?? null;

  const startReply = (commentId: number) => {
    setReplyParentId(commentId);
    setCommentError(null);
    window.requestAnimationFrame(() => {
      commentInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      commentInputRef.current?.focus({ preventScroll: true });
    });
  };

  const cancelReply = () => {
    setReplyParentId(null);
    setCommentError(null);
    commentInputRef.current?.focus();
  };

  const handleComment = async () => {
    const validation = validateCommentInput(commentText);
    if (validation) {
      setCommentError(validation);
      return;
    }

    setCommentError(null);
    const created = await addComment({
      content: commentText,
      isAnonymous: commentIsAnonymous,
      parentId: replyParentId,
    });
    if (created) {
      setCommentText('');
      setReplyParentId(null);
      setCommentIdentity(null);
      await refetchPost();
    }
  };

  const navigateToBoard = () => {
    const board = boards.find((item) => item.id === post?.boardId);
    const href = board
      ? getMaskedBoardBackHref(board.boardType, board.id)
      : '/community';
    router.replace(href);
  };

  const handleConfirm = async () => {
    if (!pendingConfirm) return;

    setIsConfirming(true);
    try {
      if (pendingConfirm.type === 'delete-post') {
        if (await postActions.deleteCurrentPost()) navigateToBoard();
      } else if (pendingConfirm.type === 'delete-comment') {
        await removeComment(pendingConfirm.commentId);
      } else if (pendingConfirm.type === 'hide-post') {
        if (await postActions.hideCurrentPost()) navigateToBoard();
      } else if (pendingConfirm.type === 'hide-comment') {
        if (await postActions.hideComment(pendingConfirm.commentId)) {
          await refetchComments();
        }
      }
      setPendingConfirm(null);
    } catch (cause) {
      setCommentError(getErrorMessage(cause));
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCopyLink = async () => {
    if (post?.shareable !== true) return;
    try {
      const result = await shareCommunityPost({
        title: post?.title ?? '', content: post?.content ?? '',
        url: communityPostUrl(postId, window.location.origin),
        publicPreview: post.shareable,
      });
      if (result === 'cancelled') return;
      setCopyMessage(result === 'shared' ? '공유 창이 열렸어요.' : '공유 내용을 복사했어요.');
    } catch {
      setCopyMessage('공유를 지원하지 않는 환경이에요.');
    }
    window.setTimeout(() => setCopyMessage(null), 2200);
  };

  if (!isReady || isLoading || boardsLoading) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-12 sm:px-5">
        <LoadingSpinner label="글을 준비하는 중..." />
      </div>
    );
  }
  if (error || !post) {
    if (!isLoggedIn && (errorStatus === 401 || errorStatus === 403 || errorStatus === 404)) {
      return <div className="mx-auto max-w-[720px] px-4 py-10 sm:px-5"><CommunityGuestPostPanel loginFrom={encodeURIComponent(`/community/posts/${postId}`)} /></div>;
    }
    if (isLoggedIn && (errorStatus === 403 || errorStatus === 404)) {
      return <div className="mx-auto max-w-[720px] px-4 py-10 sm:px-5"><ErrorMessage message="이 글에 접근할 수 없습니다." /><Link className="mt-4 inline-block font-bold text-primary underline" href="/">홈으로 이동</Link></div>;
    }
    return (
      <div className="mx-auto max-w-[720px] px-4 py-10 sm:px-5">
        <ErrorMessage message={error ? getErrorMessage(error) : '글을 찾을 수 없습니다.'} />
      </div>
    );
  }
  if (!isLoggedIn && !isConcernPost) {
    return (
      <div className="mx-auto max-w-[720px] hf-scroll-pad-nav-tight">
        <PostDetailBackHeader backHref="/community" pathname={pathname} />
        <div className="px-5">
          <CommunityGuestPostPanel loginFrom={encodeURIComponent(`/community/posts/${postId}`)} />
        </div>
      </div>
    );
  }

  if (post.readable === false) {
    return <div className="mx-auto max-w-[720px] px-4 py-10 sm:px-5"><ErrorMessage message="이 글에 접근할 수 없습니다." /><Link className="mt-4 inline-block font-bold text-primary underline" href="/">홈으로 이동</Link></div>;
  }

  const isStaffOnlyPost = postBoard != null && isStaffOnlyBoardType(postBoard.boardType);
  const isMaskedPost = postBoard != null && isMaskedBoardType(postBoard.boardType);
  const backHref = postBoard
    ? getMaskedBoardBackHref(postBoard.boardType, postBoard.id)
    : `/community/${post.boardId}`;
  const showComments = !isMaskedPost || post.isMyPost || staffUser;
  const canWriteComments = isMaskedPost ? staffUser && isLoggedIn : isLoggedIn;
  const privateCommentHint = isMaskedPost && post.isMyPost && !staffUser;
  const boardTagLabel = normalizeBoardTagLabel(postBoard?.boardType, post.boardName);
  const boardTagClass = getBoardTagClass(postBoard?.boardType ?? 'FREE');
  const confirmationCopy = getPostDetailConfirmationCopy(pendingConfirm);

  return (
    <>
      <article className="mx-auto max-w-[720px] pb-10 lg:pb-12">
        <div className="flex items-center justify-between gap-3 px-4 pb-3.5 hf-subpage-top">
          <button
            type="button"
            onClick={() => navigateBack(router, { pathname, fallbackHref: backHref })}
            className="flex min-w-0 items-center gap-2.5 text-[15px] font-bold text-[#15201D]"
          >
            <span className="text-[22px] font-normal leading-none text-[#6E7671]">‹</span>
            커뮤니티
          </button>
          {post.shareable === true && <button
            type="button"
            onClick={() => void handleCopyLink()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#65706B] shadow-[0_10px_22px_-18px_rgba(7,37,31,.45)]"
            aria-label="게시글 공유"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M10 13a5 5 0 0 0 7.1 0l2.8-2.8a5 5 0 0 0-7.1-7.1l-1.3 1.3" />
              <path d="M14 11a5 5 0 0 0-7.1 0l-2.8 2.8a5 5 0 0 0 7.1 7.1l1.3-1.3" />
            </svg>
          </button>}
        </div>
        {copyMessage && (
          <p className="mx-5 mb-3 rounded-[13px] bg-[#0B3B36] px-4 py-2 text-[12px] font-bold text-white">
            {copyMessage}
          </p>
        )}
        <PostDetailView
          post={post}
          boardTagLabel={boardTagLabel}
          boardTagClass={boardTagClass}
          isMaskedPost={isMaskedPost}
          isStaffOnlyPost={isStaffOnlyPost}
          isLoggedIn={isLoggedIn}
          isStaffUser={staffUser}
          isAdminUser={isAdmin(user?.role)}
          boardType={postBoard?.boardType}
          commentCount={commentPage.totalElements}
          bookmarked={bookmarked}
          bookmarkLoading={bookmarkLoading}
          bookmarkUpdating={bookmarkUpdating}
          bookmarkError={bookmarkError}
          onToggleBookmark={() => void toggleBookmark()}
          onOpenReport={() => setReportOpen(true)}
          onRequestConfirmation={setPendingConfirm}
        />

        {showComments && (
          <section className="px-5 pt-[18px]">
            <CommentThread
              comments={commentPage.content}
              page={page}
              totalPages={commentPage.totalPages}
              totalElements={commentPage.totalElements}
              isLoading={commentsLoading}
              isLoggedIn={isLoggedIn}
              isStaffUser={staffUser}
              isStaffOnlyPost={isStaffOnlyPost}
              isMaskedPost={isMaskedPost}
              isConcernPost={isConcernPost}
              canWriteComments={canWriteComments}
              privateCommentHint={privateCommentHint}
              activeReplyId={replyParentId}
              onPageChange={setPage}
              onRequestConfirmation={setPendingConfirm}
              onReport={setReportCommentId}
              onReply={startReply}
            />

            {canWriteComments ? (
              <>
                {isConcernPost && post.isMyPost && (
                  <p className="mt-4 text-[12px] text-muted">글쓴이의 답변과 대댓글은 닉네임 비공개로 표시됩니다. 내용은 모두에게 공개됩니다.</p>
                )}
                {isConcernPost && !post.isMyPost && (
                  <fieldset className="mt-4">
                    <legend className="mb-2 text-[12px] font-semibold text-[#36453B]">답변 작성자 표시</legend>
                    <div className="flex w-full rounded-md bg-[#EDF4F0] p-1" aria-label="답변 작성자 표시">
                      {[
                        { anonymous: true, label: '익명' },
                        { anonymous: false, label: '닉네임 공개' },
                      ].map((option) => (
                        <label key={option.label} className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded text-[12px] font-semibold ${commentIsAnonymous === option.anonymous ? 'bg-white text-[#0B3B36] shadow-sm' : 'text-[#5C645A]'}`}>
                          <input
                            type="radio"
                            name="comment-identity"
                            checked={commentIsAnonymous === option.anonymous}
                            onChange={() => setCommentIdentity({ postId, isAnonymous: option.anonymous })}
                            className="sr-only"
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                    <p className="mt-2 text-[12px] text-muted">답변 내용은 모두에게 공개됩니다.</p>
                  </fieldset>
                )}
                <CommentComposer
                  inputRef={commentInputRef}
                  replyTarget={replyTarget}
                  isMaskedPost={isMaskedPost}
                  isConcernPost={isConcernPost}
                  value={commentText}
                  isSubmitting={isSubmitting}
                  onChange={setCommentText}
                  onCancelReply={cancelReply}
                  onSubmit={() => void handleComment()}
                />
              </>
            ) : !isLoggedIn ? (
              <div className="mt-5 rounded-xl border border-dashed border-[#ECE5D8] bg-[#F8F4EC] p-5 text-center">
                <p className="text-sm text-muted">댓글을 남기려면 로그인이 필요합니다.</p>
                <Link href={loginHref} className="mt-3 inline-block">
                  <Button size="sm">로그인하기</Button>
                </Link>
              </div>
            ) : null}
            {!isMaskedPost && !isConcernPost && canWriteComments && (
              <label className="mt-3 flex items-center gap-2 text-[12px] text-muted">
                <input
                  type="checkbox"
                  checked={commentIsAnonymous}
                  onChange={(event) => setCommentIdentity({ postId, isAnonymous: event.target.checked })}
                />
                익명으로 작성
              </label>
            )}
            {commentError && <div className="mt-3"><ErrorMessage message={commentError} /></div>}
            {mutationError && <div className="mt-3"><ErrorMessage message={mutationError} /></div>}
            {postActions.error && <div className="mt-3"><ErrorMessage message={postActions.error} /></div>}
          </section>
        )}
      </article>

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="POST"
        targetId={post.id}
      />
      {reportCommentId !== null && (
        <ReportModal
          open
          onClose={() => setReportCommentId(null)}
          targetType="COMMENT"
          targetId={reportCommentId}
        />
      )}
      <ConfirmModal
        open={pendingConfirm !== null}
        title={confirmationCopy.title}
        message={confirmationCopy.message}
        confirmLabel={confirmationCopy.confirmLabel}
        variant={confirmationCopy.variant}
        isLoading={isConfirming || postActions.isPending}
        onConfirm={() => void handleConfirm()}
        onClose={() => setPendingConfirm(null)}
      />
    </>
  );
}

function PostDetailBackHeader({
  backHref,
  pathname,
}: {
  backHref: string;
  pathname: string;
}) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2.5 px-4 pb-3.5 hf-subpage-top">
      <button
        type="button"
        onClick={() => navigateBack(router, { pathname, fallbackHref: backHref })}
        className="flex min-w-0 items-center gap-2.5 text-[15px] font-bold text-[#15201D]"
      >
        <span className="text-[22px] font-normal leading-none text-[#6E7671]">‹</span>
        커뮤니티
      </button>
    </div>
  );
}
