import React from 'react';
import { FileText, ChevronRight } from 'lucide-react';

export interface CanvasProjectBadgeProps {
  name?: string;
  description?: string;
  onClick?: () => void;
  className?: string;
}

export const CanvasProjectBadge: React.FC<CanvasProjectBadgeProps> = ({
  name = 'Karios Labs',
  description,
  onClick,
  className = ''
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('canvas:open-project-doc'));
    }
  };

  return (
    <button
      type="button"
      className={`canvas-project-badge ${className}`}
      onClick={handleClick}
      aria-label={`Project: ${name}`}
      title={description ? `${name} — ${description}` : name}
    >
      <span className="canvas-project-badge-icon" aria-hidden>
        <FileText size={13} />
      </span>
      <span className="canvas-project-badge-label">{name}</span>
      <span className="canvas-project-badge-chevron" aria-hidden>
        <ChevronRight size={12} />
      </span>
    </button>
  );
};

export default CanvasProjectBadge;
