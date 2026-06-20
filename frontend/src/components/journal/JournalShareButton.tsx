'use client';

import { useState } from 'react';
import type { JournalDashboard } from '@/domain/journal/types';
import { buildJournalShareText, shareJournalText } from '@/domain/journal/share';
import { JournalIcon } from '@/components/journal/JournalIcon';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type JournalShareButtonProps = {
  dashboard: JournalDashboard | null | undefined;
  className?: string;
  variant?: 'default' | 'icon';
};

export function JournalShareButton({ dashboard, className, variant = 'default' }: JournalShareButtonProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const shareText = buildJournalShareText(dashboard, {
    includeStreak: true,
    includeRoutine: true,
    includeSiteLink: true,
  });

  const runShare = async (mode: 'native' | 'copy' | 'kakao') => {
    setPending(true);
    setMessage(null);
    try {
      if (mode === 'kakao') {
        await shareJournalText(shareText);
        setMessage('텍스트가 복사됐습니다. 카카오톡 채팅방에 붙여넣기 해 주세요.');
      } else if (mode === 'copy') {
        await shareJournalText(shareText);
        setMessage('공유 문구가 클립보드에 복사됐습니다.');
      } else {
        const result = await shareJournalText(shareText);
        setMessage(result === 'shared' ? '공유 창이 열렸습니다.' : '공유 문구가 복사됐습니다.');
      }
      setOpen(false);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      setMessage(error instanceof Error ? error.message : '공유에 실패했습니다.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className={cn('relative', className)}>
      {variant === 'icon' ? (
        <button
          type="button"
          disabled={pending}
          aria-label="기록 공유하기"
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10',
            'text-white/70 disabled:opacity-60',
          )}
        >
          <JournalIcon name="link" size={18} className="opacity-90" />
        </button>
      ) : (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() => setOpen((prev) => !prev)}
        >
          공유하기
        </Button>
      )}

      {open && (
        <div
          className={cn(
            'absolute right-0 top-full z-20 mt-2 w-56 rounded-2xl border border-border bg-white p-2 shadow-lg',
            variant === 'icon' && 'text-ink',
          )}
        >
          <p className="px-2 py-1 text-[11px] text-muted">
            메모·상세 증상은 포함되지 않습니다.
          </p>
          <button
            type="button"
            className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-canvas"
            onClick={() => void runShare('native')}
          >
            앱/브라우저로 공유
          </button>
          <button
            type="button"
            className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-canvas"
            onClick={() => void runShare('copy')}
          >
            문구 복사 (카페·블로그)
          </button>
          <button
            type="button"
            className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-canvas"
            onClick={() => void runShare('kakao')}
          >
            카카오톡용 복사
          </button>
        </div>
      )}

      {message && <p className="mt-2 text-xs text-primary">{message}</p>}
    </div>
  );
}
