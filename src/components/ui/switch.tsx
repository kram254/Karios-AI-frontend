import * as React from 'react';
import { cn } from '../../utils/cn';

export interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked, onCheckedChange, disabled, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      data-state={checked ? 'checked' : 'unchecked'}
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        onCheckedChange(!checked);
      }}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-white/15 bg-white/5 transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-neon-cyan/20 border-neon-cyan/30' : '',
        className
      )}
      {...props}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white/70 shadow transition-transform',
          checked ? 'translate-x-5 bg-neon-cyan/80' : 'translate-x-0.5'
        )}
      />
    </button>
  )
);

Switch.displayName = 'Switch';
