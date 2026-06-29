import React from 'react';
import { Globe, Maximize2, X, MonitorOff, Loader2 } from 'lucide-react';
import './canvas.css';

export type BrowserSessionStatus = 'idle' | 'connecting' | 'live' | 'paused' | 'ended' | 'error';

interface BrowserSessionCardProps {
  title?: string;
  url?: string;
  status?: BrowserSessionStatus;
  screenshot?: string;
  iframeUrl?: string;
  endedMessage?: string;
  onExpand?: () => void;
  onClose?: () => void;
  onClick?: () => void;
  className?: string;
  size?: 'compact' | 'medium' | 'large';
  children?: React.ReactNode;
}

const renderViewport = (
  status: BrowserSessionStatus,
  screenshot?: string,
  iframeUrl?: string,
  endedMessage?: string,
  children?: React.ReactNode
): React.ReactNode => {
  if (children) return <div className="browser-session-content">{children}</div>;

  if (status === 'ended') {
    return (
      <div className="browser-session-empty">
        <MonitorOff size={28} className="browser-session-empty-icon" aria-hidden />
        <div className="browser-session-empty-text">
          {endedMessage || 'Browser session has ended.'}
        </div>
      </div>
    );
  }

  if (status === 'connecting') {
    return (
      <div className="browser-session-empty">
        <Loader2 size={28} className="browser-session-empty-icon browser-session-spin" aria-hidden />
        <div className="browser-session-empty-text">Connecting to browser…</div>
      </div>
    );
  }

  if (iframeUrl && (status === 'live' || status === 'paused')) {
    return (
      <iframe
        src={iframeUrl}
        title="Browser session"
        className="browser-session-iframe"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
      />
    );
  }

  if (screenshot) {
    return (
      <img
        src={screenshot}
        alt="Browser screenshot"
        className="browser-session-screenshot"
      />
    );
  }

  return (
    <div className="browser-session-empty">
      <Globe size={28} className="browser-session-empty-icon" aria-hidden />
      <div className="browser-session-empty-text">No browser activity yet.</div>
    </div>
  );
};

export const BrowserSessionCard: React.FC<BrowserSessionCardProps> = ({
  title = 'Browser Session',
  url,
  status = 'live',
  screenshot,
  iframeUrl,
  endedMessage,
  onExpand,
  onClose,
  onClick,
  className = '',
  size = 'medium',
  children
}) => {
  const handleCardClick = () => {
    if (onClick) onClick();
  };

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onExpand) onExpand();
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClose) onClose();
  };

  const isInteractive = !!onClick;

  return (
    <div
      className={`browser-session-card browser-session-${size} browser-session-${status} ${className}`}
      onClick={isInteractive ? handleCardClick : undefined}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={(e) => {
        if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      <div className="browser-session-header">
        <div className="browser-session-traffic">
          <span className="browser-session-dot browser-session-dot-red" />
          <span className="browser-session-dot browser-session-dot-yellow" />
          <span className="browser-session-dot browser-session-dot-green" />
        </div>

        <div className="browser-session-title">
          <Globe size={11} className="browser-session-title-icon" aria-hidden />
          <span>{title}</span>
          {status === 'live' && <span className="browser-session-live-pulse" aria-label="Live" />}
        </div>

        {url && <div className="browser-session-url" title={url}>{url}</div>}

        <div className="browser-session-actions">
          {onExpand && (
            <button
              className="browser-session-action"
              onClick={handleExpand}
              aria-label="Expand"
              title="Expand"
            >
              <Maximize2 size={12} />
            </button>
          )}
          {onClose && (
            <button
              className="browser-session-action"
              onClick={handleClose}
              aria-label="Close"
              title="Close"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="browser-session-viewport">
        {renderViewport(status, screenshot, iframeUrl, endedMessage, children)}
      </div>
    </div>
  );
};

export default BrowserSessionCard;
