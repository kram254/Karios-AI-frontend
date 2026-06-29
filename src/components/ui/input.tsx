import * as React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      'neon-input w-full px-3 py-2 text-sm placeholder:text-[color:var(--text-muted)] focus:outline-none',
      className
    )}
    {...props}
  />
));

Input.displayName = 'Input';
