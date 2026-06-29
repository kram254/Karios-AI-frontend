import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './canvas.css';

export interface CanvasPopoverItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  meta?: string;
  onClick?: () => void;
  href?: string;
  divider?: boolean;
  destructive?: boolean;
  disabled?: boolean;
}

interface CanvasPopoverProps {
  open: boolean;
  onClose: () => void;
  anchorRect?: DOMRect | null;
  title?: string;
  items?: CanvasPopoverItem[];
  children?: React.ReactNode;
  className?: string;
  width?: number;
}

export const CanvasPopover: React.FC<CanvasPopoverProps> = ({
  open,
  onClose,
  anchorRect,
  title,
  items,
  children,
  className = '',
  width = 380
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => document.addEventListener('mousedown', onClick), 0);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  if (!open) return null;

  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 720;
  const top = anchorRect ? Math.min(viewportH - 360, anchorRect.bottom + 10) : 64;
  const right = anchorRect ? Math.max(12, viewportW - anchorRect.right) : 18;

  const handleItemClick = (item: CanvasPopoverItem) => {
    if (item.disabled) return;
    if (item.onClick) item.onClick();
    if (item.href && typeof window !== 'undefined') {
      window.location.assign(item.href);
    }
    onClose();
  };

  const node = (
    <div
      ref={popoverRef}
      className={`canvas-popover ${className}`}
      style={{
        position: 'fixed',
        top: `${top}px`,
        right: `${right}px`,
        width: `${width}px`,
        zIndex: 1200
      }}
      role="menu"
    >
      {title && <div className="canvas-popover-title">{title}</div>}
      {items && items.length > 0 && (
        <div className="canvas-popover-content">
          {items.map((item) =>
            item.divider ? (
              <div key={item.id} className="canvas-popover-divider" aria-hidden />
            ) : (
              <button
                key={item.id}
                type="button"
                className={`canvas-popover-item ${item.destructive ? 'canvas-popover-item-destructive' : ''}`}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                role="menuitem"
              >
                {item.icon && <span className="canvas-popover-item-icon">{item.icon}</span>}
                <span className="canvas-popover-item-label">{item.label}</span>
                {item.meta && <span className="canvas-popover-item-meta">{item.meta}</span>}
              </button>
            )
          )}
        </div>
      )}
      {children}
    </div>
  );

  if (typeof document === 'undefined') return node;
  return createPortal(node, document.body);
};

export default CanvasPopover;