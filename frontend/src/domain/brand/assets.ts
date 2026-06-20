import { buildPublicPath } from '@/domain/assets/static';

/** 정적 로고 — `public/brand/` */
export const BRAND_LOGO = {
  hfreeOnPrimary: buildPublicPath('brand/logo-hfree-on-primary.png'),
  hfreeOnDark: buildPublicPath('brand/logo-hfree-on-dark.png'),
  hMarkOnPrimary: buildPublicPath('brand/logo-h-mark-on-primary.png'),
  hMarkOnDark: buildPublicPath('brand/logo-h-mark-on-dark.png'),
} as const;
