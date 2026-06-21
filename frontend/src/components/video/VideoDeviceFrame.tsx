import { cn } from '@/lib/cn';

type VideoDeviceFrameProps = {
  variant: 'phone' | 'desktop';
  label?: string;
  children: React.ReactNode;
  className?: string;
};

function BrowserChrome() {
  return (
    <div className="mb-2 flex items-center gap-1.5 px-0.5">
      <span className="h-2 w-2 rounded-full bg-primary/20" aria-hidden />
      <span className="h-2 w-2 rounded-full bg-primary/15" aria-hidden />
      <span className="h-2 w-2 rounded-full bg-primary/10" aria-hidden />
      <span className="ml-2 h-1.5 flex-1 rounded-full bg-primary/8" aria-hidden />
    </div>
  );
}

export function VideoDeviceFrame({ variant, label, children, className }: VideoDeviceFrameProps) {
  if (variant === 'phone') {
    return (
      <div className={cn('flex flex-col items-center gap-2', className)}>
        <div
          className="relative w-full max-w-[9.5rem] rounded-[1.35rem] border-2 border-dashed border-primary/20 bg-white/80 p-1.5 shadow-[0_4px_20px_rgba(15,80,80,0.06)] sm:max-w-[10.5rem]"
          aria-hidden
        >
          <div className="mb-1.5 flex justify-center">
            <div className="h-1 w-9 rounded-full bg-primary/12" />
          </div>
          <div className="overflow-hidden rounded-[0.85rem] border border-border/70 bg-black ring-1 ring-primary/5">
            {children}
          </div>
          <div className="mt-1.5 flex justify-center">
            <div className="h-1 w-10 rounded-full bg-primary/10" />
          </div>
        </div>
        {label ? (
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/70">
            {label}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn('flex w-full flex-col items-center gap-2', className)}>
      <div
        className="w-full rounded-xl border-2 border-dashed border-primary/20 bg-white/80 p-2.5 shadow-[0_8px_28px_rgba(15,80,80,0.07)] sm:p-3"
        aria-hidden
      >
        <BrowserChrome />
        <div className="overflow-hidden rounded-lg border border-border/70 bg-black ring-1 ring-primary/5">
          {children}
        </div>
        <div className="mx-auto mt-2.5 h-1.5 w-16 rounded-full bg-primary/10" />
      </div>
      {label ? (
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/70">
          {label}
        </span>
      ) : null}
    </div>
  );
}

export function VideoThumbnailPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex aspect-video w-full items-center justify-center bg-gradient-to-br from-primary/15 via-cream-dark to-primary/5',
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary/35" fill="currentColor" aria-hidden>
        <path d="M8 5v14l11-7z" />
      </svg>
    </div>
  );
}
