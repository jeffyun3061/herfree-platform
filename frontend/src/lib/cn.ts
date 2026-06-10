// className 조합 헬더 — 조건부 클래스를 문자열로 합칠 때 사용한다
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
