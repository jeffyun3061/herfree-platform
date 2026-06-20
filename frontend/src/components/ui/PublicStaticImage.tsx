import Image from 'next/image';
import { cn } from '@/lib/cn';

type PublicStaticImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  className?: string;
};

/**
 * `public/` 정적 이미지 전용 래퍼.
 * - decorative 이미지는 alt="" + aria-hidden
 * - 로컬 정적 파일은 unoptimized (빌드·캐시 이슈 방지)
 */
export function PublicStaticImage({
  src,
  alt,
  width,
  height,
  fill,
  priority,
  sizes,
  className,
}: PublicStaticImageProps) {
  const isDecorative = alt === '';

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        unoptimized
        aria-hidden={isDecorative || undefined}
        className={className}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 1}
      height={height ?? 1}
      priority={priority}
      unoptimized
      aria-hidden={isDecorative || undefined}
      className={cn(className)}
    />
  );
}
