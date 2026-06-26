// 정보글 작성 주체 (ContentType enum)
export type ContentAuthorType = 'CREATOR' | 'DOCTOR' | 'ADMIN';

export type ContentStatus = 'ACTIVE' | 'HIDDEN' | 'DELETED';

// 정보글 응답 (ContentResponse) — category는 서버에서 자유 문자열로 관리된다
export type Content = {
  id: number;
  authorId: number;
  title: string;
  content: string;
  category: string;
  contentType: string;
  status?: ContentStatus;
  sortOrder?: number;
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
};

// 루틴 페이지에서 생활관리 카테고리만 필터링할 때 사용하는 기준 값
export const LIFESTYLE_CATEGORY = '생활관리';

// 프론트 필터 칩에 노출하는 카테고리 목록 — 관리자 등록 카테고리와 합의된 값
export const CONTENT_CATEGORIES: string[] = ['의학정보', '생활관리', '영양관리', '심리케어'];

export const CONTENT_TYPE_LABELS: Record<string, string> = {
  CREATOR: '크리에이터',
  DOCTOR: '전문가',
  ADMIN: '운영팀',
};

/** 관리자 등록 시 선택 가능한 작성 주체 */
export const CONTENT_AUTHOR_TYPE_OPTIONS: { value: ContentAuthorType; label: string }[] = [
  { value: 'ADMIN', label: '운영팀' },
  { value: 'DOCTOR', label: '전문가' },
];

export function getContentTypeLabel(contentType: string): string {
  return CONTENT_TYPE_LABELS[contentType] ?? contentType;
}

// 본문 미리보기 — 목록 카드에서 장문 노출을 막는다
export function getContentPreview(content: string, maxLength = 80): string {
  const plain = content.replace(/\s+/g, ' ').trim();
  return plain.length > maxLength ? `${plain.slice(0, maxLength)}…` : plain;
}

/** 칼럼 카드 — 분량 기준 예상 읽기 시간 (한글 400자/분) */
export function estimateReadMinutes(content: string): number {
  const length = content.replace(/\s+/g, '').length;
  return Math.max(1, Math.min(30, Math.round(length / 400) || 1));
}

export const CONTENT_THUMB_GRADIENTS = [
  'bg-[#04342C]',
  'bg-[#0B3B36]',
  'bg-[#1D9E75]',
  'bg-[#3C443E]',
  'bg-[#0F6E56]',
] as const;
