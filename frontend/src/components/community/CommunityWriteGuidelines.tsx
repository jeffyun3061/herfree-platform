export function CommunityWriteGuidelines() {
  return (
    <fieldset className="rounded-[14px] border border-[#ECE5D8] bg-white px-4 pb-3.5 pt-2.5 text-[11.5px] leading-[1.75] text-muted">
      <legend className="px-1 text-[12px] font-semibold text-[#5C645A]">글쓰기 안내</legend>
      <ul className="mt-1.5 list-outside list-disc space-y-1.5 break-keep pl-4 marker:text-[#A9A498]">
        <li>전체 공개 또는 회원 공개를 선택해 주세요.</li>
        <li>개인 신원·연락처·실명과 민감한 의료 정보는 적지 마세요.</li>
        <li>나만 보는 재발·루틴 기록은 개인일지를 이용해 주세요.</li>
      </ul>
    </fieldset>
  );
}
