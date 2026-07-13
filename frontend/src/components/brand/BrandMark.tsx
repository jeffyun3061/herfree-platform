import Image from 'next/image';
import { BRAND_LOGO } from '@/domain/brand/assets';
import { cn } from '@/lib/cn';

type BrandMarkProps = {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** @deprecated 로고 옆 텍스트는 사용하지 않습니다. h. 마크만 표시됩니다. */
  showText?: boolean;
  /** auth: 로그인·회원가입 h. | default·light: 밝은 배경 h. | onDark: 어두운 배경 */
  variant?: 'default' | 'auth' | 'onPrimary' | 'onDark' | 'light' | 'wrtn';
};

const MARK_SIZE = { sm: 28, md: 36, lg: 44 } as const;
const AUTH_MARK_SIZE = { sm: 64, md: 76, lg: 88 } as const;

export function BrandMark({
  size = 'md',
  className,
  variant = 'default',
}: BrandMarkProps) {
  const resolvedVariant = variant === 'wrtn' ? 'auth' : variant;

  if (resolvedVariant === 'auth') {
    const dim = AUTH_MARK_SIZE[size];
    return (
      <div className={cn('flex shrink-0 items-center justify-center', className)}>
        <Image
          src={BRAND_LOGO.hMarkOnPrimary}
          alt="h."
          width={dim}
          height={dim}
          priority
          unoptimized
          className="rounded-full"
        />
      </div>
    );
  }

  if (resolvedVariant === 'onDark') {
    const dim = MARK_SIZE[size];
    return (
      <Image
        src={BRAND_LOGO.hMarkOnDark}
        alt="h."
        width={dim}
        height={dim}
        className={cn('rounded-full', className)}
      />
    );
  }

  const dim = MARK_SIZE[size];
  return (
    <Image
      src={BRAND_LOGO.hMarkOnPrimary}
      alt="h."
      width={dim}
      height={dim}
      className={cn('rounded-full', className)}
    />
  );
}
