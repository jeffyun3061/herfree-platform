export function CommunityWriteGuidelines() {
  return (
    <div className="rounded-2xl border border-border/80 bg-cream px-4 py-3.5 text-[11.5px] leading-[1.75] text-muted">
      <p className="text-[12.5px] font-semibold text-ink">글쓰기 안내</p>
      <ul className="mt-2 list-outside list-disc space-y-1.5 pl-4 break-keep marker:text-[#A9A498]">
        <li>전체 공개 또는 회원 공개를 선택해 주세요.</li>
        <li>개인 신원·연락처·실명과 민감한 의료 정보는 적지 마세요.</li>
        <li>나만 보는 재발·루틴 기록은 개인일지를 이용해 주세요.</li>
      </ul>
    </div>
  );
}
