import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type PageFrameProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

/** Shared page width and shell spacing; feature pages own their inner layout. */
export function PageFrame({ children, className, contentClassName }: PageFrameProps) {
  return (
    <div className={cn('hf-page-frame', className)}>
      <div className={cn('mx-auto w-full max-w-app', contentClassName)}>{children}</div>
    </div>
  );
}
