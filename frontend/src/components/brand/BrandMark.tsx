import Image from 'next/image';
import { BRAND_LOGO, pickBrandLogo } from '@/domain/brand/assets';
import { cn } from '@/lib/cn';

type BrandMarkProps = {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
  /** auth: 로그인 h.free | default·light: 밝은 헤더 h. | onDark: 어두운 배경 | onPrimary: primary 바 */
  variant?: 'default' | 'auth' | 'onPrimary' | 'onDark' | 'light' | 'wrtn';
};

const ICON_SIZE = { sm: 28, md: 32, lg: 40 } as const;
const AUTH_SIZE = { sm: 96, md: 120, lg: 140 } as const;
const AUTH_LOGO_FRAME = {
  sm: 'h-[4.5rem] w-[min(70vw,10.5rem)]',
  md: 'h-[5.25rem] w-[min(74vw,12rem)]',
  lg: 'h-[6.5rem] w-[min(78vw,14.5rem)]',
} as const;
const AUTH_LOGO_SCALE = { sm: 'scale-[1.55]', md: 'scale-[1.65]', lg: 'scale-[1.75]' } as const;

export function BrandMark({
  size = 'md',
  className,
  showText = true,
  variant = 'default',
}: BrandMarkProps) {
  const resolvedVariant = variant === 'wrtn' ? 'auth' : variant;

  if (resolvedVariant === 'auth') {
    return (
      <div
        className={cn(
          'relative flex shrink-0 items-center justify-center overflow-hidden',
          AUTH_LOGO_FRAME[size],
          className,
        )}
      >
        <Image
          src={BRAND_LOGO.hfreeWordmark}
          alt="h.free"
          fill
          priority
          unoptimized
          sizes="(max-width: 430px) 78vw, 232px"
          className={cn('object-contain object-center', AUTH_LOGO_SCALE[size])}
        />
      </div>
    );
  }

  if (resolvedVariant === 'onDark') {
    const src = pickBrandLogo(showText ? 'hfree' : 'hMark', 'dark');
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

  const iconSrc = pickBrandLogo('hMark', 'light');
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
        herpfree
      </span>
    </div>
  );
}
