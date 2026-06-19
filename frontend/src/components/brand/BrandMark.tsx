import Image from 'next/image';
import { BRAND_LOGO } from '@/domain/brand/assets';
import { cn } from '@/lib/cn';

type BrandMarkProps = {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
  /** auth: 로그인 h.free | default: 헤더 아이콘 | onDark: 어두운 배경 | onPrimary·light: 밝은/네이비 배경 */
  variant?: 'default' | 'auth' | 'onPrimary' | 'onDark' | 'light' | 'wrtn';
};

const ICON_SIZE = { sm: 28, md: 32, lg: 40 } as const;
const AUTH_SIZE = { sm: 96, md: 120, lg: 140 } as const;

export function BrandMark({
  size = 'md',
  className,
  showText = true,
  variant = 'default',
}: BrandMarkProps) {
  const resolvedVariant = variant === 'wrtn' ? 'auth' : variant;

  if (resolvedVariant === 'auth') {
    const dim = AUTH_SIZE[size];
    return (
      <Image
        src={BRAND_LOGO.hfreeOnPrimary}
        alt="h.free"
        width={dim}
        height={dim}
        priority
        className={cn('h-auto w-auto max-w-[min(100%,10rem)]', className)}
      />
    );
  }

  if (resolvedVariant === 'onDark') {
    const src = showText ? BRAND_LOGO.hfreeOnDark : BRAND_LOGO.hMarkOnDark;
    const dim = showText ? AUTH_SIZE[size] : ICON_SIZE[size];
    return (
      <Image
        src={src}
        alt={showText ? 'h.free' : 'h.'}
        width={dim}
        height={dim}
        className={cn('h-auto w-auto', showText ? 'max-w-[min(100%,10rem)]' : 'rounded-full', className)}
      />
    );
  }

  const iconSrc = BRAND_LOGO.hMarkOnPrimary;
  const iconDim = ICON_SIZE[size];

  if (!showText) {
    return (
      <Image
        src={iconSrc}
        alt="h."
        width={iconDim}
        height={iconDim}
        className={cn('rounded-full', className)}
      />
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Image
        src={iconSrc}
        alt=""
        width={iconDim}
        height={iconDim}
        className="rounded-full"
        aria-hidden
      />
      <span
        className={cn(
          'font-bold tracking-tight text-ink',
          resolvedVariant === 'onPrimary' && 'text-white',
          resolvedVariant === 'light' && 'text-navy-foreground',
          size === 'sm' ? 'text-base' : size === 'lg' ? 'text-xl' : 'text-lg',
        )}
      >
        herfree
      </span>
    </div>
  );
}
