import Image from 'next/image';
import { getJournalIconSrc, type JournalIconName } from '@/domain/assets/static';
import { cn } from '@/lib/cn';

type JournalIconProps = {
  name: JournalIconName;
  className?: string;
  size?: number;
};

export function JournalIcon({ name, className, size = 20 }: JournalIconProps) {
  const src = getJournalIconSrc(name);

  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      aria-hidden
      unoptimized
      className={cn('shrink-0 object-contain', className)}
    />
  );
}
