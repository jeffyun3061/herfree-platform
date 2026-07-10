'use client';

import { LoggedOutFeaturePrompt } from '@/components/auth/LoggedOutFeaturePrompt';

export function LoggedOutMyPagePromptCard() {
  return (
    <LoggedOutFeaturePrompt
      title="마이페이지"
      subtitle="내 활동과 기록을 한곳에서 관리해요"
      body="가입하면 나의 기록과 활동을 한곳에서 볼 수 있어요"
      signupFrom="/mypage"
    />
  );
}
