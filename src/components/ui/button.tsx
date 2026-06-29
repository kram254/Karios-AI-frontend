import * as React from 'react';
import { cn } from '../../utils/cn';

export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClassName: Record<ButtonVariant, string> = {
  default: 'neon-btn-primary',
  secondary: 'neon-btn-secondary bg-white/5 hover:bg-white/10',
  outline: 'bg-transparent border border-neon-purple/30 hover:bg-white/5',
  ghost: 'bg-transparent hover:bg-white/5',
  destructive: 'bg-red-500/15 border border-red-500/30 hover:bg-red-500/20 text-red-200',
};

const sizeClassName: Record<ButtonSize, string> = {
  default: 'h-10 px-4',
  sm: 'h-9 px-3 text-sm',
  lg: 'h-11 px-5',
  icon: 'h-10 w-10 p-0',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', type, ...props }, ref) => (
    <button
      ref={ref}
      type={type ?? 'button'}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:pointer-events-none',
        sizeClassName[size],
        variantClassName[variant],
        className
      )}
      {...props}
    />
  )
);

Button.displayName = 'Button';
