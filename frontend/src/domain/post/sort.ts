/** 커뮤니티 게시글 목록 정렬 */
export type PostSortOption = 'latest' | 'popular' | 'comments';

/** 인기·댓글 정렬 기간 — 기본은 이번 주(7일) */
export type PostListPeriod = 'week' | 'all';

export function postSortToQuery(sort: PostSortOption): string {
  switch (sort) {
    case 'popular':
      return 'engagementScore,desc';
    case 'comments':
      return 'commentCount,desc';
    default:
      return 'createdAt,desc';
  }
}

export function needsPostListPeriod(sort: PostSortOption): boolean {
  return sort === 'popular' || sort === 'comments';
}

export function postListPeriodQuery(sort: PostSortOption, period: PostListPeriod): PostListPeriod | undefined {
  return needsPostListPeriod(sort) ? period : undefined;
}

export function postListPeriodHint(sort: PostSortOption, period: PostListPeriod): string | null {
  if (!needsPostListPeriod(sort)) return null;
  if (sort === 'popular') {
    return period === 'week'
      ? '이번 주 · 공감·댓글·조회·최근성 종합'
      : '전체 · 공감·댓글·조회·최근성 종합';
  }
  return period === 'week' ? '이번 주 댓글 많은 순' : '전체 기간 댓글순';
}
