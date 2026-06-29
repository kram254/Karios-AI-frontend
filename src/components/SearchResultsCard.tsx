import React, { useState } from 'react';
import { Globe, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import './SearchResultsCard.css';

interface SearchSource {
  title: string;
  url: string;
  domain?: string;
  favicon?: string;
}

interface SearchResultsCardProps {
  query: string;
  sources: SearchSource[];
  resultsCount?: number;
}

const SearchResultsCard: React.FC<SearchResultsCardProps> = ({ 
  query, 
  sources, 
  resultsCount 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <div className="search-results-card">
      <div 
        className="search-results-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="search-query-section">
          <Globe size={16} className="globe-icon" />
          <span className="search-query-text">{query}</span>
        </div>
        <div className="search-results-toggle">
          <span className="results-count">{resultsCount || sources.length} results</span>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>
      
      {isExpanded && (
        <div className="search-sources-list">
          {sources.map((source, index) => (
            <a 
              key={index}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="search-source-item"
            >
              <img 
                src={source.favicon || getFavicon(source.url) || ''} 
                alt="" 
                className="source-favicon"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className="source-title">{source.title}</span>
              <span className="source-domain">{source.domain || getDomain(source.url)}</span>
              <ExternalLink size={12} className="external-link-icon" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export const CitationBadge: React.FC<{ source: string; url?: string }> = ({ source, url }) => {
  if (url) {
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="citation-badge"
      >
        {source}
      </a>
    );
  }
  return <span className="citation-badge">{source}</span>;
};

export default SearchResultsCard;
