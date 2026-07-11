'use client';

import Link from 'next/link';
import { BrandMark } from '@/components/brand/BrandMark';

type AuthScreenShellProps = {
  backHref?: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthScreenShell({
  backHref = '/',
  title,
  subtitle,
  children,
}: AuthScreenShellProps) {
  return (
    <div className="min-h-screen bg-[#F3EDE3]">
      <div className="flex min-h-screen flex-col px-0 pb-11 pt-[54px]">
        <div className="px-3.5">
          <Link
            href={backHref}
            className="inline-flex text-[24px] leading-none text-[#5C645A] transition-opacity hover:opacity-80"
            aria-label="이전 화면으로"
          >
            ‹
          </Link>
        </div>

        <div className="flex flex-col items-center px-6 pt-[18px] text-center">
          <BrandMark variant="auth" size="lg" />
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
