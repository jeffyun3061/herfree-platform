'use client';

import { useState } from 'react';
import type { OAuthProvider } from '@/domain/auth/oauth';
import { isOAuthClientConfigured, startOAuthLogin } from '@/domain/auth/oauth';
import { cn } from '@/lib/cn';

type SocialLoginButtonsProps = {
  returnUrl: string;
  mode?: 'login' | 'signup';
  className?: string;
};

function KakaoIcon() {
  return (
    <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#191919]/10">
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="currentColor"
          d="M12 3C7.03 3 3 6.13 3 10c0 2.55 1.68 4.8 4.22 6.1L6.5 19.8c-.08.3.25.54.52.36l3.2-2.14c.58.08 1.17.12 1.78.12 4.97 0 9-3.13 9-7s-4.03-7-9-7Z"
        />
      </svg>
    </span>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path fill="#EA4335" d="M12 11.2v2.55h5.14c-.22 1.18-.88 2.18-1.87 2.84l3.02 2.34c1.76-1.62 2.77-4.01 2.77-6.86 0-.66-.06-1.3-.17-1.93H12Z" />
      <path fill="#34A853" d="M6.09 14.32 3.96 16.2C5.43 19.01 8.48 21 12 21c2.4 0 4.41-.79 5.88-2.14l-3.02-2.34c-.84.56-1.92.9-2.86.9-2.2 0-4.06-1.48-4.73-3.47Z" />
      <path fill="#4A90E2" d="M3.96 7.8C3.35 9.04 3 10.47 3 12s.35 2.96.96 4.2l2.13-1.88C5.77 13.56 5.5 12.8 5.5 12s.27-1.56.59-2.32L3.96 7.8Z" />
      <path fill="#FBBC05" d="M12 5.38c1.3 0 2.47.45 3.39 1.33l2.54-2.54C16.4 2.92 14.39 2 12 2 8.48 2 5.43 3.99 3.96 6.8L6.09 8.68C6.76 6.69 8.62 5.38 12 5.38Z" />
    </svg>
  );
}

function NaverIcon() {
  return (
    <span className="flex h-[22px] w-[22px] items-center justify-center rounded-[4px] bg-white/20">
      <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden>
        <path fill="currentColor" d="M4 4h16v16H4V4Zm4.2 3.6v8.8L17 8.2V7.6H9.8v8.8L7.2 16V7.6Z" />
      </svg>
    </span>
  );
}

const PROVIDERS: Array<{
  provider: OAuthProvider;
  loginLabel: string;
  signupLabel: string;
  icon: () => JSX.Element;
  className: string;
  configuredClassName: string;
}> = [
  {
    provider: 'kakao',
    loginLabel: '카카오로 계속하기',
    signupLabel: '카카오로 시작하기',
    icon: KakaoIcon,
    className: 'bg-[#FEE500] text-[#191919]',
    configuredClassName: 'hover:bg-[#f7db00] active:scale-[0.99]',
  },
  {
    provider: 'naver',
    loginLabel: '네이버로 계속하기',
    signupLabel: '네이버로 시작하기',
    icon: NaverIcon,
    className: 'bg-[#03C75A] text-white',
    configuredClassName: 'hover:bg-[#02b351] active:scale-[0.99]',
  },
  {
    provider: 'google',
    loginLabel: 'Google로 계속하기',
    signupLabel: 'Google로 시작하기',
    icon: GoogleIcon,
    className: 'border border-[#E6DECF] bg-white text-[#1E2621]',
    configuredClassName: 'hover:bg-[#FAF7F1] active:scale-[0.99]',
  },
];

export function SocialLoginButtons({
  returnUrl,
  mode = 'login',
  className,
}: SocialLoginButtonsProps) {
  const [configError, setConfigError] = useState<string | null>(null);

  const handleClick = (provider: OAuthProvider, label: string) => {
    setConfigError(null);
    if (!isOAuthClientConfigured(provider)) {
      setConfigError(
        `${label.split('로')[0]} 로그인 키가 아직 설정되지 않았어요. frontend/.env.local 과 backend/local-secrets.yml 을 확인해 주세요.`,
      );
      return;
    }
    startOAuthLogin(provider, returnUrl);
  };

  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      {PROVIDERS.map(({ provider, loginLabel, signupLabel, icon: Icon, className: baseClassName, configuredClassName }) => {
        const label = mode === 'signup' ? signupLabel : loginLabel;
        const configured = isOAuthClientConfigured(provider);

        return (
          <button
            key={provider}
            type="button"
            onClick={() => handleClick(provider, label)}
            className={cn(
              'flex h-[50px] w-full items-center justify-center gap-2.5 rounded-[14px] text-[14px] font-bold transition-all',
              baseClassName,
              configured ? configuredClassName : 'opacity-55',
            )}
          >
            <Icon />
            <span>{label}</span>
          </button>
        );
      })}

      {configError ? (
        <p className="rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] leading-relaxed text-amber-900">
          {configError}
        </p>
      ) : null}
    </div>
  );
}

export function SocialLoginBelowEmail({
  returnUrl,
  mode = 'login',
  className,
}: SocialLoginButtonsProps) {
  return (
    <div className={className}>
      <div className="auth-divider">
        <span>또는 소셜로</span>
      </div>
      <SocialLoginButtons returnUrl={returnUrl} mode={mode} className="mt-5" />
    </div>
  );
}
