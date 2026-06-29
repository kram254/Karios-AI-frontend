import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Globe, ExternalLink, Download, History, MessageSquare, Check } from 'lucide-react';
import { Artifact } from '../../services/artifactManager.service';
import './canvas.css';

interface VersionEntry {
  id: string;
  name: string;
  date?: string;
  isOriginal?: boolean;
}

interface ThreadRef {
  id: string;
  name: string;
}

interface ArtifactFullscreenModalProps {
  artifact: Artifact | null;
  open: boolean;
  onClose: () => void;
  onPublish?: (artifact: Artifact) => void;
  onOpenInNewTab?: (artifact: Artifact) => void;
  onDownload?: (artifact: Artifact) => void;
  versions?: VersionEntry[];
  threads?: ThreadRef[];
  eyebrow?: string[];
  deck?: string;
  meta?: { label: string; value: string }[];
  source?: string;
  date?: string;
  bodyHtml?: string;
}

const formatLongDate = (timestamp?: number): string => {
  if (!timestamp) return '';
  try {
    const d = new Date(timestamp);
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }) + ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
};

const renderBody = (artifact: any, bodyHtml?: string): React.ReactNode => {
  if (bodyHtml) {
    return <div className="artifact-fullscreen-body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />;
  }
  const content: string = artifact.content || '';
  const type = (artifact.type || '').toLowerCase();
  if (type === 'html' || type === 'react' || type === 'jsx' || type === 'tsx') {
    return (
      <div className="artifact-fullscreen-body">
        <pre>{content}</pre>
      </div>
    );
  }
  const paragraphs = content.split(/\n{2,}/).filter(Boolean);
  return (
    <div className="artifact-fullscreen-body">
      {paragraphs.map((p, i) => {
        if (p.startsWith('## ')) {
          return <h2 key={i}>{p.replace(/^##\s*/, '')}</h2>;
        }
        if (p.startsWith('### ')) {
          return <h3 key={i}>{p.replace(/^###\s*/, '')}</h3>;
        }
        return <p key={i}>{p}</p>;
      })}
    </div>
  );
};

export const ArtifactFullscreenModal: React.FC<ArtifactFullscreenModalProps> = ({
  artifact,
  open,
  onClose,
  onPublish,
  onOpenInNewTab,
  onDownload,
  versions,
  threads,
  eyebrow,
  deck,
  meta,
  source,
  date,
  bodyHtml
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || !artifact) return null;

  const a: any = artifact;
  const title = a.title || a.name || 'Artifact';
  const sourceLabel = source || a.source || 'Generated';
  const dateLabel = date || formatLongDate(a.createdAt);
  const eyebrowItems = eyebrow && eyebrow.length > 0 ? eyebrow : ['Karios Labs', 'Artifact'];
  const versionsList: VersionEntry[] = versions && versions.length > 0
    ? versions
    : [{ id: 'original', name: 'Original', date: dateLabel, isOriginal: true }];
  const threadsList: ThreadRef[] = threads || [];

  const node = (
    <div
      className="artifact-fullscreen-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        className="artifact-fullscreen-close"
        onClick={onClose}
        aria-label="Close"
      >
        <X size={18} />
      </button>

      <div
        className="artifact-fullscreen-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="artifact-fullscreen-content">
          <div className="artifact-fullscreen-eyebrow">
            {eyebrowItems.map((item, i) => (
              <React.Fragment key={i}>
                <span>{item}</span>
                {i < eyebrowItems.length - 1 && <span aria-hidden>·</span>}
              </React.Fragment>
            ))}
          </div>

          <h1 className="artifact-fullscreen-title">{title}</h1>

          {deck && <p className="artifact-fullscreen-deck">{deck}</p>}

          {meta && meta.length > 0 && (
            <div className="artifact-fullscreen-meta">
              {meta.map((m, i) => (
                <div key={i} className="artifact-fullscreen-meta-row">
                  <span className="artifact-fullscreen-meta-label">{m.label}</span>
                  <span className="artifact-fullscreen-meta-value">{m.value}</span>
                </div>
              ))}
            </div>
          )}

          {renderBody(a, bodyHtml)}
        </div>

        <aside className="artifact-fullscreen-sidebar">
          <div className="artifact-fullscreen-sidebar-header">
            <div className="artifact-fullscreen-sidebar-source">
              <Globe size={14} />
              <span>{sourceLabel}</span>
            </div>
            {dateLabel && <div className="artifact-fullscreen-sidebar-date">{dateLabel}</div>}
          </div>

          <div className="artifact-fullscreen-sidebar-section">
            <div className="artifact-fullscreen-sidebar-label">Actions</div>
            {onPublish && (
              <button
                className="artifact-fullscreen-action"
                onClick={() => onPublish(artifact)}
              >
                <Globe size={16} />
                <span>Publish</span>
              </button>
            )}
            {onOpenInNewTab && (
              <button
                className="artifact-fullscreen-action"
                onClick={() => onOpenInNewTab(artifact)}
              >
                <ExternalLink size={16} />
                <span>Open in new tab</span>
              </button>
            )}
            {onDownload && (
              <button
                className="artifact-fullscreen-action"
                onClick={() => onDownload(artifact)}
              >
                <Download size={16} />
                <span>Download</span>
              </button>
            )}
          </div>

          <div className="artifact-fullscreen-sidebar-section">
            <div className="artifact-fullscreen-sidebar-label">
              <History size={12} /> Version History
            </div>
            {versionsList.map((v) => (
              <div key={v.id} className="artifact-fullscreen-version">
                <div>
                  <div className="artifact-fullscreen-version-name">{v.name}</div>
                  {v.date && <div className="artifact-fullscreen-version-date">{v.date}</div>}
                </div>
                {v.isOriginal && <Check size={14} color="#0f0f0f" />}
              </div>
            ))}
          </div>

          {threadsList.length > 0 && (
            <div className="artifact-fullscreen-sidebar-section">
              <div className="artifact-fullscreen-sidebar-label">
                <MessageSquare size={12} /> Used in Threads
              </div>
              {threadsList.map((t) => (
                <div key={t.id} className="artifact-fullscreen-thread-chip">
                  <Check size={13} />
                  <span>{t.name}</span>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return node;
  return createPortal(node, document.body);
};

export default ArtifactFullscreenModal;
