import React, { useState } from 'react';
import { ExternalLink, Shield, AlertTriangle } from 'lucide-react';

interface Citation {
  id: number;
  url: string;
  title: string;
  snippet?: string;
  reliability?: number;
}

interface CitationBadgeProps {
  citation: Citation;
  onClick?: () => void;
}

export const CitationBadge: React.FC<CitationBadgeProps> = ({ citation, onClick }) => {
  const [showPreview, setShowPreview] = useState(false);

  const getReliabilityColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.5) return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <span className="relative inline-block">
      <button
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
        onClick={onClick}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/30 transition-colors cursor-pointer align-super"
      >
        {citation.id}
      </button>

      {showPreview && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-3 z-50">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="text-sm font-medium text-white line-clamp-2">{citation.title}</h4>
            {citation.reliability && (
              <div className={`flex items-center gap-1 ${getReliabilityColor(citation.reliability)}`}>
                {citation.reliability >= 0.8 ? <Shield className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                <span className="text-xs">{Math.round(citation.reliability * 100)}%</span>
              </div>
            )}
          </div>
          
          {citation.snippet && (
            <p className="text-xs text-gray-400 line-clamp-3 mb-2">{citation.snippet}</p>
          )}
          
          <a 
            href={citation.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
          >
            <ExternalLink className="w-3 h-3" />
            <span className="truncate">{new URL(citation.url).hostname}</span>
          </a>
          
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-700" />
        </div>
      )}
    </span>
  );
};

interface SourceListProps {
  citations: Citation[];
}

export const SourceList: React.FC<SourceListProps> = ({ citations }) => {
  if (!citations.length) return null;

  return (
    <div className="mt-4 pt-3 border-t border-gray-700/50">
      <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Sources</h4>
      <div className="space-y-1.5">
        {citations.map(citation => (
          <a
            key={citation.id}
            href={citation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-300 group"
          >
            <span className="flex items-center justify-center w-4 h-4 rounded bg-gray-700 text-gray-400 text-[10px]">
              {citation.id}
            </span>
            <span className="truncate flex-1">{citation.title}</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        ))}
      </div>
    </div>
  );
};

export default CitationBadge;
