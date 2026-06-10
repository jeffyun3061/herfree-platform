// 날짜·숫자 표시 규칙을 한곳에 모은 순수 함수 모음

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

// 커뮤니티 목록에서는 절대 시각보다 상대 시각이 읽기 편하다
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

export function formatPrice(price: number | null): string {
  if (price == null) return '가격 정보 없음';
  return `${price.toLocaleString('ko-KR')}원`;
}
