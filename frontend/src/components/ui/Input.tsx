import { cn } from '@/lib/cn';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  required?: boolean;
  hint?: React.ReactNode;
  showCharCount?: boolean;
  maxCharCount?: number;
};

export function Input({
  label,
  error,
  required,
  hint,
  showCharCount,
  maxCharCount,
  className,
  id,
  value,
  'aria-describedby': ariaDescribedBy,
  ...props
}: InputProps) {
  const inputId = id ?? label;
  const strValue = typeof value === 'string' ? value : '';
  const count = strValue.length;
  const max = maxCharCount ?? props.maxLength;
  const errorId = error && inputId ? `${inputId}-error` : undefined;
  const describedBy = [ariaDescribedBy, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="wrtn-field">
      {label && (
        <div className="flex items-center gap-1">
          <label htmlFor={inputId} className="wrtn-label">
            {label}
            {required && <span className="wrtn-required">*</span>}
          </label>
          {hint}
        </div>
      )}
      <input
        id={inputId}
        value={value}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={cn(
          'wrtn-input',
          error && 'border-red-400 focus:border-red-400',
          className,
        )}
        {...props}
      />
      {showCharCount && max !== undefined && (
        <p className="wrtn-char-count">
          {count}/{max}
        </p>
      )}
      {error && <p id={errorId} className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
