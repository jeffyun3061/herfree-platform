import { buildPublicPath } from '@/domain/assets/static';

/** 정적 로고 — `public/brand/` */
export const BRAND_LOGO = {
  hfreeOnPrimary: buildPublicPath('assets/logo-h-cream.png'),
  hfreeOnDark: buildPublicPath('assets/logo-h-app.png'),
  hMarkOnPrimary: buildPublicPath('assets/logo-h-mark.png'),
  hMarkOnDark: buildPublicPath('assets/logo-h-circle.png'),
} as const;
