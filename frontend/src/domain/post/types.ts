export type PostVisibility = 'PUBLIC' | 'MEMBERS_ONLY';

// 게시글 목록 항목 (PostResponse) — 익명 글은 서버가 authorNickname을 "익명"으로 내려준다
export type Post = {
  id: number;
  boardId: number;
  boardName: string;
  boardType: string;
  title: string;
  contentPreview: string;
  authorNickname: string;
  viewCount: number;
  createdAt: string;
};

// 게시글 상세 (PostDetailResponse) — isMyPost로 수정·삭제 버튼 노출을 결정한다
export type PostDetail = {
  id: number;
  boardId: number;
  boardName: string;
  title: string;
  content: string;
  authorNickname: string;
  viewCount: number;
  visibility: PostVisibility;
  isAnonymous: boolean;
  isMyPost: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PostCreateInput = {
  boardId: number;
  title: string;
  content: string;
  isAnonymous: boolean;
};

export type PostUpdateInput = {
  title: string;
  content: string;
  isAnonymous: boolean;
};

// 백엔드 PostCreateRequest의 @Size(max = 200)과 동일 기준
export const POST_TITLE_MAX_LENGTH = 200;

export function validatePostInput(input: { title: string; content: string }): string | null {
  if (!input.title.trim()) return '제목을 입력해 주세요.';
  if (input.title.length > POST_TITLE_MAX_LENGTH) {
    return `제목은 ${POST_TITLE_MAX_LENGTH}자를 초과할 수 없습니다.`;
  }
  if (!input.content.trim()) return '내용을 입력해 주세요.';
  return null;
}
