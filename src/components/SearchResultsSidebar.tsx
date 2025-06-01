import React from 'react';
import { X } from 'lucide-react';
import { SearchResult } from '../context/ChatContext';
import { motion } from 'framer-motion';

interface SearchResultsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  searchResults: SearchResult[];
  query: string;
}

const SearchResultsSidebar: React.FC<SearchResultsSidebarProps> = ({ 
  isOpen, 
  onClose, 
  searchResults,
  query
}) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 right-0 h-full w-80 bg-[#202124] shadow-lg z-50 overflow-y-auto custom-scrollbar"
    >
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-sm font-medium">Search results</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full focus:outline-none"
          >
            <X size={18} />
          </button>
        </div>
        
        {query && (
          <div className="mb-4 px-2 py-1 bg-[#303134] rounded-lg text-sm text-gray-300">
            "{query}"
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {searchResults.length > 0 ? (
            <div className="space-y-4">
              {searchResults.map((result, index) => (
                <div key={index} className="border-b border-gray-700 pb-3">
                  <div className="flex items-start mb-1">
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-[#303134] text-[#00F3FF] mr-2 text-xs">
                      {index + 1}
                    </span>
                    <a 
                      href={result.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#00F3FF] text-sm font-medium hover:underline"
                    >
                      {result.title}
                    </a>
                  </div>
                  <div className="text-gray-400 text-xs ml-7">
                    {result.url.replace(/^https?:\/\//, '').split('/')[0]}
                  </div>
                  <p className="text-gray-300 text-xs mt-1 ml-7">
                    {result.snippet}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 mt-8">
              No results found
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SearchResultsSidebar;
