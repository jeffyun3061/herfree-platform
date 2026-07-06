'use client';

import { useState } from 'react';
import type { JournalDashboard } from '@/domain/journal/types';
import { PUBLIC_IMAGES } from '@/domain/assets/static';
import { buildJournalShareText, shareJournalText } from '@/domain/journal/share';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type JournalShareButtonProps = {
  dashboard: JournalDashboard | null;
  className?: string;
  variant?: 'button' | 'icon';
};

type ShareActionStatus = 'idle' | 'copied' | 'saved' | 'shared' | 'unsupported' | 'error';

function formatShareDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

function getStatusLabel(dashboard: JournalDashboard | null) {
  const today = dashboard?.todayRecord;
  if (!today) return '기록 시작';
  if (today.hadSymptoms) return '증상 발현';
  if ((today.prodromalSymptoms ?? []).length > 0) return '전조 증상';
  return '증상 없음';
}

function getSleepLabel(dashboard: JournalDashboard | null) {
  const value = dashboard?.todayRecord?.sleepHours;
  return value == null ? '-' : `${value}h`;
}

function loadCanvasImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('dashboard image blob failed'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });
}

async function buildDashboardImageBlob(dashboard: JournalDashboard | null) {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 900;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas context failed');

  const background = await loadCanvasImage(PUBLIC_IMAGES.journalDashboardCard);

  ctx.fillStyle = '#082F2A';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(background, 0, 0, canvas.width, 580);

  const heroGradient = ctx.createLinearGradient(0, 0, 0, 600);
  heroGradient.addColorStop(0, 'rgba(0,0,0,0.02)');
  heroGradient.addColorStop(0.58, 'rgba(0,0,0,0.08)');
  heroGradient.addColorStop(1, 'rgba(4,35,31,0.92)');
  ctx.fillStyle = heroGradient;
  ctx.fillRect(0, 0, canvas.width, 600);

  ctx.fillStyle = '#082F2A';
  ctx.fillRect(0, 580, canvas.width, 320);

  ctx.fillStyle = '#F7F1E8';
  ctx.font = '600 34px sans-serif';
  ctx.fillText(formatShareDate(), 64, 88);

  ctx.fillStyle = '#8AD4B8';
  ctx.beginPath();
  ctx.arc(74, 332, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 40px sans-serif';
  ctx.fillText(getStatusLabel(dashboard), 105, 346);

  ctx.font = '900 78px sans-serif';
  ctx.fillText(`${dashboard?.relapseFreeDays ?? 0}일째 평온`, 64, 448);

  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.font = '400 28px sans-serif';
  ctx.fillText('메모와 상세 증상은 포함되지 않습니다.', 64, 510);

  ctx.fillStyle = '#F0C778';
  ctx.font = '700 26px sans-serif';
  ctx.fillText('재발 기록', 660, 640);

  const metrics = [
    [`${dashboard?.relapseFreeDays ?? 0}일`, '평온 유지'],
    [`${dashboard?.routineCompletedToday ?? 0}/${dashboard?.routineTotalToday ?? 3}`, '오늘 루틴'],
    [getSleepLabel(dashboard), '수면'],
    [`${dashboard?.yearRelapses ?? 0}회`, '올해 재발'],
  ];

  metrics.forEach(([value, label], index) => {
    const x = 82 + index * 200;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 46px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(value, x, 704);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '500 22px sans-serif';
    ctx.fillText(label, x, 742);
  });

  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.64)';
  ctx.font = '500 24px sans-serif';
  ctx.fillText('HERFREE', 64, 828);
  ctx.font = '400 21px sans-serif';
  ctx.fillText('개인일지 대시보드 공유 이미지', 64, 862);

  return canvasToBlob(canvas);
}

async function copyBlobToClipboard(blob: Blob) {
  const ClipboardItemCtor = window.ClipboardItem;
  if (!navigator.clipboard || !ClipboardItemCtor) {
    throw new Error('unsupported');
  }
  await navigator.clipboard.write([new ClipboardItemCtor({ [blob.type]: blob })]);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function JournalShareButton({ dashboard, className, variant = 'button' }: JournalShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<ShareActionStatus>('idle');
  const shareText = buildJournalShareText(dashboard);

  const setDone = (next: ShareActionStatus) => {
    setStatus(next);
    window.setTimeout(() => setStatus('idle'), 2200);
  };

  const handleNativeShare = async () => {
    try {
      await shareJournalText(shareText);
      setDone('shared');
      setOpen(false);
    } catch {
      setDone('error');
    }
  };

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setDone('copied');
      setOpen(false);
    } catch {
      setDone('error');
    }
  };

  const handleCopyImage = async () => {
    try {
      const blob = await buildDashboardImageBlob(dashboard);
      await copyBlobToClipboard(blob);
      setDone('copied');
      setOpen(false);
    } catch (error) {
      setDone(error instanceof Error && error.message === 'unsupported' ? 'unsupported' : 'error');
    }
  };

  const handleDownloadImage = async () => {
    try {
      const blob = await buildDashboardImageBlob(dashboard);
      downloadBlob(blob, `herfree-dashboard-${formatShareDate().replaceAll('.', '-')}.png`);
      setDone('saved');
      setOpen(false);
    } catch {
      setDone('error');
    }
  };

  const kakaoText = `${shareText}\n\n카카오톡에 붙여 넣어 공유해 보세요.`;

  return (
    <div className={cn('relative inline-flex', className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'inline-flex items-center justify-center transition-colors',
          variant === 'icon'
            ? 'h-10 w-10 rounded-full bg-white/16 text-white backdrop-blur hover:bg-white/24'
            : 'rounded-full border border-[#E1D8C8] bg-white px-3 py-2 text-[12px] font-semibold text-[#0B3B36]',
        )}
        aria-label="대시보드 공유"
      >
        <svg
          viewBox="0 0 24 24"
          className={variant === 'icon' ? 'h-[18px] w-[18px]' : 'mr-1.5 h-[15px] w-[15px]'}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 16V4" />
          <path d="M7 9l5-5 5 5" />
          <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
        </svg>
        {variant !== 'icon' && '공유'}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-[244px] rounded-[18px] border border-[#E1D8C8] bg-white p-2 text-[#1E2621] shadow-[0_18px_48px_-24px_rgba(0,0,0,.45)]">
          <p className="px-3 pb-1.5 pt-2 text-[11px] font-semibold text-[#8A9086]">
            메모와 상세 증상은 포함되지 않습니다.
          </p>
          <ShareMenuButton onClick={() => void handleCopyImage()}>대시보드 이미지 복사</ShareMenuButton>
          <ShareMenuButton onClick={() => void handleDownloadImage()}>이미지 저장(PNG)</ShareMenuButton>
          <ShareMenuButton onClick={() => void handleNativeShare()}>앱/브라우저로 공유</ShareMenuButton>
          <ShareMenuButton onClick={() => void handleCopyText(shareText)}>문구 복사(카페·블로그)</ShareMenuButton>
          <ShareMenuButton onClick={() => void handleCopyText(kakaoText)}>카카오톡용 문구 복사</ShareMenuButton>
        </div>
      )}

      {status !== 'idle' && (
        <span className="absolute right-0 top-[calc(100%+8px)] z-40 whitespace-nowrap rounded-full bg-[#0B3B36] px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg">
          {status === 'copied' && '복사됐어요'}
          {status === 'saved' && '저장했어요'}
          {status === 'shared' && '공유를 열었어요'}
          {status === 'unsupported' && '이 브라우저는 이미지 복사를 지원하지 않아요'}
          {status === 'error' && '다시 시도해 주세요'}
        </span>
      )}
    </div>
  );
}

function ShareMenuButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="h-auto w-full justify-start rounded-[12px] px-3 py-2.5 text-left text-[13px] font-semibold text-[#1E2621] hover:bg-[#F6F1E8]"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
