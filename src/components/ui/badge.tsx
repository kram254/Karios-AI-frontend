import * as React from 'react';
import { cn } from '../../utils/cn';

export type BadgeVariant = 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClassName: Record<BadgeVariant, string> = {
  default: 'bg-white/10 text-white border border-white/10',
  secondary: 'bg-neon-purple/15 text-white border border-neon-purple/20',
  outline: 'bg-transparent text-[color:var(--text-secondary)] border border-white/15',
  success: 'bg-neon-green/15 text-neon-green border border-neon-green/25',
  warning: 'bg-neon-orange/15 text-neon-orange border border-neon-orange/25',
  destructive: 'bg-red-500/15 text-red-200 border border-red-500/25',
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant = 'default', ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-md',
      variantClassName[variant],
      className
    )}
    {...props}
  />
));

Badge.displayName = 'Badge';
