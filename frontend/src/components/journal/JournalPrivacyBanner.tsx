'use client';

import Link from 'next/link';

export function JournalPrivacyBanner() {
  return (
    <section
      className="rounded-card border border-primary/15 bg-primary/5 px-4 py-3.5"
      aria-label="개인 일지 프라이버시 안내"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-lg" aria-hidden>
          🔒
        </span>
        <div className="min-w-0 space-y-1 text-sm leading-relaxed text-ink-soft">
          <p className="font-semibold text-ink">본인만 볼 수 있는 비공개 기록</p>
          <p>
            증상·메모·수면 기록은 로그인한 본인 계정에서만 조회됩니다. 운영자는 익명 통계만
            확인하며, 누가 기록했는지 알 수 없습니다.
          </p>
          <p className="text-xs text-muted">
            기록 히스토리에서 <span className="font-medium text-ink">삭제</span>하면 서버에서
            영구 삭제됩니다.{' '}
            <Link href="#history" className="font-medium text-primary underline-offset-2 hover:underline">
              히스토리로 이동
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
