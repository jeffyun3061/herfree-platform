const DEFAULT_KAKAO_CONSULT_URL = 'https://open.kakao.com/o/srMDr6gi';

function resolveKakaoConsultUrl(value: string | undefined): string {
  if (!value?.trim()) return DEFAULT_KAKAO_CONSULT_URL;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' && url.hostname === 'open.kakao.com'
      ? url.toString()
      : DEFAULT_KAKAO_CONSULT_URL;
  } catch {
    return DEFAULT_KAKAO_CONSULT_URL;
  }
}

export const KAKAO_CONSULT_URL = resolveKakaoConsultUrl(
  process.env.NEXT_PUBLIC_KAKAO_CONSULT_URL,
);
