import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  favicon?: string;
  source?: string;
}

interface CollapsibleSearchResultsProps {
  results: SearchResult[];
  isSearching: boolean;
  onResultClick?: (result: SearchResult) => void;
}

const CollapsibleSearchResults: React.FC<CollapsibleSearchResultsProps> = ({
  results,
  isSearching,
  onResultClick
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Debug logging to see what data we're receiving
  console.log('🔍 CollapsibleSearchResults received:', {
    resultsCount: results?.length || 0,
    results: results,
    isSearching
  });

  // Extract unique domains for the icon display
  const uniqueDomains = React.useMemo(() => {
    const domains = new Set<string>();
    results.forEach(result => {
      try {
        const url = new URL(result.url);
        domains.add(url.hostname);
      } catch (e) {
        // If URL parsing fails, skip this result
      }
    });
    return Array.from(domains).slice(0, 5); // Limit to 5 domains for display
  }, [results]);

  // Get favicon for a domain
  const getFavicon = (domain: string) => {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="collapsible-search-container my-2">
      {/* Button with site icons */}
      <motion.button
        onClick={toggleOpen}
        className={`collapsible-search-button flex items-center rounded-lg p-2 ${isOpen ? 'bg-blue-600' : 'bg-[#2A2A2A]'} hover:bg-blue-500 transition-all duration-200`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        layout
      >
        <div className="flex items-center gap-1 flex-1">
          <Search className="w-4 h-4 text-blue-300 mr-1" />
          
          {/* Display domain icons */}
          <div className="flex -space-x-2 mr-2">
            {uniqueDomains.map((domain, index) => (
              <div 
                key={domain} 
                className="w-6 h-6 rounded-full bg-white p-0.5 border border-gray-700"
                style={{ zIndex: 10 - index }}
              >
                <img 
                  src={getFavicon(domain)} 
                  alt={domain}
                  className="w-full h-full rounded-full object-contain"
                  onError={(e) => {
                    // If favicon fails to load, show a generic icon
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>';
                  }}
                />
              </div>
            ))}
            
            {uniqueDomains.length === 0 && isSearching && (
              <div className="search-pulse-dot"></div>
            )}
          </div>
          
          <span className="text-sm font-medium text-white">
            {isSearching 
              ? "Searching..." 
              : results.length > 0 
                ? `${results.length} ${results.length === 1 ? 'result' : 'results'}`
                : "No results"
            }
          </span>
        </div>
        
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-white" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white" />
        )}
      </motion.button>

      {/* Expandable results container */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="search-results-expanded mt-2 bg-[#1A1A1A]/90 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-700"
          >
            {results.length > 0 ? (
              <div className="p-2 max-h-[300px] overflow-y-auto">
                {results.map((result, index) => (
                  <div 
                    key={index}
                    className="search-result-item p-3 hover:bg-[#2A2A2A] rounded-lg mb-2 cursor-pointer transition-colors"
                    onClick={() => onResultClick?.(result)}
                  >
                    <div className="flex items-start">
                      {result.favicon ? (
                        <img 
                          src={result.favicon} 
                          alt=""
                          className="w-5 h-5 mt-1 mr-3"
                          onError={(e) => {
                            // Try to get favicon from domain
                            try {
                              const url = new URL(result.url);
                              (e.target as HTMLImageElement).src = getFavicon(url.hostname);
                            } catch {
                              // If that fails too, hide the image
                              (e.target as HTMLImageElement).style.display = 'none';
                            }
                          }}
                        />
                      ) : (
                        <div className="w-5 h-5 mt-1 mr-3 flex items-center justify-center">
                          <Search className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <h3 className="text-blue-400 text-sm font-medium mb-1 flex items-center">
                          {result.title}
                          <ExternalLink className="w-3 h-3 ml-1 text-gray-500" />
                        </h3>
                        
                        <div className="text-gray-400 text-xs mb-1 truncate">
                          {result.url}
                        </div>
                        
                        <p className="text-gray-300 text-xs line-clamp-2">
                          {result.snippet}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-400 text-sm">
                {isSearching ? (
                  <div className="flex flex-col items-center">
                    <div className="search-spinner mb-2"></div>
                    <span>Searching the web...</span>
                  </div>
                ) : (
                  "No search results found"
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* CSS for animations */}
      <style dangerouslySetInnerHTML={{__html: `
        .search-pulse-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: #3B82F6;
          position: relative;
          animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
          0% {
            transform: scale(0.8);
            opacity: 0.8;
          }
          50% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(0.8);
            opacity: 0.8;
          }
        }
        
        .search-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(59, 130, 246, 0.3);
          border-radius: 50%;
          border-top-color: #3B82F6;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}} />
    </div>
  );
};

export default CollapsibleSearchResults;
