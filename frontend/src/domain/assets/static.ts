/**
 * `public/` 정적 에셋 URL 단일 관리
 *
 * 규칙:
 * - 컴포넌트·페이지에서 `/images/...` `/icons/...` 문자열 직접 사용 금지
 * - 신규 파일은 `frontend/public/` 아래에 두고 이 파일에 상수 추가
 *
 * 디렉터리:
 * - public/brand/              로고 PNG
 * - public/fonts/suit/         SUIT woff2 (로드: src/styles/fonts/suit.css)
 * - public/images/             홈·대시보드 배경
 * - public/icons/journal/record/  일지 PNG 아이콘
 * - public/icons/journal/      일지 SVG (clipboard 등)
 */

function publicPath(segment: string): `/${string}` {
  return `/${segment.replace(/^\/+/, '')}` as `/${string}`;
}

/** @internal 다른 domain/assets 모듈에서 경로 생성 시 사용 */
export function buildPublicPath(segment: string): `/${string}` {
  return publicPath(segment);
}

/** 배경·일러스트 이미지 */
export const PUBLIC_IMAGES = {
  homeHero: publicPath('images/main.png'),
  journalDashboardHero: publicPath('images/dashboard/hero-landscape.png'),
} as const;

/** 일지 UI 아이콘 (PNG 우선) */
export const JOURNAL_ICONS = {
  pencil: publicPath('icons/journal/record/pencil.png'),
  moon: publicPath('icons/journal/record/moon.png'),
  pill: publicPath('icons/journal/record/pill.png'),
  brain: publicPath('icons/journal/record/brain.png'),
  speech: publicPath('icons/journal/record/speech.png'),
  link: publicPath('icons/journal/record/link.png'),
  clipboard: publicPath('icons/journal/clipboard.svg'),
} as const;

export type JournalIconName = keyof typeof JOURNAL_ICONS;

/** 루틴 행 → 아이콘 키 (UI 매핑 단일화) */
export const JOURNAL_ROUTINE_ICON: Record<'sleep' | 'supplement' | 'condition', JournalIconName> = {
  sleep: 'moon',
  supplement: 'pill',
  condition: 'brain',
};

export function getJournalIconSrc(name: JournalIconName): (typeof JOURNAL_ICONS)[JournalIconName] {
  return JOURNAL_ICONS[name];
}

/** @deprecated JOURNAL_ICONS 직접 사용 권장 */
export const JOURNAL_DASHBOARD_HERO_IMAGE = PUBLIC_IMAGES.journalDashboardHero;
