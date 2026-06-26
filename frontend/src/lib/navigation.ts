export const NAV_ITEMS = [
  { href: '/', label: '홈' },
  { href: '/community', label: '커뮤니티' },
  { href: '/journal', label: '개인일지' },
  { href: '__question__', label: 'Q&A' },
  { href: '/mypage', label: '마이페이지' },
] as const;

export const DESKTOP_NAV_ITEMS = [
  { href: '/', label: '홈' },
  { href: '/community', label: '커뮤니티' },
  { href: '/contents', label: '칼럼' },
  { href: '/journal', label: '개인일지' },
  { href: '/videos', label: '영상' },
] as const;

export const HIDE_NAV_PATHS = [
  '/login',
  '/signup',
  '/admin',
  '/consult',
  '/consult/write',
] as const;

export const HIDE_SHELL_HEADER_PATHS = [
  '/login',
  '/signup',
  '/admin',
  '/qna',
  '/community/write',
  '/inquiry/write',
  '/consult',
  '/consult/write',
  '/forgot-password',
] as const;

export function shouldShowBottomNav(pathname: string): boolean {
  if (HIDE_NAV_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return false;
  }
  return true;
}

export function shouldShowShellHeader(pathname: string): boolean {
  if (HIDE_SHELL_HEADER_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return false;
  }
  return true;
}

const MOBILE_TAB_ROOT_TITLES: Record<string, string> = {
  '/contents': '칼럼',
  '/videos': '영상',
  '/mypage': '마이페이지',
  '/journal': '개인일지',
  '/community': '커뮤니티',
  '/inquiry': '운영 문의',
  '/inquiry/write': '문의하기',
  '/qna': '자주 묻는 질문',
  '/consult': '1:1 비밀 상담',
  '/consult/write': '상담 글쓰기',
};

export function getMobileTabRootTitle(pathname: string): string | null {
  if (pathname === '/community' || pathname.startsWith('/community/')) {
    if (
      pathname.startsWith('/community/posts/') ||
      pathname.startsWith('/community/write')
    ) {
      return null;
    }
    return null;
  }
  return MOBILE_TAB_ROOT_TITLES[pathname] ?? null;
}
