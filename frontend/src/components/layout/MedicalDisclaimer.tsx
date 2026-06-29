import { cn } from '@/lib/cn';

type MedicalDisclaimerProps = {
  className?: string;
  /** 홈·목록 등 — 한 줄 요약형 */
  compact?: boolean;
};

// requirements.md §14 의료 정보 안내 정책 — 정보글·전문가 콘텐츠 영역에 필수 표시
export function MedicalDisclaimer({ className, compact = false }: MedicalDisclaimerProps) {
  return (
    <aside
      role="note"
      aria-label="의료 정보 안내"
      className={cn(
        'flex gap-2.5 rounded-2xl border border-gold/40 bg-gold/[0.08] px-3.5 py-3',
        'text-[11px] leading-relaxed text-ink-soft sm:text-xs',
        className,
      )}
    >
      <span
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold"
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16h.01" strokeLinecap="round" />
        </svg>
      </span>
      <p>
        {compact ? (
          <>
            일반 정보 제공 목적이며, 진단·치료를 대신하지 않습니다.
            <br />
            정확한 진단과 치료는 의료기관·전문의 상담을 통해 진행해 주세요.
          </>
        ) : (
          <>
            본 콘텐츠는 일반적인 정보 제공을 목적으로 하며, 의학적 진단이나 치료를 대신하지 않습니다.
            <br />
            정확한 진단과 치료는 반드시 의료기관 및 전문의 상담을 통해 진행해 주세요.
          </>
        )}
      </p>
    </aside>
  );
}
