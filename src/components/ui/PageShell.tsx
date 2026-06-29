import React from 'react';
import { motion } from 'framer-motion';

interface PageShellProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /**
   * When true (default), constrains content to max-w-7xl with horizontal
   * padding and auto centering. Set to false for full-bleed layouts.
   */
  constrained?: boolean;
}

const shellVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
  },
};

const PageShell: React.FC<PageShellProps> = ({
  title,
  subtitle,
  actions,
  children,
  className = '',
  constrained = true,
}) => {
  const hasHeader = Boolean(title);

  return (
    <motion.div
      className={`min-h-full bg-surface-base text-white overflow-y-auto ${className}`}
      variants={shellVariants}
      initial="hidden"
      animate="visible"
    >
      <div
        className={
          constrained
            ? 'px-6 md:px-10 py-8 max-w-7xl mx-auto'
            : 'px-6 md:px-10 py-8'
        }
      >
        {hasHeader && (
          <>
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-white leading-tight truncate">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-white/40 mt-1 leading-relaxed">
                    {subtitle}
                  </p>
                )}
              </div>

              {actions && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {actions}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-b border-white/[0.06] mb-6" />
          </>
        )}

        {children}
      </div>
    </motion.div>
  );
};

export default PageShell;
