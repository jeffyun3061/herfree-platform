import Link from 'next/link';
import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';
type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: 'bg-[#0B3B36] text-white shadow-[0_10px_22px_-14px_rgba(11,59,54,.7)] hover:bg-[#0F4F48]',
  secondary: 'bg-white text-[#1E2621] ring-1 ring-[#ECE5D8] hover:bg-[#F6F1E8]',
  ghost: 'bg-transparent text-primary hover:bg-primary/5',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  dark: 'bg-[#07251F] text-white hover:bg-[#0B3B36]',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-sm rounded-xl',
  md: 'px-4 py-3 text-sm rounded-xl',
  lg: 'px-5 py-3.5 text-base rounded-xl',
};

function buttonClassName({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}) {
  return cn(
    'inline-flex items-center justify-center font-semibold transition-colors',
    VARIANT_STYLES[variant],
    SIZE_STYLES[size],
    fullWidth && 'w-full',
    className,
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
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
      className={cn(buttonClassName({ variant, size, fullWidth, className }), 'disabled:cursor-not-allowed disabled:opacity-50')}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

type ButtonLinkProps = {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
}: ButtonLinkProps) {
  return (
    <Link href={href} className={buttonClassName({ variant, size, fullWidth, className })}>
      {children}
    </Link>
  );
}
