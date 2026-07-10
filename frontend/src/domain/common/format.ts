// 날짜·숫자 표시 규칙을 한곳에 모은 순수 함수 모음
// API createdAt 등은 UTC ISO 문자열(…Z) — new Date()가 브라우저 로컬(KST)로 변환한다

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

// 커뮤니티 목록에서는 절대 시각보다 상대 시각이 읽기 편하다
export function formatTimeClock(isoString: string): string {
  const date = new Date(isoString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}일 전`;

  return formatDate(isoString);
}

/** 영상·칼럼 목록용 — 주·개월 단위 상대 시각 */
export function formatRelativeTimeMedia(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return '오늘';
  if (diffDays < 7) return `${diffDays}일 전`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks}주 전`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}개월 전`;

  return formatDate(isoString);
}

export function formatPrice(price: number | null): string {
  if (price == null) return '가격 정보 없음';
  return `${price.toLocaleString('ko-KR')}원`;
}

export function formatMemberDays(isoString: string | null | undefined): string {
  if (!isoString) return '헤르프리 회원';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const days = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  return `가입 ${days}일째`;
}
