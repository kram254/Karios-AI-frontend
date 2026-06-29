import React from 'react';
import { Loader2, Terminal, CheckCircle2, AlertCircle, Brain, PauseCircle } from 'lucide-react';
import { ChatStatusKind } from '../../services/chatStatusRegistry.service';
import './canvas.css';

interface ThreadStatusBadgeProps {
  kind?: ChatStatusKind;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

const kindLabels: Record<ChatStatusKind, string> = {
  idle: 'Idle',
  thinking: 'Thinking',
  running: 'Running command',
  streaming: 'Streaming',
  paused: 'Paused',
  completed: 'Finished',
  failed: 'Failed'
};

const renderIcon = (kind: ChatStatusKind, size: number) => {
  switch (kind) {
    case 'thinking':
      return <Brain size={size} className="thread-status-icon thread-status-icon-thinking" />;
    case 'running':
      return <Terminal size={size} className="thread-status-icon thread-status-icon-running" />;
    case 'streaming':
      return <Loader2 size={size} className="thread-status-icon thread-status-icon-streaming" />;
    case 'paused':
      return <PauseCircle size={size} className="thread-status-icon thread-status-icon-paused" />;
    case 'completed':
      return <CheckCircle2 size={size} className="thread-status-icon thread-status-icon-completed" />;
    case 'failed':
      return <AlertCircle size={size} className="thread-status-icon thread-status-icon-failed" />;
    case 'idle':
    default:
      return null;
  }
};

export const ThreadStatusBadge: React.FC<ThreadStatusBadgeProps> = ({
  kind,
  label,
  className = '',
  size = 'sm'
}) => {
  if (!kind || kind === 'idle') return null;

  const iconSize = size === 'sm' ? 11 : 13;
  const finalLabel = label || kindLabels[kind] || kind;

  return (
    <span
      className={`thread-status-badge thread-status-badge-${kind} thread-status-badge-${size} ${className}`}
      role="status"
      aria-label={finalLabel}
    >
      {renderIcon(kind, iconSize)}
      <span className="thread-status-text">{finalLabel}</span>
    </span>
  );
};

export default ThreadStatusBadge;
