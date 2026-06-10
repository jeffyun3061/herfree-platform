import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-light',
  secondary: 'bg-cream-dark text-cream-foreground hover:bg-border',
  ghost: 'bg-transparent text-primary hover:bg-cream-dark',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
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
        'inline-flex items-center justify-center rounded-2xl font-medium transition-colors',
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
