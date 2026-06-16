export function CommunityWriteGuidelines() {
  return (
    <div className="rounded-2xl border border-border/80 bg-cream px-4 py-3 text-xs leading-relaxed text-muted">
      <p className="font-medium text-ink">글쓰기 안내</p>
      <ul className="mt-2 list-inside list-disc space-y-1">
        <li>개인 신원·연락처·실명을 포함하지 마세요.</li>
        <li>구체적인 의료 기록·진단명 등 민감한 개인 의료 정보는 피해 주세요.</li>
        <li>익명 커뮤니티이지만, 나만 보는 재발·루틴 기록은 개인 일지를 이용해 주세요.</li>
      </ul>
    </div>
  );
}
