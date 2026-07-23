'use client';

import Link from 'next/link';
import { BrandMark } from '@/components/brand/BrandMark';

type AuthScreenShellProps = {
  backHref?: string;
  title: string;
  subtitle: string;
  brandSize?: 'md' | 'lg';
  children: React.ReactNode;
};

export function AuthScreenShell({
  backHref = '/',
  title,
  subtitle,
  brandSize = 'lg',
  children,
}: AuthScreenShellProps) {
  return (
    <div className="min-h-[100dvh] bg-[#F3EDE3] lg:min-h-[min(844px,calc(100vh-4rem))]">
      <div className="flex min-h-[100dvh] flex-col px-0 pb-[max(2.75rem,calc(1rem+env(safe-area-inset-bottom)))] pt-[max(18px,env(safe-area-inset-top))] lg:min-h-[min(844px,calc(100vh-4rem))] lg:pb-11 lg:pt-6">
        <div className="px-5">
          <Link
            href={backHref}
            className="inline-flex text-[24px] leading-none text-[#5C645A] transition-opacity hover:opacity-80"
            aria-label="이전 화면으로"
          >
            ‹
          </Link>
        </div>

        <div className="flex flex-col items-center px-6 pt-3 text-center lg:pt-4">
          <BrandMark variant="auth" size={brandSize} />
          <h1 className="hf-display mt-[18px] text-[23px] font-extrabold leading-tight tracking-[-0.01em] text-[#1E2621]">
            {title}
          </h1>
          <p className="mt-2 text-[12.5px] leading-[1.7] text-[#9A9F94]">{subtitle}</p>
        </div>

        <div className="px-6">{children}</div>
      </div>
    </div>
  );
}
