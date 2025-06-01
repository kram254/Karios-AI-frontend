import React from 'react';
import { Search, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../context/ChatContext';
import SearchResultsSidebar from './SearchResultsSidebar';

interface AccessedWebsitesFloaterProps {
  isVisible: boolean;
}

const AccessedWebsitesFloater: React.FC<AccessedWebsitesFloaterProps> = ({ 
  isVisible
}) => {
  const { 
    searchResults, 
    isSearchSidebarOpen, 
    toggleSearchSidebar,
    searchQuery,
    isSearching
  } = useChat();

  // Only show when there are search results or actively searching
  const shouldShow = isVisible && (searchResults.length > 0 || isSearching);  
  if (!shouldShow) return null;

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-24 right-5 z-10"
          >
            <motion.button
              onClick={toggleSearchSidebar}
              className="flex items-center bg-[#303134] hover:bg-[#3c3f43] text-white text-sm font-medium rounded-full px-4 py-2.5 shadow-lg border border-[#00F3FF]/20 hover:border-[#00F3FF]/40 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex items-center mr-2">
                {isSearching ? (
                  <Loader2 size={16} className="mr-2 animate-spin text-[#00F3FF]" />
                ) : (
                  <Search size={16} className="mr-2 text-[#00F3FF]" />
                )}
                <span>
                  {isSearching ? 'Searching...' : 
                    searchResults.length > 0 ? `Found ${searchResults.length} results` : 'No results'}
                </span>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchResultsSidebar 
        isOpen={isSearchSidebarOpen} 
        onClose={toggleSearchSidebar} 
        searchResults={searchResults}
        query={searchQuery}
      />
    </>
  );
};

export default AccessedWebsitesFloater;
