// 댓글 응답 (CommentResponse)
export type Comment = {
  id: number;
  postId: number;
  authorNickname: string;
  content: string;
  isAnonymous: boolean;
  parentId: number | null;
  isMyComment: boolean;
  createdAt: string;
};

export type CommentCreateInput = {
  content: string;
  isAnonymous: boolean;
  parentId?: number | null;
};

export function validateCommentInput(content: string): string | null {
  if (!content.trim()) return '댓글 내용을 입력해 주세요.';
  return null;
}

export function displayAuthorNickname(
  authorNickname: string,
  isAnonymous: boolean,
  isMine: boolean,
): string {
  if (isAnonymous && !isMine) return '익명';
  return authorNickname;
}
