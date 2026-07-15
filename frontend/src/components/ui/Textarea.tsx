import { cn } from '@/lib/cn';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  required?: boolean;
  containerClassName?: string;
};

export function Textarea({
  label,
  error,
  required,
  containerClassName,
  className,
  id,
  ...props
}: TextareaProps) {
  const textareaId = id ?? label;

  return (
    <div className={cn('wrtn-field', containerClassName)}>
      {label && (
        <label htmlFor={textareaId} className="wrtn-label">
          {label}
          {required && <span className="wrtn-required">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          'wrtn-textarea',
          error && 'border-red-400 focus:border-red-400',
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
