'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePostDetail, usePostMutation } from '@/hooks/usePosts';
import { useComments } from '@/hooks/useComments';
import { useAuth } from '@/hooks/useAuth';
import { useBoards } from '@/hooks/useBoards';
import { PageHeader } from '@/components/layout/PageHeader';
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
import { isStaffOnlyBoardType } from '@/domain/board/types';
import {
  getMaskedBoardBackHref,
  getPrivatePostWriteHref,
  getPrivateBoardMetaByType,
  isMaskedBoardType,
  isSecretStoryBoardType,
  SECRET_STORY_BOARD_COPY,
} from '@/domain/board/privateBoard';
import { displayAuthorNickname } from '@/domain/post/types';
import { isAdmin, isStaff } from '@/domain/user/types';
import { getErrorMessage } from '@/lib/api/client';
import { cn } from '@/lib/cn';
import * as adminApi from '@/lib/api/admin';

type PendingConfirm =
  | { type: 'delete-post' }
  | { type: 'delete-comment'; commentId: number }
  | { type: 'hide-post' }
  | { type: 'hide-comment'; commentId: number };

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = Number(params.postId);
  const { isLoggedIn, user } = useAuth();
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

  if (isLoading) return <LoadingSpinner />;
  if (error || !post) {
    return (
      <div className="px-4 py-6">
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
  const isSecretStory = postBoard != null && isSecretStoryBoardType(postBoard.boardType);
  const isContentMasked = post.readable === false;
  const backHref = postBoard
    ? getMaskedBoardBackHref(postBoard.boardType, postBoard.id)
    : `/community/${post.boardId}`;
  const showComments = (!isMaskedPost || post.isMyPost || staffUser) && !isContentMasked;
  const canWriteComments = isMaskedPost ? staffUser && isLoggedIn : isLoggedIn;
  const privateCommentHint = isMaskedPost && post.isMyPost && !staffUser;

  return (
    <>
      <PageHeader
        title={post.boardName}
        showBack
        backHref={backHref}
        rightSlot={
          <div className="flex gap-2">
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
        }
      />
      <article className="px-4 py-5">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold text-cream-foreground">{post.title}</h1>
          {isMaskedPost && (
            <span
              className={`inline-flex items-center rounded-pill px-2.5 py-0.5 text-[11px] font-medium ${
                post.staffReplied
                  ? 'bg-primary/15 text-primary'
                  : 'bg-canvas-dark text-muted'
              }`}
            >
              {post.staffReplied ? '답변완료' : '답변 대기'}
            </span>
          )}
        </div>
        <div className="mt-2 flex gap-2 text-xs text-muted">
          <span>{displayAuthorNickname(post.authorNickname)}</span>
          <span>· 조회 {post.viewCount}</span>
        </div>
        {post.imageUrl && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-border/80 bg-card">
            <img
              src={post.imageUrl}
              alt="게시글 첨부 이미지"
              className="max-h-[480px] w-full object-contain"
            />
          </div>
        )}
        <p
          className={cn(
            'mt-5 whitespace-pre-wrap text-sm leading-relaxed',
            isContentMasked ? 'text-center text-muted' : 'text-cream-foreground',
          )}
        >
          {post.content}
        </p>

        {!isMaskedPost && !isContentMasked && (
          <div className="mt-6 border-t border-border pt-5">
            <ReactionBar targetType="POST" targetId={post.id} />
          </div>
        )}

        {showComments && (
        <section className="mt-8">
          <h2 className="mb-4 font-medium text-cream-foreground">
            {isMaskedPost ? '운영자 답변' : '댓글'} {commentPage.totalElements}
          </h2>
          {privateCommentHint && (
            <p className="mb-4 text-xs leading-relaxed text-muted">
              운영자 답변이 등록되면 여기에 표시됩니다. 답글은 운영자만 작성할 수 있습니다.
            </p>
          )}
          {commentsLoading ? (
            <LoadingSpinner label="댓글 불러오는 중…" />
          ) : (
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
          )}

          {canWriteComments ? (
            <div className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-4">
              {replyParentId !== null && (
                <p className="text-xs text-primary">
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
                placeholder={isMaskedPost ? '운영자 답변을 작성해 주세요.' : '댓글을 남겨 주세요.'}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              {!isMaskedPost && (
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                  />
                  익명으로 작성
                </label>
              )}
              {commentError && <ErrorMessage message={commentError} />}
              {mutationError && <ErrorMessage message={mutationError} />}
              <Button disabled={isSubmitting} onClick={() => void handleComment()}>
                {isSubmitting ? '등록 중…' : replyParentId ? '답글 등록' : isMaskedPost ? '답변 등록' : '댓글 등록'}
              </Button>
            </div>
          ) : !isLoggedIn ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-5 text-center">
              <p className="text-sm text-muted">댓글을 남기려면 로그인이 필요합니다.</p>
              <Link href={loginHref} className="mt-3 inline-block">
                <Button size="sm">로그인하기</Button>
              </Link>
            </div>
          ) : null}
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
