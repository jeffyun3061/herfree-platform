export function AboutSection() {
  return (
    <section id="about" className="scroll-mt-24">
      <div className="surface-card border-border bg-white p-6 lg:p-8">
        <h2 className="section-heading">헤르프리 소개</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted lg:text-base">
          Herfree(헤르프리)는 헤르페스 이후의 삶을 홀로 견디지 않도록 돕는 익명 건강
          커뮤니티입니다. 우리는 제품 판매가 아니라, 안전한 소통·검증된 정보·일상 기록을
          통해 불안을 줄이고 스스로를 돌보는 힘을 키우는 것을 목표로 합니다.
        </p>
        <ul className="mt-4 grid gap-2 text-sm text-ink-soft lg:grid-cols-3">
          <li>· 익명 닉네임 기반 커뮤니티</li>
          <li>· 의료 정보는 참고용, 전문의 상담 권장</li>
          <li>· 제품은 외부 링크 큐레이션만 제공</li>
        </ul>
      </div>
    </section>
  );
}
