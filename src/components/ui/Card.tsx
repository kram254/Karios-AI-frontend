import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** Adds a hover glow and lift effect. Also makes the card cursor-pointer. */
  hover?: boolean;
  onClick?: () => void;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', hover = false, onClick }, ref) => {
    const hoverClasses = hover
      ? 'cursor-pointer hover:border-brand-cyan/25 hover:shadow-[0_0_28px_rgba(0,243,255,0.12)] hover:-translate-y-0.5'
      : '';

    return (
      <div
        ref={ref}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
        className={[
          'rounded-xl border border-white/[0.07] bg-surface-raised transition-all duration-200',
          hoverClasses,
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
export type { CardProps };
