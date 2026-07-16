import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  required?: boolean;
  containerClassName?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({
  label,
  error,
  required,
  containerClassName,
  className,
  id,
  ...props
}, ref) {
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
        ref={ref}
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
});
