'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { JournalDashboard } from '@/domain/journal/types';
import { PUBLIC_IMAGES } from '@/domain/assets/static';
import { buildJournalShareText, shareJournalText } from '@/domain/journal/share';
import { captureElementPngBlob } from '@/lib/domCapture';
import { cn } from '@/lib/cn';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/body-scroll-lock';

type JournalShareButtonProps = {
  dashboard: JournalDashboard | null;
  className?: string;
  variant?: 'button' | 'icon';
};

type ShareActionStatus =
  | 'idle'
  | 'home-link-copied'
  | 'image-copied'
  | 'image-saved'
  | 'text-copied'
  | 'shared'
  | 'unsupported'
  | 'error';

const SHARE_ICON_PROPS = {
  fill: 'none' as const,
  stroke: '#F0C778',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const DASHBOARD_IMAGE_FILE_PREFIX = 'herpfree';

function ShareLinkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...SHARE_ICON_PROPS} aria-hidden>
      <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11.5 4.5" />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L12.5 19.5" />
    </svg>
  );
}

function ShareCopyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...SHARE_ICON_PROPS} aria-hidden>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function ShareDownloadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...SHARE_ICON_PROPS} aria-hidden>
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

function ShareNativeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...SHARE_ICON_PROPS} aria-hidden>
      <path d="M12 16V4" />
      <path d="M7 9l5-5 5 5" />
      <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
    </svg>
  );
}

function formatShareDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

function getDashboardImageFileName() {
  return `${DASHBOARD_IMAGE_FILE_PREFIX}-${formatShareDate().replaceAll('.', '-')}.png`;
}

function getStatusLabel(dashboard: JournalDashboard | null) {
  const today = dashboard?.todayRecord;
  if (!today) return '기록 시작';
  if (today.hadSymptoms) return '증상 발현';
  if ((today.prodromalSymptoms ?? []).length > 0) return '전조 증상';
  return '증상 없음';
}

function loadCanvasImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timeout = window.setTimeout(() => reject(new Error('dashboard background timeout')), 5000);
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      window.clearTimeout(timeout);
      resolve(image);
    };
    image.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error('dashboard background load failed'));
    };
    image.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('dashboard image blob failed'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });
}

function drawCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  fillStyle: string,
) {
  context.font = font;
  context.fillStyle = fillStyle;
  context.fillText(text, x, y);
}

async function buildDashboardImageBlob(dashboard: JournalDashboard | null): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 900;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('canvas context failed');

  context.fillStyle = '#082F2A';
  context.fillRect(0, 0, canvas.width, canvas.height);

  try {
    const background = await loadCanvasImage(PUBLIC_IMAGES.journalDashboardCard);
    context.drawImage(background, 0, 0, canvas.width, 580);
  } catch {
    // The card remains saveable with the brand background if the image asset is unavailable.
  }

  const heroGradient = context.createLinearGradient(0, 0, 0, 600);
  heroGradient.addColorStop(0, 'rgba(0,0,0,0.02)');
  heroGradient.addColorStop(0.58, 'rgba(0,0,0,0.08)');
  heroGradient.addColorStop(1, 'rgba(4,35,31,0.92)');
  context.fillStyle = heroGradient;
  context.fillRect(0, 0, canvas.width, 600);

  context.fillStyle = '#082F2A';
  context.fillRect(0, 580, canvas.width, 320);

  drawCanvasText(context, formatShareDate(), 64, 88, '600 34px sans-serif', '#F7F1E8');
  context.fillStyle = '#8AD4B8';
  context.beginPath();
  context.arc(74, 332, 11, 0, Math.PI * 2);
  context.fill();
  drawCanvasText(context, getStatusLabel(dashboard), 105, 346, '800 40px sans-serif', '#FFFFFF');
  drawCanvasText(
    context,
    `${dashboard?.relapseFreeDays ?? 0}일째 평온`,
    64,
    448,
    '900 78px sans-serif',
    '#FFFFFF',
  );
  drawCanvasText(
    context,
    '메모와 상세 증상은 포함되지 않습니다.',
    64,
    510,
    '400 28px sans-serif',
    'rgba(255,255,255,0.72)',
  );

  drawCanvasText(context, '재발 기록', 660, 640, '700 26px sans-serif', '#F0C778');
  const metrics = [
    [`${dashboard?.relapseFreeDays ?? 0}일`, '평온 유지'],
    [`${dashboard?.routineCompletedToday ?? 0}/${dashboard?.routineTotalToday ?? 3}`, '오늘 루틴'],
    [dashboard?.todayRecord?.sleepHours == null ? '-' : `${dashboard.todayRecord.sleepHours}h`, '수면'],
    [`${dashboard?.yearRelapses ?? 0}회`, '올해 재발'],
  ];

  metrics.forEach(([value, label], index) => {
    const x = 82 + index * 200;
    context.textAlign = 'center';
    drawCanvasText(context, value, x, 704, '900 46px sans-serif', '#FFFFFF');
    drawCanvasText(context, label, x, 742, '500 22px sans-serif', 'rgba(255,255,255,0.6)');
  });
  context.textAlign = 'left';
  drawCanvasText(context, 'HERFREE', 64, 828, '500 24px sans-serif', 'rgba(255,255,255,0.64)');
  drawCanvasText(context, '개인일지 대시보드 공유 이미지', 64, 862, '400 21px sans-serif', 'rgba(255,255,255,0.64)');

  return canvasToBlob(canvas);
}

async function writeTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('clipboard unavailable');
}

async function resolveDashboardImageBlob(dashboard: JournalDashboard | null) {
  const card = document.getElementById('hf-dashboard-card');
  if (card instanceof HTMLElement) {
    try {
      return await captureElementPngBlob(card);
    } catch (error) {
      console.warn('Dashboard DOM capture failed; using canvas fallback.', error);
    }
  }
  return buildDashboardImageBlob(dashboard);
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
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getToastMessage(status: ShareActionStatus) {
  switch (status) {
    case 'home-link-copied':
      return '홈 링크를 복사했어요';
    case 'image-copied':
      return '대시보드 이미지를 복사했어요';
    case 'image-saved':
      return '대시보드 이미지를 저장했어요';
    case 'text-copied':
      return '복사했어요';
    case 'shared':
      return '공유를 열었어요';
    case 'unsupported':
      return '이미지 복사를 지원하지 않는 환경이에요';
    case 'error':
      return '다시 시도해 주세요';
    default:
      return '';
  }
}

type ShareRowProps = {
  label: string;
  sub: string;
  icon: React.ReactNode;
  onClick: () => void;
};

function ShareSheetRow({ label, sub, icon, onClick }: ShareRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-[13px] rounded-2xl border-[0.5px] border-[#EADFCB] bg-[#FBF6EA] px-4 py-3.5 text-left shadow-[0_8px_20px_-20px_rgba(7,37,31,.4)] transition-colors hover:bg-[#F5EFE0]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B3B36]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-bold text-[#15201D]">{label}</span>
        <span className="mt-0.5 block text-[11.5px] text-[#8A9089]">{sub}</span>
      </span>
      <span className="shrink-0 text-[#C3B79E]" aria-hidden>
        ›
      </span>
    </button>
  );
}

export function JournalShareButton({ dashboard, className, variant = 'button' }: JournalShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<ShareActionStatus>('idle');
  const shareText = buildJournalShareText(dashboard);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [open]);

  const setDone = (next: ShareActionStatus) => {
    setStatus(next);
    setOpen(false);
    window.setTimeout(() => setStatus('idle'), 2200);
  };

  const handleNativeShare = async () => {
    try {
      const blob = await resolveDashboardImageBlob(dashboard);
      const file = new File([blob], getDashboardImageFileName(), {
        type: 'image/png',
      });
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({
          title: '헤르프리 기록 카드',
          text: '헤르프리에서 만든 오늘의 개인 기록 카드예요. 메모와 상세 증상은 포함되지 않습니다.',
          url: `${window.location.origin}/`,
          files: [file],
        });
      } else {
        await shareJournalText(shareText);
      }
      setDone('shared');
    } catch {
      setDone('error');
    }
  };

  const handleCopyText = async (text: string, status: ShareActionStatus = 'text-copied') => {
    try {
      await writeTextToClipboard(text);
      setDone(status);
    } catch {
      setDone('error');
    }
  };

  const handleCopyHomeLink = async () => {
    const origin = window.location.origin;
    await handleCopyText(`${origin}/`, 'home-link-copied');
  };

  const handleCopyImage = async () => {
    try {
      const blob = await resolveDashboardImageBlob(dashboard);
      await copyBlobToClipboard(blob);
      setDone('image-copied');
    } catch (error) {
      setDone(error instanceof Error && error.message === 'unsupported' ? 'unsupported' : 'error');
    }
  };

  const handleDownloadImage = async () => {
    try {
      const blob = await resolveDashboardImageBlob(dashboard);
      downloadBlob(blob, getDashboardImageFileName());
      setDone('image-saved');
    } catch {
      setDone('error');
    }
  };

  const sheet = open && mounted ? (
    <div
      className="fixed inset-0 z-[80] flex flex-col justify-end bg-[rgba(7,22,18,.45)] hf-share-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="journal-share-title"
    >
      <button type="button" className="absolute inset-0" aria-label="닫기" onClick={() => setOpen(false)} />
      <div
        className="relative z-10 w-full max-w-app mx-auto rounded-t-[24px] bg-[#F3EDE3] px-5 pb-[26px] pt-2.5 shadow-[0_-18px_40px_-20px_rgba(7,37,31,.5)] hf-share-sheet"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-[38px] rounded-full bg-[#D8CDB9]" aria-hidden />
        <div className="mb-1 flex items-center justify-between">
          <h2 id="journal-share-title" className="hf-display text-[18px] font-extrabold text-[#15201D]">
            공유하기
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-1 text-[20px] leading-none text-[#9A9F94]"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
        <p className="mb-4 text-[12px] text-[#9A9F94]">오늘의 상태 카드를 다른 사람에게 전달해요</p>
        <div className="flex flex-col gap-2.5">
          <ShareSheetRow
            label="홈 링크 복사"
            sub="헤르프리 홈페이지 주소를 복사해요"
            icon={<ShareLinkIcon />}
            onClick={() => void handleCopyHomeLink()}
          />
          <ShareSheetRow
            label="대시보드 이미지 복사"
            sub="내 상태 카드를 이미지로 복사해요"
            icon={<ShareCopyIcon />}
            onClick={() => void handleCopyImage()}
          />
          <ShareSheetRow
            label="대시보드 이미지 저장"
            sub="PNG 파일로 내려받아요"
            icon={<ShareDownloadIcon />}
            onClick={() => void handleDownloadImage()}
          />
          <ShareSheetRow
            label="앱/브라우저로 공유"
            sub="휴대폰 공유 메뉴를 열어요"
            icon={<ShareNativeIcon />}
            onClick={() => void handleNativeShare()}
          />
          {/* 문구 복사 메뉴는 요청에 따라 잠시 비활성화합니다.
          <ShareSheetRow
            label="문구 복사(카페·블로그)"
            sub="텍스트로 붙여 넣을 수 있어요"
            icon={<ShareTextIcon />}
            onClick={() => void handleCopyText(shareText)}
          />
          <ShareSheetRow
            label="카카오톡용 문구 복사"
            sub="카카오톡에 붙여 넣기 좋은 문구예요"
            icon={<ShareKakaoIcon />}
            onClick={() => void handleCopyText(kakaoText)}
          />
          */}
        </div>
        <p className="mt-4 text-center text-[11px] text-[#9A9F94]">
          메모와 상세 증상은 포함되지 않습니다.
        </p>
      </div>
    </div>
  ) : null;

  const toast =
    status !== 'idle' && mounted ? (
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[90] flex justify-center px-5">
        <span className="rounded-full bg-[#0B3B36] px-4 py-2 text-[12px] font-semibold text-white shadow-lg">
          {getToastMessage(status)}
        </span>
      </div>
    ) : null;

  return (
    <div className={cn('relative inline-flex', className)}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex items-center justify-center transition-colors',
          variant === 'icon'
            ? 'h-10 w-10 rounded-full bg-white/16 text-white backdrop-blur hover:bg-white/24'
            : 'rounded-full border border-[#E1D8C8] bg-white px-3 py-2 text-[12px] font-semibold text-[#0B3B36]',
        )}
        aria-label="대시보드 공유"
        aria-expanded={open}
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

      {mounted && sheet ? createPortal(sheet, document.body) : null}
      {mounted && toast ? createPortal(toast, document.body) : null}
    </div>
  );
}
