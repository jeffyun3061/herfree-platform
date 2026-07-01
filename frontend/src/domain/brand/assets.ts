import { buildPublicPath } from '@/domain/assets/static';

/**
 * `public/brand/` 로고 4종 (밝은 배경용 primary / 어두운 배경용 dark)
 *
 * | 파일 | 용도 |
 * |------|------|
 * | logo-hfree-wordmark.png   | h.free 워드마크 — 원형 없음 (로그인·회원가입) |
 * | logo-hfree-on-primary.png | h.free — cream·흰 배경 (원형) |
 * | logo-hfree-on-dark.png    | h.free — 어두운·검정 배경 |
 * | logo-h-mark-on-primary.png | h. — 흰·밝은 헤더·푸터 |
 * | logo-h-mark-on-dark.png   | h. — 어두운 헤더 |
 */
export const BRAND_LOGO = {
  /** h.free 워드마크 — 원형 없음 (로그인·회원가입) */
  hfreeWordmark: buildPublicPath('brand/logo-hfree-wordmark.png'),
  hfreeOnPrimary: buildPublicPath('brand/logo-hfree-on-primary.png'),
  hfreeOnDark: buildPublicPath('brand/logo-hfree-on-dark.png'),
  hMarkOnPrimary: buildPublicPath('brand/logo-h-mark-on-primary.png'),
  hMarkOnDark: buildPublicPath('brand/logo-h-mark-on-dark.png'),
} as const;

export type BrandLogoTone = 'light' | 'dark';
export type BrandLogoShape = 'hfree' | 'hMark';

export function pickBrandLogo(shape: BrandLogoShape, tone: BrandLogoTone): (typeof BRAND_LOGO)[keyof typeof BRAND_LOGO] {
  if (shape === 'hfree') {
    return tone === 'light' ? BRAND_LOGO.hfreeWordmark : BRAND_LOGO.hfreeOnDark;
  }
  return tone === 'light' ? BRAND_LOGO.hMarkOnPrimary : BRAND_LOGO.hMarkOnDark;
}
