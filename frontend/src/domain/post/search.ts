/** 커뮤니티 게시글 검색 — MySQL FULLTEXT ngram, 최소 2글자 */
export const POST_SEARCH_MIN_LENGTH = 2;

export function validatePostSearchKeyword(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length < POST_SEARCH_MIN_LENGTH) {
    return '두 글자 이상 입력해 주세요';
  }
  return null;
}
