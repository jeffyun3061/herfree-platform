'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export function SymptomBoardRedirectBanner() {
  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 px-4 py-4">
      <p className="text-sm font-semibold text-ink">증상 기록방은 경험 나누기용이에요</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        매일의 재발·수면·스트레스 패턴을 혼자 관리하려면 개인 일지가 더 적합합니다. 비공개로
        기록하고 패턴을 확인해 보세요.
      </p>
      <Link href="/journal" className="mt-3 inline-block">
        <Button size="sm">개인 일지로 이동</Button>
      </Link>
    </div>
  );
}
