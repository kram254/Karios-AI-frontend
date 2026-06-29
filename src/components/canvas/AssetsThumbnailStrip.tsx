import React, { useState } from 'react';
import { LayoutGrid, SlidersHorizontal, FileText, FileCode, BookOpen } from 'lucide-react';
import './canvas.css';

export interface AssetEntry {
  id: string;
  type: string;
  name?: string;
  url?: string;
  thumbnail?: string;
  preview?: string;
  origin?: 'upload' | 'artifact';
  createdAt?: number;
}

interface AssetsThumbnailStripProps {
  uploads?: AssetEntry[];
  artifacts?: AssetEntry[];
  onSelect?: (asset: AssetEntry) => void;
  onToggleGrid?: () => void;
  onFilter?: () => void;
  label?: string;
  className?: string;
  maxVisible?: number;
}

const isImageType = (type?: string, url?: string): boolean => {
  const t = (type || '').toLowerCase();
  if (t === 'image' || t === 'svg' || t === 'png' || t === 'jpg' || t === 'jpeg' || t === 'gif' || t === 'webp') return true;
  if (url && /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(url)) return true;
  return false;
};

const guessIconForType = (type?: string) => {
  const t = (type || '').toLowerCase();
  if (t === 'code' || t === 'js' || t === 'ts' || t === 'py' || t === 'react' || t === 'jsx' || t === 'tsx' || t === 'html') {
    return <FileCode size={16} color="rgba(255,255,255,0.7)" />;
  }
  if (t === 'document' || t === 'doc' || t === 'markdown' || t === 'md') {
    return <BookOpen size={16} color="rgba(255,255,255,0.7)" />;
  }
  return <FileText size={16} color="rgba(255,255,255,0.7)" />;
};

const renderThumb = (asset: AssetEntry): React.ReactNode => {
  if (asset.thumbnail) {
    return <img src={asset.thumbnail} alt={asset.name || 'asset'} loading="lazy" />;
  }
  if (isImageType(asset.type, asset.url) && asset.url) {
    return <img src={asset.url} alt={asset.name || 'asset'} loading="lazy" />;
  }
  if (asset.origin === 'artifact' && asset.preview) {
    return (
      <div className="canvas-assets-thumb-card" title={asset.name}>
        {asset.preview.slice(0, 60)}
      </div>
    );
  }
  if (asset.origin === 'artifact') {
    return (
      <div className="canvas-assets-thumb-card" title={asset.name}>
        {asset.name?.slice(0, 24) || 'Artifact'}
      </div>
    );
  }
  return (
    <div className="canvas-assets-thumb-doc" aria-hidden>
      {guessIconForType(asset.type)}
    </div>
  );
};

export const AssetsThumbnailStrip: React.FC<AssetsThumbnailStripProps> = ({
  uploads = [],
  artifacts = [],
  onSelect,
  onToggleGrid,
  onFilter,
  label,
  className = '',
  maxVisible = 12
}) => {
  const [showAll, setShowAll] = useState<boolean>(false);

  const all: AssetEntry[] = [
    ...uploads.map((u) => ({ ...u, origin: u.origin || ('upload' as const) })),
    ...artifacts.map((a) => ({ ...a, origin: a.origin || ('artifact' as const) }))
  ];

  if (all.length === 0) return null;

  const visible = showAll ? all : all.slice(0, maxVisible);
  const total = all.length;
  const computedLabel = label || `${total} ${total === 1 ? 'asset' : 'assets'}`;

  return (
    <div className={`canvas-assets-strip ${className}`}>
      <div className="canvas-assets-count">
        <span>{computedLabel}</span>
      </div>

      <button
        className="canvas-assets-grid-toggle"
        onClick={() => {
          setShowAll((prev) => !prev);
          if (onToggleGrid) onToggleGrid();
        }}
        aria-label="Toggle grid view"
        title={showAll ? 'Compact view' : 'Show all'}
      >
        <LayoutGrid size={14} />
      </button>

      <div className="canvas-assets-list">
        {visible.map((asset) => (
          <div
            key={asset.id}
            className="canvas-assets-thumb"
            onClick={() => onSelect && onSelect(asset)}
            role="button"
            tabIndex={0}
            title={asset.name || asset.id}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect && onSelect(asset);
              }
            }}
          >
            {renderThumb(asset)}
          </div>
        ))}
      </div>

      {onFilter && (
        <button
          className="canvas-assets-filter"
          onClick={onFilter}
          aria-label="Filter assets"
          title="Filter"
        >
          <SlidersHorizontal size={14} />
        </button>
      )}
    </div>
  );
};

export default AssetsThumbnailStrip;
