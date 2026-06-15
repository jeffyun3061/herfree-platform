import Link from 'next/link';
import { cn } from '@/lib/cn';

type FlowGuideBannerProps = {
  title: string;
  description: string;
  link?: { href: string; label: string };
  variant?: 'default' | 'accent';
  className?: string;
};

export function FlowGuideBanner({
  title,
  description,
  link,
  variant = 'default',
  className,
}: FlowGuideBannerProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border px-4 py-3 text-sm leading-relaxed',
        variant === 'accent'
          ? 'border-primary/25 bg-primary/5 text-ink'
          : 'border-border/80 bg-card text-muted',
        className,
      )}
    >
      <p className="font-medium text-ink">{title}</p>
      <p className="mt-1">{description}</p>
      {link && (
        <Link href={link.href} className="mt-2 inline-block text-xs font-medium text-primary">
          {link.label} →
        </Link>
      )}
    </div>
  );
}
