export type PendingPostDetailConfirmation =
  | { type: 'delete-post' }
  | { type: 'delete-comment'; commentId: number }
  | { type: 'hide-post' }
  | { type: 'hide-comment'; commentId: number };

export function getPostDetailConfirmationCopy(
  pendingConfirm: PendingPostDetailConfirmation | null,
) {
  const isHideAction =
    pendingConfirm?.type === 'hide-post' || pendingConfirm?.type === 'hide-comment';

  return {
    title:
      pendingConfirm?.type === 'delete-post'
        ? '글 삭제'
        : pendingConfirm?.type === 'hide-post'
          ? '글 숨김 처리'
          : pendingConfirm?.type === 'hide-comment'
            ? '댓글 숨김 처리'
            : '댓글 삭제',
    message:
      pendingConfirm?.type === 'delete-post'
        ? '이 글을 삭제할까요? 삭제 후에는 복구할 수 없습니다.'
        : pendingConfirm?.type === 'hide-post'
          ? '이 글을 숨김 처리할까요? 운영 관리에서 복구할 수 있습니다.'
          : pendingConfirm?.type === 'hide-comment'
            ? '이 댓글을 숨김 처리할까요? 운영 관리에서 복구할 수 있습니다.'
            : '이 댓글을 삭제할까요?',
    confirmLabel: isHideAction ? '숨김 처리' : '삭제',
    variant: isHideAction ? ('default' as const) : ('danger' as const),
  };
}
