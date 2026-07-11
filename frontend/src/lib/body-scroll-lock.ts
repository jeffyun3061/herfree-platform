let lockCount = 0;
let previousOverflow = '';

export function lockBodyScroll(): void {
  if (typeof document === 'undefined') return;
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  lockCount += 1;
}

export function unlockBodyScroll(): void {
  if (typeof document === 'undefined') return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = previousOverflow;
    previousOverflow = '';
  }
}

/** 로그아웃·세션 만료 등 — 남아 있는 스크롤 잠금을 강제 해제 */
export function forceUnlockBodyScroll(): void {
  if (typeof document === 'undefined') return;
  lockCount = 0;
  previousOverflow = '';
  document.body.style.overflow = '';
}
