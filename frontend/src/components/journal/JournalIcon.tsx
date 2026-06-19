import Image from 'next/image';
import { JOURNAL_ICONS } from '@/domain/journal/assets';
import { cn } from '@/lib/cn';

type JournalIconName = keyof typeof JOURNAL_ICONS;

type JournalIconProps = {
  name: JournalIconName;
  className?: string;
  size?: number;
};

export function JournalIcon({ name, className, size = 20 }: JournalIconProps) {
  const src = JOURNAL_ICONS[name];
  if (!src) return null;

  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      aria-hidden
      className={cn('shrink-0', className)}
    />
  );
}
