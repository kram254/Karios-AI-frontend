import React, { useState } from 'react';
import { ChevronRight, ChevronDown, MoreHorizontal, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import './canvas.css';

export type SubagentStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface SubagentLogEntry {
  id?: string;
  text: string;
  type?: 'info' | 'tool' | 'reasoning' | 'output';
  timestamp?: number;
}

interface SubagentExecutionCardProps {
  name: string;
  role?: string;
  status: SubagentStatus;
  statusLabel?: string;
  modelBadge?: string;
  avatarColor?: string;
  avatarGlyph?: string;
  logs?: SubagentLogEntry[];
  defaultExpanded?: boolean;
  onMore?: () => void;
  className?: string;
}

const renderStatusGlyph = (status: SubagentStatus): React.ReactNode => {
  switch (status) {
    case 'running':
      return <Loader2 size={12} className="subagent-card-status-icon subagent-card-spin" />;
    case 'completed':
      return <CheckCircle2 size={12} className="subagent-card-status-icon subagent-card-status-done" />;
    case 'failed':
      return <AlertCircle size={12} className="subagent-card-status-icon subagent-card-status-failed" />;
    case 'queued':
    default:
      return <span className="subagent-card-status-dot" />;
  }
};

const defaultStatusLabel = (status: SubagentStatus): string => {
  switch (status) {
    case 'running':
      return 'Running command';
    case 'completed':
      return 'Done';
    case 'failed':
      return 'Failed';
    case 'queued':
    default:
      return 'Queued';
  }
};

const initialFromName = (name: string): string => {
  const trimmed = (name || '').trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
};

export const SubagentExecutionCard: React.FC<SubagentExecutionCardProps> = ({
  name,
  role,
  status,
  statusLabel,
  modelBadge,
  avatarColor = '#3b82f6',
  avatarGlyph,
  logs = [],
  defaultExpanded = false,
  onMore,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const computedLabel = statusLabel || defaultStatusLabel(status);
  const hasLogs = logs.length > 0;

  const handleToggle = () => setIsExpanded((prev) => !prev);

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMore) onMore();
  };

  return (
    <div className={`subagent-card subagent-card-${status} ${className}`}>
      <div
        className="subagent-card-header"
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
      >
        <span className="subagent-card-chevron" aria-hidden>
          {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </span>

        <span className="subagent-card-avatar" style={{ background: avatarColor }} aria-hidden>
          {avatarGlyph || initialFromName(name)}
        </span>

        <span className="subagent-card-name">{name}</span>

        {role && (
          <>
            <span className="subagent-card-sep" aria-hidden>·</span>
            <span className="subagent-card-role">{role}</span>
          </>
        )}

        <span className="subagent-card-sep" aria-hidden>·</span>
        <span className="subagent-card-status-text">
          {renderStatusGlyph(status)}
          <span className="subagent-card-status-label">{computedLabel}</span>
        </span>

        <div className="subagent-card-spacer" />

        {modelBadge && (
          <span className="subagent-card-model-badge">{modelBadge}</span>
        )}

        <button
          type="button"
          className="subagent-card-more"
          onClick={handleMoreClick}
          aria-label="More actions"
          title="More"
        >
          <MoreHorizontal size={14} />
        </button>
      </div>

      {isExpanded && (
        <div className="subagent-card-body">
          {hasLogs ? (
            <ul className="subagent-card-log-list">
              {logs.map((log, i) => (
                <li
                  key={log.id || i}
                  className={`subagent-card-log-row subagent-card-log-${log.type || 'info'}`}
                >
                  <span className="subagent-card-log-bullet" aria-hidden />
                  <span className="subagent-card-log-text">{log.text}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="subagent-card-empty">
              {status === 'running'
                ? 'Working… details will appear here as the subagent reports.'
                : status === 'completed'
                ? 'No log details captured.'
                : status === 'failed'
                ? 'No error details available.'
                : 'Awaiting start.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubagentExecutionCard;
