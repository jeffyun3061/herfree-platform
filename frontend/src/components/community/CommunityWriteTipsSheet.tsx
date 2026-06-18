'use client';

import { BottomSheet } from '@/components/ui/BottomSheet';

const TONE_EXAMPLES = [
  '오늘 처음으로 증상이 올라와서 많이 불안했어요. 비슷한 경험 있으신 분 조언 부탁드려요.',
  '검사 결과를 받고 나서 며칠 동안 잠을 잘 못 잤습니다. 마음 정리하는 방법이 궁금해요.',
  '재발이 줄어든 것 같아서 기록 남겨봐요. 요즘 루틴이 도움이 되고 있어요.',
] as const;

type CommunityWriteTipsSheetProps = {
  open: boolean;
  onClose: () => void;
};

export function CommunityWriteTipsSheet({ open, onClose }: CommunityWriteTipsSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title="글쓰기 예시 문장">
      <ul className="space-y-3 text-sm leading-relaxed text-ink-soft">
        {TONE_EXAMPLES.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs leading-relaxed text-wrtn-muted">
        개인 신원·연락처·구체적 의료 기록은 포함하지 마세요. 나만 보는 재발 기록은 개인 일지를 이용해 주세요.
      </p>
    </BottomSheet>
  );
}
