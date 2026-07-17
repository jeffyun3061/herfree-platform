/** 서비스 운영·문의·개인정보·약관 안내용 공식 연락 이메일 */
export const OPERATOR_CONTACT_EMAIL = 'herpfree3@gmail.com';

export function operatorContactMailtoHref(): string {
  return `mailto:${OPERATOR_CONTACT_EMAIL}`;
}
