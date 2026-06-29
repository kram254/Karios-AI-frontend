import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'cyan';
  size?: 'sm' | 'md';
  className?: string;
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  default:  'bg-white/[0.07] text-white/60 border-white/10',
  success:  'bg-status-success/10 text-status-success border-status-success/20',
  warning:  'bg-status-warning/10 text-status-warning border-status-warning/20',
  error:    'bg-status-error/10 text-status-error border-status-error/20',
  info:     'bg-status-info/10 text-status-info border-status-info/20',
  cyan:     'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20',
};

const sizeClasses: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => (
  <span
    className={[
      'inline-flex items-center rounded-full border font-medium leading-none',
      variantClasses[variant],
      sizeClasses[size],
      className,
    ]
      .filter(Boolean)
      .join(' ')}
  >
    {children}
  </span>
);

export default Badge;
export type { BadgeProps };
