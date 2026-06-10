import { cn } from '@/lib/cn';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const textareaId = id ?? label;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-cream-foreground">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          'min-h-[120px] w-full resize-y rounded-2xl border border-border bg-card px-4 py-3 text-sm',
          'placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
          error && 'border-red-400 focus:border-red-400 focus:ring-red-200',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
