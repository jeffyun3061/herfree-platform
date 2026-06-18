import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-light',
  secondary: 'bg-white text-ink ring-1 ring-wrtn-border hover:bg-wrtn-bg',
  ghost: 'bg-transparent text-primary hover:bg-primary/5',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  dark: 'bg-ink text-white hover:bg-navy-light',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-sm rounded-xl',
  md: 'px-4 py-3 text-sm rounded-xl',
  lg: 'px-5 py-3.5 text-base rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        fullWidth && 'w-full',
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
