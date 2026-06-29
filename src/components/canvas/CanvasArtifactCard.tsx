import React from 'react';
import { Maximize2, FileText, Code2, Image as ImageIcon, FileCode, BookOpen } from 'lucide-react';
import { Artifact } from '../../services/artifactManager.service';
import './canvas.css';

interface CanvasArtifactCardProps {
  artifact: Artifact;
  onExpand?: (artifact: Artifact) => void;
  onClick?: (artifact: Artifact) => void;
  className?: string;
  style?: React.CSSProperties;
}

const getArtifactIcon = (type?: string) => {
  switch ((type || '').toLowerCase()) {
    case 'code':
    case 'javascript':
    case 'typescript':
    case 'python':
      return <Code2 size={14} />;
    case 'html':
    case 'react':
    case 'jsx':
    case 'tsx':
      return <FileCode size={14} />;
    case 'image':
    case 'svg':
      return <ImageIcon size={14} />;
    case 'document':
    case 'markdown':
    case 'doc':
      return <BookOpen size={14} />;
    default:
      return <FileText size={14} />;
  }
};

const truncate = (text: string, max = 320): string => {
  if (!text) return '';
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '…';
};

const renderPreview = (artifact: any): React.ReactNode => {
  const type = (artifact.type || '').toLowerCase();
  const content: string = artifact.content || '';

  if (type === 'image' || type === 'svg') {
    if (content.startsWith('http') || content.startsWith('data:')) {
      return (
        <div
          className="canvas-card-cover"
          style={{ backgroundImage: `url("${content}")` }}
        />
      );
    }
    if (type === 'svg') {
      return (
        <div
          className="canvas-card-cover"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }
  }

  if (type === 'html' || type === 'react' || type === 'jsx' || type === 'tsx') {
    return (
      <pre style={{ margin: 0, fontSize: '11px', whiteSpace: 'pre-wrap', fontFamily: 'JetBrains Mono, Menlo, monospace', color: 'var(--text-secondary, #94a3b8)' }}>
        {truncate(content, 420)}
      </pre>
    );
  }

  return <div>{truncate(content, 420)}</div>;
};

export const CanvasArtifactCard: React.FC<CanvasArtifactCardProps> = ({
  artifact,
  onExpand,
  onClick,
  className = '',
  style
}) => {
  const a: any = artifact;
  const title = a.title || a.name || 'Untitled artifact';

  const handleCardClick = () => {
    if (onClick) onClick(artifact);
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onExpand) onExpand(artifact);
  };

  return (
    <div
      className={`canvas-card ${className}`}
      style={style}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      <div className="canvas-card-header">
        <div className="canvas-card-title">
          <span className="canvas-card-title-icon">{getArtifactIcon(a.type)}</span>
          <span>{title}</span>
        </div>
        <div className="canvas-card-actions">
          <button
            className="canvas-card-action"
            onClick={handleExpandClick}
            aria-label="Expand"
            title="Expand"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>
      <div className="canvas-card-body">
        {renderPreview(a)}
      </div>
    </div>
  );
};

export default CanvasArtifactCard;
