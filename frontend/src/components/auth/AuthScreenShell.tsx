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
      <div className="auth-screen !min-h-0 bg-transparent px-5 pb-10" style={{ paddingTop: 'var(--hf-page-pt)' }}>
        <div className="px-1">
          <Link
            href={backHref}
            className="inline-flex text-[24px] leading-none text-[#6E7671] transition-opacity hover:opacity-80"
            aria-label="이전 화면으로"
          >
            ‹
          </Link>
        </div>

        <div className="flex flex-col items-center px-1 pt-[18px] text-center">
          <BrandMark variant="auth" size="lg" />
          <h1 className="hf-display mt-[18px] text-[23px] font-extrabold leading-tight tracking-[-0.01em] text-[#15201D]">
            {title}
          </h1>
          <p className="mt-2 text-[12.5px] leading-[1.7] text-[#9A9F94]">{subtitle}</p>
        </div>

        {children}
      </div>
    </div>
  );
}
