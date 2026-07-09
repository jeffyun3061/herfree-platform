import Image from 'next/image';
import { BRAND_LOGO, pickBrandLogo } from '@/domain/brand/assets';
import { PUBLIC_IMAGES } from '@/domain/assets/static';
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
const AUTH_LOGO_DIM = {
  sm: { width: 168, height: 72 },
  md: { width: 198, height: 84 },
  lg: { width: 232, height: 98 },
} as const;

export function BrandMark({
  size = 'md',
  className,
  showText = true,
  variant = 'default',
}: BrandMarkProps) {
  const resolvedVariant = variant === 'wrtn' ? 'auth' : variant;

  if (resolvedVariant === 'auth') {
    const dim = AUTH_LOGO_DIM[size];
    return (
      <div className={cn('flex shrink-0 items-center justify-center', className)}>
        <Image
          src={BRAND_LOGO.hfreeWordmark}
          alt="h.free"
          width={dim.width}
          height={dim.height}
          priority
          unoptimized
          className="h-auto w-auto max-w-[min(78vw,14.5rem)] object-contain"
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

  const iconSrc = PUBLIC_IMAGES.logoHApp;
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
