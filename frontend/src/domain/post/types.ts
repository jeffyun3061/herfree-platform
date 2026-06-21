export type PostVisibility = 'PUBLIC' | 'MEMBERS_ONLY';

// 게시글 목록 항목 (PostResponse) — 익명 글 닉네임은 서버가 "익명" / "익명(나)"로 내려준다
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
  isMyPost: boolean;
  readable: boolean;
  staffReplied: boolean;
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
  imageUrl: string | null;
  staffReplied: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PostCreateInput = {
  boardId: number;
  title: string;
  content: string;
  isAnonymous: boolean;
  imageUrl?: string | null;
};

export type PostUpdateInput = {
  title: string;
  content: string;
  isAnonymous: boolean;
  imageUrl?: string | null;
};

export type PostImageUploadUrlInput = {
  contentType: string;
  contentLength: number;
};

export type PostImageUploadUrlResponse = {
  uploadUrl: string;
  imageUrl: string;
};

export type PostImageUploadResponse = {
  imageUrl: string;
};

export const POST_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const POST_IMAGE_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export function resolvePostImageContentType(file: File): string | null {
  if (POST_IMAGE_ALLOWED_TYPES.includes(file.type as (typeof POST_IMAGE_ALLOWED_TYPES)[number])) {
    return file.type;
  }

  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) return 'image/jpeg';
  if (lowerName.endsWith('.png')) return 'image/png';
  if (lowerName.endsWith('.webp')) return 'image/webp';
  return null;
}

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

/** 글 등록 시 이미지 URL — 비어 있으면 필드 자체를 보내지 않음 (선택 첨부) */
export function pickPostImageUrlForCreate(imageUrl: string | null | undefined): string | undefined {
  const trimmed = imageUrl?.trim();
  return trimmed ? trimmed : undefined;
}

export function displayAuthorNickname(authorNickname: string): string {
  return authorNickname;
}
