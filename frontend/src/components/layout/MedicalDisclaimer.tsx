// requirements.md §14 의료 정보 안내 정책 — 정보글·전문가 콘텐츠 영역에 필수 표시
export function MedicalDisclaimer() {
  return (
    <div className="rounded-2xl border border-gold/30 bg-gold/5 px-4 py-3 text-xs leading-relaxed text-muted">
      본 콘텐츠는 일반적인 정보 제공을 목적으로 하며, 의학적 진단이나 치료를 대신하지 않습니다.
      정확한 진단과 치료는 반드시 의료기관 및 전문의 상담을 통해 진행해 주세요.
    </div>
  );
}
