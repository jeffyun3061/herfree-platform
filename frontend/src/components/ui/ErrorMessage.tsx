import { cn } from '@/lib/cn';

type ErrorMessageProps = {
  message: string;
  className?: string;
};

export function ErrorMessage({ message, className }: ErrorMessageProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700',
        className,
      )}
    >
      {message}
    </div>
  );
}
