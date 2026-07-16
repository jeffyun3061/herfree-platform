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

export const COMMENT_MAX_LENGTH = 2000;

export function validateCommentInput(content: string): string | null {
  if (!content.trim()) return '댓글 내용을 입력해 주세요.';
  if (content.length > COMMENT_MAX_LENGTH) return `댓글은 ${COMMENT_MAX_LENGTH}자 이하로 입력해 주세요.`;
  return null;
}

export function displayAuthorNickname(authorNickname: string): string {
  return authorNickname;
}

export type CommentTreeNode = Comment & {
  replies: CommentTreeNode[];
};

export function buildCommentTree(comments: Comment[]): CommentTreeNode[] {
  const nodeMap = new Map<number, CommentTreeNode>();
  const roots: CommentTreeNode[] = [];

  for (const comment of comments) {
    nodeMap.set(comment.id, { ...comment, replies: [] });
  }

  for (const comment of comments) {
    const node = nodeMap.get(comment.id)!;
    if (comment.parentId != null) {
      const parent = nodeMap.get(comment.parentId);
      if (parent) {
        parent.replies.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  return roots;
}
