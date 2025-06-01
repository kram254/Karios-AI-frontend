import React from 'react';
import { ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AccessedWebsitesFloaterProps {
  websites: { title: string; url: string }[];
  isVisible: boolean;
}

const AccessedWebsitesFloater: React.FC<AccessedWebsitesFloaterProps> = ({ websites, isVisible }) => {
  if (!isVisible || websites.length === 0) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-24 right-5 max-w-xs w-full md:w-80 z-10"
        >
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-3 border border-[#00F3FF]/10 shadow-lg">
            <div className="text-[#00F3FF]/80 text-xs font-medium mb-2 flex items-center">
              <ExternalLink size={12} className="mr-1" />
              <span>Accessing websites...</span>
            </div>
            
            <div className="space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
              {websites.map((site, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center bg-white/5 rounded-lg p-2 hover:bg-white/10 transition-colors"
                >
                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-[#00F3FF]/10 text-[#00F3FF] mr-2 text-xs font-medium">
                    {index + 1}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <div className="text-white/80 text-xs font-medium truncate">{site.title}</div>
                    <div className="text-white/40 text-[10px] truncate">{site.url}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AccessedWebsitesFloater;
