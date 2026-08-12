'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { JournalDashboard, JournalRecord, StressLevel } from '@/domain/journal/types';
import { PUBLIC_IMAGES } from '@/domain/assets/static';
import { avgSleepToHours, countRecordStreak, formatDashboardDateBadge } from '@/domain/journal/routine';
import {
  buildJournalShareText,
  HERFREE_SITE_URL,
  shareJournalText,
} from '@/domain/journal/share';
import { captureElementPngBlob } from '@/lib/domCapture';
import { cn } from '@/lib/cn';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/body-scroll-lock';

type JournalShareButtonProps = {
  dashboard: JournalDashboard | null;
  lastRecord?: JournalRecord | null;
  showRecordButton?: boolean;
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

const HOME_SUMMARY_DAYS = 90;

type PreviewStatus = 'none' | 'prodrome' | 'symptom';

const PREVIEW_STATUS_TONE: Record<
  PreviewStatus,
  { dot: string; title: string; overlay: [string, string, string] }
> = {
  none: {
    dot: '#8AD4B8',
    title: '증상 없음',
    overlay: ['rgba(20,40,44,.12)', 'rgba(20,40,44,.02)', 'rgba(9,32,30,.62)'],
  },
  prodrome: {
    dot: '#F0B27A',
    title: '전조 증상',
    overlay: ['rgba(46,34,14,.14)', 'rgba(46,34,14,.04)', 'rgba(74,47,16,.66)'],
  },
  symptom: {
    dot: '#EF8C6B',
    title: '증상 발현',
    overlay: ['rgba(50,20,14,.16)', 'rgba(50,20,14,.05)', 'rgba(74,24,16,.68)'],
  },
};

const STRESS_LABELS: Record<StressLevel, string> = {
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
};

function derivePreviewStatus(record: JournalRecord | null): PreviewStatus {
  if (!record) return 'none';
  if (record.hadSymptoms) return 'symptom';
  if ((record.prodromalSymptoms ?? []).length > 0) return 'prodrome';
  return 'none';
}

function formatSleepHours(record: JournalRecord | null | undefined): string {
  if (!record) return '-';
  if (record.sleepHours != null) return `${record.sleepHours}`;
  const hours = avgSleepToHours(record.avgSleep);
  return hours == null ? '-' : `${hours}`;
}

function formatStress(record: JournalRecord | null | undefined): string {
  if (!record?.stressLevel) return '보통';
  return STRESS_LABELS[record.stressLevel];
}

function calcSupplementRate(days: JournalDashboard['timelineDays']): number {
  const recorded = days.filter((day) => day.recorded);
  if (recorded.length === 0) return 0;
  const taken = recorded.filter((day) => !day.medicationMissed).length;
  return Math.round((taken / recorded.length) * 100);
}

function filterTimelineByDays(
  days: JournalDashboard['timelineDays'],
  periodDays: number,
): JournalDashboard['timelineDays'] {
  if (days.length === 0) return [];
  const anchorDate = days[days.length - 1]?.date;
  const anchor = new Date(`${anchorDate}T00:00:00`);
  if (Number.isNaN(anchor.getTime())) return days.slice(-periodDays);
  const cutoff = new Date(anchor);
  cutoff.setDate(cutoff.getDate() - periodDays + 1);
  const cutoffIso = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(
    cutoff.getDate(),
  ).padStart(2, '0')}`;
  return days.filter((day) => day.date >= cutoffIso);
}

function buildPreviewSubStatus(
  status: PreviewStatus,
  record: JournalRecord | null,
  relapseFreeDays: number,
): string {
  if (status === 'symptom') {
    const severity = record?.severity ?? 3;
    return `증상 1일째 · 심각도 ${severity} · 오늘은 몸을 아껴요`;
  }
  if (status === 'prodrome') {
    const labels = (record?.prodromalSymptoms ?? []).slice(0, 2).join('·') || '전조 신호 감지';
    return `전조 신호 감지 · ${labels} · 오늘은 컨디션을 살펴봐요`;
  }
  return `마지막 증상 이후 ${relapseFreeDays}일째 · 수면 ${formatSleepHours(record)}h · 스트레스 ${formatStress(record)}`;
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

function drawObjectCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const offsetX = (drawWidth - width) / 2;
  const offsetY = (drawHeight - height) * 0.38;
  context.drawImage(image, -offsetX, -offsetY, drawWidth, drawHeight);
}

function drawShareIcon(context: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  context.save();
  context.strokeStyle = 'rgba(255,255,255,.88)';
  context.lineWidth = 2.2 * scale;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.beginPath();
  context.moveTo(x + 12 * scale, y + 16 * scale);
  context.lineTo(x + 12 * scale, y + 4 * scale);
  context.moveTo(x + 7 * scale, y + 9 * scale);
  context.lineTo(x + 12 * scale, y + 4 * scale);
  context.lineTo(x + 17 * scale, y + 9 * scale);
  context.moveTo(x + 5 * scale, y + 14 * scale);
  context.lineTo(x + 5 * scale, y + 18 * scale);
  context.quadraticCurveTo(x + 5 * scale, y + 20 * scale, x + 7 * scale, y + 20 * scale);
  context.lineTo(x + 17 * scale, y + 20 * scale);
  context.quadraticCurveTo(x + 19 * scale, y + 20 * scale, x + 19 * scale, y + 18 * scale);
  context.lineTo(x + 19 * scale, y + 14 * scale);
  context.stroke();
  context.restore();
}

async function buildDashboardImageBlob(
  dashboard: JournalDashboard | null,
  lastRecord: JournalRecord | null,
  showRecordButton: boolean,
): Promise<Blob> {
  const scale = 2.5;
  const width = 900;
  const heroHeight = 196 * scale;
  const contentHeight = (showRecordButton ? 188 : 135) * scale;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = heroHeight + contentHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('canvas context failed');

  const focusRecord = dashboard?.todayRecord ?? lastRecord ?? null;
  const status = derivePreviewStatus(focusRecord);
  const statusTone = PREVIEW_STATUS_TONE[status];
  const relapseFreeDays = dashboard?.relapseFreeDays ?? 0;
  const timelineDays = filterTimelineByDays(dashboard?.timelineDays ?? [], HOME_SUMMARY_DAYS);
  const summaryMetrics = [
    [`${calcSupplementRate(timelineDays)}`, '%', '영양제'],
    [formatSleepHours(focusRecord), 'h', '평균 수면'],
    [`${dashboard?.yearRelapses ?? 0}`, '회', '올해 재발'],
    [`${timelineDays.filter((day) => day.recorded).length}`, '일', '기록'],
  ];

  context.fillStyle = '#07251F';
  context.fillRect(0, 0, width, canvas.height);

  try {
    const background = await loadCanvasImage(PUBLIC_IMAGES.journalDashboardCard);
    drawObjectCover(context, background, width, heroHeight);
  } catch {
    // Keep the same dark card surface when the background asset is unavailable.
  }

  const heroOverlay = context.createLinearGradient(0, 0, 0, heroHeight);
  heroOverlay.addColorStop(0, statusTone.overlay[0]);
  heroOverlay.addColorStop(0.42, statusTone.overlay[1]);
  heroOverlay.addColorStop(1, statusTone.overlay[2]);
  context.fillStyle = heroOverlay;
  context.fillRect(0, 0, width, heroHeight);

  context.fillStyle = '#07251F';
  context.fillRect(0, heroHeight, width, contentHeight);

  drawCanvasText(context, formatDashboardDateBadge(new Date()), 50, 76, '500 31px sans-serif', '#FFFFFF');
  drawShareIcon(context, 824, 42, 1.6);

  const statusBaseline = heroHeight - 116;
  context.fillStyle = statusTone.dot;
  context.beginPath();
  context.arc(58, statusBaseline - 7, 9, 0, Math.PI * 2);
  context.fill();
  drawCanvasText(context, '오늘 상태', 82, statusBaseline, '600 31px sans-serif', '#FFFFFF');
  drawCanvasText(context, statusTone.title, 50, statusBaseline + 76, '800 75px sans-serif', '#FFFFFF');
  drawCanvasText(
    context,
    buildPreviewSubStatus(status, focusRecord, relapseFreeDays),
    50,
    statusBaseline + 116,
    '500 27px sans-serif',
    'rgba(255,255,255,.9)',
  );

  const summaryTop = heroHeight + 42;
  drawCanvasText(
    context,
    `개인일지 요약 · 최근 ${HOME_SUMMARY_DAYS}일`,
    45,
    summaryTop,
    '500 28px sans-serif',
    'rgba(255,255,255,.62)',
  );
  context.textAlign = 'right';
  drawCanvasText(context, '자세히 ›', width - 45, summaryTop, '600 29px sans-serif', '#F0C778');
  context.textAlign = 'center';

  summaryMetrics.forEach(([value, unit, label], index) => {
    const x = 112.5 + index * 225;
    drawCanvasText(context, value, x, summaryTop + 84, '800 50px sans-serif', '#FFFFFF');
    context.textAlign = 'left';
    drawCanvasText(context, unit, x + 38, summaryTop + 84, '400 26px sans-serif', 'rgba(255,255,255,.6)');
    context.textAlign = 'center';
    drawCanvasText(context, label, x, summaryTop + 112, '400 24px sans-serif', 'rgba(255,255,255,.55)');
  });

  drawCanvasText(
    context,
    `🔥 ${countRecordStreak(dashboard?.timelineDays)}일 연속 기록 중`,
    width / 2,
    summaryTop + 163,
    '700 29px sans-serif',
    '#F0C778',
  );

  if (showRecordButton) {
    const buttonY = summaryTop + 190;
    context.fillStyle = 'rgba(243,237,227,.12)';
    context.strokeStyle = 'rgba(243,237,227,.3)';
    context.lineWidth = 2;
    context.beginPath();
    context.roundRect(45, buttonY, width - 90, 96, 30);
    context.fill();
    context.stroke();
    drawCanvasText(context, '✏️ 오늘 기록하기', width / 2, buttonY + 60, '700 32px sans-serif', '#F3EDE3');
  }

  context.textAlign = 'left';
  drawCanvasText(context, '헤르프리', 45, canvas.height - 22, '600 24px sans-serif', 'rgba(255,255,255,.65)');
  context.textAlign = 'right';
  drawCanvasText(context, HERFREE_SITE_URL.replace(/^https?:\/\//, ''), width - 45, canvas.height - 22, '400 21px sans-serif', 'rgba(255,255,255,.55)');
  context.textAlign = 'left';

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

async function resolveDashboardImageBlob(
  dashboard: JournalDashboard | null,
  lastRecord: JournalRecord | null,
  showRecordButton: boolean,
) {
  const card = document.getElementById('hf-dashboard-card');
  if (card instanceof HTMLElement) {
    try {
      return await captureElementPngBlob(card);
    } catch (error) {
      console.warn('Dashboard DOM capture failed; using canvas fallback.', error);
    }
  }
  return buildDashboardImageBlob(dashboard, lastRecord, showRecordButton);
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

export function JournalShareButton({
  dashboard,
  lastRecord = null,
  showRecordButton = false,
  className,
  variant = 'button',
}: JournalShareButtonProps) {
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
      const blob = await resolveDashboardImageBlob(dashboard, lastRecord, showRecordButton);
      const file = new File([blob], getDashboardImageFileName(), {
        type: 'image/png',
      });
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({
          title: '헤르프리 기록 카드',
          text: '헤르프리에서 만든 오늘의 개인 기록 카드예요. 메모와 상세 증상은 포함되지 않습니다.',
          url: `${HERFREE_SITE_URL}/`,
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
    await handleCopyText(`${HERFREE_SITE_URL}/`, 'home-link-copied');
  };

  const handleCopyImage = async () => {
    try {
      const blob = await resolveDashboardImageBlob(dashboard, lastRecord, showRecordButton);
      await copyBlobToClipboard(blob);
      setDone('image-copied');
    } catch (error) {
      setDone(error instanceof Error && error.message === 'unsupported' ? 'unsupported' : 'error');
    }
  };

  const handleDownloadImage = async () => {
    try {
      const blob = await resolveDashboardImageBlob(dashboard, lastRecord, showRecordButton);
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
