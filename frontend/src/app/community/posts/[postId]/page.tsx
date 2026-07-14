'use client';

import { useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { usePostDetail, usePostMutation } from '@/hooks/usePosts';
import { useComments } from '@/hooks/useComments';
import { useAuth } from '@/hooks/useAuth';
import { useBoards } from '@/hooks/useBoards';
import { CommunityGuestPostPanel } from '@/components/community/CommunityGuestPostPanel';
import { ReactionBar } from '@/components/community/ReactionBar';
import { CommentItem } from '@/components/community/CommentItem';
import { ReportModal } from '@/components/community/ReportModal';
import { Pagination } from '@/components/common/Pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { buildCommentTree, validateCommentInput } from '@/domain/comment/types';
import { isStaffOnlyBoardType, getBoardTagClass } from '@/domain/board/types';
import {
  getCommunityBoardTabLabel,
  getMaskedBoardBackHref,
  getPrivatePostWriteHref,
  isMaskedBoardType,
} from '@/domain/board/privateBoard';
import { formatRelativeTime } from '@/domain/common/format';
import { formatAuthorIpLabel } from '@/domain/post/ipDisplay';
import { displayAuthorNickname } from '@/domain/post/types';
import { isAdmin, isStaff } from '@/domain/user/types';
import { getErrorMessage } from '@/lib/api/client';
import { navigateBack } from '@/lib/navigateBack';
import { cn } from '@/lib/cn';
import * as adminApi from '@/lib/api/admin';

type PendingConfirm =
  | { type: 'delete-post' }
  | { type: 'delete-comment'; commentId: number }
  | { type: 'hide-post' }
  | { type: 'hide-comment'; commentId: number };

function PostDetailBackHeader({
  backHref,
  pathname,
}: {
  backHref: string;
  pathname: string;
}) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2.5 px-4 pb-3.5 pt-[54px]">
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

function CommentSendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M22 2L11 13" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 2L15 22l-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function normalizeBoardTagLabel(boardType: string | undefined, boardName: string) {
  const tabLabel = boardType ? getCommunityBoardTabLabel(boardType) : undefined;
  return (tabLabel ?? boardName).replace(/게시판|방/g, '').trim() || boardName;
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const postId = Number(params.postId);
  const { isLoggedIn, isReady, user } = useAuth();
  const { boards } = useBoards();
  const { post, isLoading, error, refetch: refetchPost } = usePostDetail(postId);
  const { deletePost, isSubmitting: isDeletingPost } = usePostMutation();
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

  const [commentText, setCommentText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [replyParentId, setReplyParentId] = useState<number | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportCommentId, setReportCommentId] = useState<number | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const loginHref = `/login?from=${encodeURIComponent(`/community/posts/${postId}`)}`;
  const staffUser = isStaff(user?.role);

  const handleComment = async () => {
    const validation = validateCommentInput(commentText);
    if (validation) {
      setCommentError(validation);
      return;
    }
    setCommentError(null);
    const ok = await addComment({
      content: commentText,
      isAnonymous,
      parentId: replyParentId,
    });
    if (ok) {
      setCommentText('');
      setReplyParentId(null);
      await refetchPost();
    }
  };

  const handleConfirm = async () => {
    if (!pendingConfirm) return;
    setIsConfirming(true);
    try {
      if (pendingConfirm.type === 'delete-post') {
        const ok = await deletePost(postId);
        if (ok) {
          const board = boards.find((item) => item.id === post?.boardId);
          const href = board
            ? getMaskedBoardBackHref(board.boardType, board.id)
            : '/community';
          router.replace(href);
        }
      } else if (pendingConfirm.type === 'delete-comment') {
        await removeComment(pendingConfirm.commentId);
      } else if (pendingConfirm.type === 'hide-post') {
        setIsHiding(true);
        await adminApi.hidePost(postId);
        const board = boards.find((item) => item.id === post?.boardId);
        const href = board
          ? getMaskedBoardBackHref(board.boardType, board.id)
          : '/community';
        router.replace(href);
      } else if (pendingConfirm.type === 'hide-comment') {
        setIsHiding(true);
        await adminApi.hideComment(pendingConfirm.commentId);
        await refetchComments();
      }
      setPendingConfirm(null);
    } catch (err) {
      setCommentError(getErrorMessage(err));
    } finally {
      setIsConfirming(false);
      setIsHiding(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyMessage('글 링크를 복사했어요.');
    } catch {
      setCopyMessage('링크 복사를 지원하지 않는 환경이에요.');
    }
    window.setTimeout(() => setCopyMessage(null), 2200);
  };

  if (!isReady) {
    return (
      <div className="mx-auto max-w-app px-5 py-12">
        <LoadingSpinner label="글을 준비하는 중..." />
      </div>
    );
  }
  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-app pb-20">
        <PostDetailBackHeader backHref="/community" pathname={pathname} />
        <div className="px-5">
          <CommunityGuestPostPanel loginFrom={encodeURIComponent(`/community/posts/${postId}`)} />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-app px-5 py-12">
        <LoadingSpinner label="게시글을 불러오는 중..." />
      </div>
    );
  }
  if (error || !post) {
    return (
      <div className="mx-auto max-w-app px-5 py-10">
        <ErrorMessage message={error ? getErrorMessage(error) : '글을 찾을 수 없습니다.'} />
      </div>
    );
  }

  const confirmTitle =
    pendingConfirm?.type === 'delete-post'
      ? '글 삭제'
      : pendingConfirm?.type === 'hide-post'
        ? '글 숨김 처리'
        : pendingConfirm?.type === 'hide-comment'
          ? '댓글 숨김 처리'
          : '댓글 삭제';
  const confirmMessage =
    pendingConfirm?.type === 'delete-post'
      ? '이 글을 삭제할까요? 삭제 후에는 복구할 수 없습니다.'
      : pendingConfirm?.type === 'hide-post'
        ? '이 글을 숨김 처리할까요? 운영 관리에서 복구할 수 있습니다.'
        : pendingConfirm?.type === 'hide-comment'
          ? '이 댓글을 숨김 처리할까요? 운영 관리에서 복구할 수 있습니다.'
          : '이 댓글을 삭제할까요?';
  const confirmVariant =
    pendingConfirm?.type === 'hide-post' || pendingConfirm?.type === 'hide-comment'
      ? 'default'
      : 'danger';
  const confirmLabel =
    pendingConfirm?.type === 'hide-post' || pendingConfirm?.type === 'hide-comment'
      ? '숨김 처리'
      : '삭제';

  const commentTree = buildCommentTree(commentPage.content);
  const postBoard = boards.find((board) => board.id === post.boardId);
  const isStaffOnlyPost = postBoard != null && isStaffOnlyBoardType(postBoard.boardType);
  const isMaskedPost = postBoard != null && isMaskedBoardType(postBoard.boardType);
  const isContentMasked = post.readable === false;
  const backHref = postBoard
    ? getMaskedBoardBackHref(postBoard.boardType, postBoard.id)
    : `/community/${post.boardId}`;
  const showComments = (!isMaskedPost || post.isMyPost || staffUser) && !isContentMasked;
  const canWriteComments = isMaskedPost ? staffUser && isLoggedIn : isLoggedIn;
  const privateCommentHint = isMaskedPost && post.isMyPost && !staffUser;
  const boardTagLabel = normalizeBoardTagLabel(postBoard?.boardType, post.boardName);
  const boardTagClass = getBoardTagClass(postBoard?.boardType ?? 'FREE');

  return (
    <>
      <article className="mx-auto max-w-app pb-20 lg:pb-8">
        <div className="flex items-center justify-between gap-3 px-4 pb-3.5 pt-[54px]">
          <button
            type="button"
            onClick={() => navigateBack(router, { pathname, fallbackHref: backHref })}
            className="flex min-w-0 items-center gap-2.5 text-[15px] font-bold text-[#15201D]"
          >
            <span className="text-[22px] font-normal leading-none text-[#6E7671]">‹</span>
            커뮤니티
          </button>
          <button
            type="button"
            onClick={() => void handleCopyLink()}
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#65706B] shadow-[0_10px_22px_-18px_rgba(7,37,31,.45)] lg:flex"
            aria-label="글 링크 복사"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M10 13a5 5 0 0 0 7.1 0l2.8-2.8a5 5 0 0 0-7.1-7.1l-1.3 1.3" />
              <path d="M14 11a5 5 0 0 0-7.1 0l-2.8 2.8a5 5 0 0 0 7.1 7.1l1.3-1.3" />
            </svg>
          </button>
        </div>
        {copyMessage && (
          <p className="mx-5 mb-3 rounded-[13px] bg-[#0B3B36] px-4 py-2 text-[12px] font-bold text-white">
            {copyMessage}
          </p>
        )}
        <section className="px-5 pt-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('rounded-[7px] px-[9px] py-[3px] text-[10.5px] font-bold', boardTagClass)}>
              {boardTagLabel}
            </span>
            {isMaskedPost && (
              <span
                className={cn(
                  'inline-flex items-center rounded-[7px] px-2.5 py-1 text-[10.5px] font-bold',
                  post.staffReplied ? 'bg-primary/15 text-primary' : 'bg-[#F3ECDD] text-[#8A7964]',
                )}
              >
                {post.staffReplied ? '답변완료' : '답변 대기'}
              </span>
            )}
          </div>

          <h1 className="hf-display mb-3 mt-[13px] break-words text-[20px] font-extrabold leading-[1.45] tracking-[-0.01em] text-[#15201D]">
            {post.title}
          </h1>

          <div className="flex items-center gap-[9px] border-b border-[#EAE3D6] pb-4">
            <span
              className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#EDF2EC] text-[14px]"
              aria-hidden
            >
              🌿
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-semibold text-[#2C342E]">
                {displayAuthorNickname(post.authorNickname)}
              </p>
              <p className="mt-px text-[10.5px] text-[#A6ABA0]">
                {formatRelativeTime(post.createdAt)}
                {formatAuthorIpLabel(post.authorIpMasked)
                  ? ` · ${formatAuthorIpLabel(post.authorIpMasked)}`
                  : ''}
              </p>
            </div>
          </div>

          {post.imageUrl && (
            <div className="mt-[18px] overflow-hidden rounded-2xl border border-[#EAE3D6] bg-[#FFFCF7]">
              <img
                src={post.imageUrl}
                alt="게시글 첨부 이미지"
                className="max-h-[480px] w-full object-contain"
              />
            </div>
          )}
          <div
            className={cn(
              'pb-1 pt-[18px]',
              isContentMasked && 'rounded-[18px] bg-[#F8F4EC] px-4 py-4 text-center',
            )}
          >
            <p
              className={cn(
                'whitespace-pre-wrap break-words text-[13.5px] leading-[1.85]',
                isContentMasked ? 'text-[#7A847C]' : 'text-[#2C342E]',
              )}
            >
              {post.content}
            </p>
          </div>

          {!isMaskedPost && !isContentMasked && (
            <div className="mt-3.5">
              <ReactionBar
                variant="detail"
                targetType="POST"
                targetId={post.id}
                commentCount={commentPage.totalElements}
              />
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {isLoggedIn && !isMaskedPost && (
              <Button variant="ghost" size="sm" onClick={() => setReportOpen(true)}>
                신고
              </Button>
            )}
            {staffUser && isMaskedPost && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPendingConfirm({ type: 'hide-post' })}
              >
                숨김 처리
              </Button>
            )}
            {staffUser && !isStaffOnlyPost && !isMaskedPost && (
              <>
                <Link href={`/community/write?postId=${post.id}&admin=1`}>
                  <Button variant="secondary" size="sm">
                    수정
                  </Button>
                </Link>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPendingConfirm({ type: 'hide-post' })}
                >
                  숨김 처리
                </Button>
              </>
            )}
            {post.isMyPost && isStaffOnlyPost && isAdmin(user?.role) && (
              <Link href="/admin?tab=notices">
                <Button variant="secondary" size="sm">
                  공지 관리
                </Button>
              </Link>
            )}
            {post.isMyPost && !isStaffOnlyPost && post.readable !== false && (
              <>
                <Link
                  href={
                    postBoard && getPrivatePostWriteHref(postBoard.boardType, post.id)
                      ? getPrivatePostWriteHref(postBoard.boardType, post.id)!
                      : `/community/write?postId=${post.id}`
                  }
                >
                  <Button variant="secondary" size="sm">
                    수정
                  </Button>
                </Link>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setPendingConfirm({ type: 'delete-post' })}
                >
                  삭제
                </Button>
              </>
            )}
          </div>
        </section>

        {showComments && (
        <section className="px-5 pt-[18px]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-[13px] font-bold text-[#15201D]">
              {isMaskedPost ? '운영자 답변' : '댓글'}
              {isMaskedPost ? ` ${commentPage.totalElements}` : ''}
            </h2>
            {commentPage.totalPages > 1 && (
              <span className="text-[11px] font-medium text-[#A6ABA0]">
                {page + 1}/{commentPage.totalPages}페이지
              </span>
            )}
          </div>
          {privateCommentHint && (
            <p className="mb-4 text-xs leading-relaxed text-muted">
              운영자 답변이 등록되면 여기에 표시됩니다. 답글은 운영자만 작성할 수 있습니다.
            </p>
          )}
          {commentsLoading ? (
            <LoadingSpinner label="댓글 불러오는 중…" />
          ) : commentTree.length > 0 ? (
            <>
              {commentTree.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  isLoggedIn={isLoggedIn}
                  isStaff={staffUser && (!isStaffOnlyPost || isMaskedPost)}
                  onDelete={(commentId) =>
                    setPendingConfirm({ type: 'delete-comment', commentId })
                  }
                  onHide={(commentId) =>
                    setPendingConfirm({ type: 'hide-comment', commentId })
                  }
                  onReport={(commentId) => setReportCommentId(commentId)}
                  onReply={
                    canWriteComments
                      ? (commentId) => {
                          setReplyParentId(commentId);
                          setCommentText('');
                        }
                      : undefined
                  }
                />
              ))}
              <Pagination page={page} totalPages={commentPage.totalPages} onPageChange={setPage} />
            </>
          ) : (
            <div className="rounded-[16px] border border-[#E7DFD2] bg-[#FBF6EA] px-4 py-6 text-center">
              <p className="text-[13px] font-bold text-[#1E2621]">
                {isMaskedPost ? '아직 운영자 답변이 없어요' : '아직 댓글이 없어요'}
              </p>
              <p className="mt-1 text-[12px] text-[#7A847C]">
                {isMaskedPost ? '답변이 등록되면 이곳에 표시됩니다.' : '첫 댓글로 따뜻한 마음을 남겨보세요.'}
              </p>
            </div>
          )}

          {canWriteComments ? (
            <div className="mt-[18px] flex items-center gap-2">
              {replyParentId !== null && (
                <p className="sr-only">
                  답글 작성 중 ·{' '}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => setReplyParentId(null)}
                  >
                    취소
                  </button>
                </p>
              )}
              <Textarea
                placeholder={
                  isMaskedPost ? '운영자 답변을 작성해 주세요.' : '따뜻한 댓글을 남겨주세요'
                }
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[42px] flex-1 rounded-[12px] border-[#ECE5D8] bg-[#F8F4EC] px-3.5 py-3 text-[12.5px] placeholder:text-[#B4B2A6]"
              />
              <Button
                disabled={isSubmitting}
                onClick={() => void handleComment()}
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[12px] px-0"
                aria-label={replyParentId ? '답글 등록' : isMaskedPost ? '답변 등록' : '댓글 등록'}
              >
                <CommentSendIcon />
              </Button>
            </div>
          ) : !isLoggedIn ? (
            <div className="mt-5 rounded-xl border border-dashed border-[#ECE5D8] bg-[#F8F4EC] p-5 text-center">
              <p className="text-sm text-muted">댓글을 남기려면 로그인이 필요합니다.</p>
              <Link href={loginHref} className="mt-3 inline-block">
                <Button size="sm">로그인하기</Button>
              </Link>
            </div>
          ) : null}
          {!isMaskedPost && canWriteComments && (
            <label className="mt-3 flex items-center gap-2 text-[12px] text-muted">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              익명으로 작성
            </label>
          )}
          {commentError && <div className="mt-3"><ErrorMessage message={commentError} /></div>}
          {mutationError && <div className="mt-3"><ErrorMessage message={mutationError} /></div>}
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
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel={confirmLabel}
        variant={confirmVariant}
        isLoading={isConfirming || isDeletingPost || isHiding}
        onConfirm={() => void handleConfirm()}
        onClose={() => setPendingConfirm(null)}
      />
    </>
  );
}
