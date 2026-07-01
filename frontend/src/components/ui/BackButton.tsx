'use client';

import { usePathname, useRouter } from 'next/navigation';
import { navigateBack } from '@/lib/navigateBack';
import { BackChevronIcon } from '@/components/ui/ShellIcons';
import { cn } from '@/lib/cn';

type BackButtonProps = {
  backHref?: string;
  fallbackHref?: string;
  onClick?: () => void;
  className?: string;
  iconClassName?: string;
  size?: 'sm' | 'md';
  label?: string;
};

export function BackButton({
  backHref,
  fallbackHref,
  onClick,
  className,
  iconClassName,
  size = 'md',
  label = '뒤로 가기',
}: BackButtonProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    navigateBack(router, { pathname, backHref, fallbackHref });
  };

  return (
    <button
      type="button"
      aria-label={label}
      onClick={handleClick}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full text-[#5B6864] transition-colors hover:bg-[#F4F6F5] hover:text-[#0B3B36]',
        size === 'sm' ? 'h-8 w-8' : 'h-9 w-9',
        className,
      )}
    >
      <BackChevronIcon className={iconClassName} />
    </button>
  );
}
