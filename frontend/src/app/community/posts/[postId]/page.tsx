'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePostDetail, usePostMutation } from '@/hooks/usePosts';
import { useComments } from '@/hooks/useComments';
import { useAuth } from '@/hooks/useAuth';
import { TopBar } from '@/components/layout/TopBar';
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
import { displayAuthorNickname } from '@/domain/post/types';
import { getErrorMessage } from '@/lib/api/client';

type PendingConfirm =
  | { type: 'delete-post' }
  | { type: 'delete-comment'; commentId: number };

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = Number(params.postId);
  const { isLoggedIn } = useAuth();
  const { post, isLoading, error } = usePostDetail(postId);
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
  } = useComments(postId);

  const [commentText, setCommentText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [replyParentId, setReplyParentId] = useState<number | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportCommentId, setReportCommentId] = useState<number | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const loginHref = `/login?from=${encodeURIComponent(`/community/posts/${postId}`)}`;

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
    }
  };

  const handleConfirm = async () => {
    if (!pendingConfirm) return;
    setIsConfirming(true);
    try {
      if (pendingConfirm.type === 'delete-post') {
        const ok = await deletePost(postId);
        if (ok) router.replace(`/community/${post?.boardId}`);
      } else {
        await removeComment(pendingConfirm.commentId);
      }
      setPendingConfirm(null);
    } finally {
      setIsConfirming(false);
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
    pendingConfirm?.type === 'delete-post' ? '글 삭제' : '댓글 삭제';
  const confirmMessage =
    pendingConfirm?.type === 'delete-post'
      ? '이 글을 삭제할까요? 삭제 후에는 복구할 수 없습니다.'
      : '이 댓글을 삭제할까요?';

  const commentTree = buildCommentTree(commentPage.content);

  return (
    <>
      <TopBar
        title={post.boardName}
        showBack
        backHref={`/community/${post.boardId}`}
        rightSlot={
          <div className="flex gap-2">
            {isLoggedIn && (
              <Button variant="ghost" size="sm" onClick={() => setReportOpen(true)}>
                신고
              </Button>
            )}
            {post.isMyPost && (
              <>
                <Link href={`/community/write?postId=${post.id}`}>
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
        <h1 className="text-lg font-semibold text-cream-foreground">{post.title}</h1>
        <div className="mt-2 flex gap-2 text-xs text-muted">
          <span>{displayAuthorNickname(post.authorNickname)}</span>
          <span>· 조회 {post.viewCount}</span>
        </div>
        <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-cream-foreground">
          {post.content}
        </p>

        <div className="mt-6 border-t border-border pt-5">
          <ReactionBar targetType="POST" targetId={post.id} />
        </div>

        <section className="mt-8">
          <h2 className="mb-4 font-medium text-cream-foreground">
            댓글 {commentPage.totalElements}
          </h2>
          {commentsLoading ? (
            <LoadingSpinner label="댓글 불러오는 중…" />
          ) : (
            <>
              {commentTree.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  isLoggedIn={isLoggedIn}
                  onDelete={(commentId) =>
                    setPendingConfirm({ type: 'delete-comment', commentId })
                  }
                  onReport={(commentId) => setReportCommentId(commentId)}
                  onReply={(commentId) => {
                    setReplyParentId(commentId);
                    setCommentText('');
                  }}
                />
              ))}
              <Pagination page={page} totalPages={commentPage.totalPages} onPageChange={setPage} />
            </>
          )}

          {isLoggedIn ? (
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
                placeholder="댓글을 남겨 주세요."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <label className="flex items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                />
                익명으로 작성
              </label>
              {commentError && <ErrorMessage message={commentError} />}
              {mutationError && <ErrorMessage message={mutationError} />}
              <Button disabled={isSubmitting} onClick={() => void handleComment()}>
                {isSubmitting ? '등록 중…' : replyParentId ? '답글 등록' : '댓글 등록'}
              </Button>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-5 text-center">
              <p className="text-sm text-muted">댓글을 남기려면 로그인이 필요합니다.</p>
              <Link href={loginHref} className="mt-3 inline-block">
                <Button size="sm">로그인하기</Button>
              </Link>
            </div>
          )}
        </section>
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
        confirmLabel="삭제"
        variant="danger"
        isLoading={isConfirming || isDeletingPost}
        onConfirm={() => void handleConfirm()}
        onClose={() => setPendingConfirm(null)}
      />
    </>
  );
}
