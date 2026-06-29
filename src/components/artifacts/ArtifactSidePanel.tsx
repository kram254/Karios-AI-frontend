import React from 'react';
import { X, Code, FileText, Image, MessageSquare, Sparkles, Download, Copy, ExternalLink } from 'lucide-react';

interface ArtifactSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  // Added 'image' to supported types to resolve TS2678 error
  type?: 'code' | 'document' | 'react' | 'html' | 'svg' | 'mermaid' | 'data' | 'image';
  children: React.ReactNode;
  width?: string;
  mode?: 'overlay' | 'inline';
}

export const ArtifactSidePanel: React.FC<ArtifactSidePanelProps> = ({
  isOpen,
  onClose,
  title,
  type = 'document',
  children,
  width = '50%',
  mode = 'overlay'
}) => {
  if (!isOpen) return null;

  const getTypeIcon = () => {
    switch (type) {
      case 'code': return <Code className="w-5 h-5 text-blue-600" />;
      case 'react': return <Code className="w-5 h-5 text-cyan-600" />;
      case 'data': return <FileText className="w-5 h-5 text-green-600" />;
      // Renders a purple-themed icon for the 'image' artifact type in the side panel header.
      // Returns <Image /> with purple styling when type is 'image'.
      case 'image': return <Image className="w-5 h-5 text-purple-600" />;
      default: return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'code': return 'bg-blue-100 text-blue-700';
      case 'react': return 'bg-cyan-100 text-cyan-700';
      case 'data': return 'bg-green-100 text-green-700';
      // Used in ArtifactSidePanel to display type icon with consistent color theme
      case 'image': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const containerClasses = mode === 'overlay' 
    ? "bg-gray-900 border-l border-gray-700 flex flex-col animate-slide-in shadow-2xl z-50 fixed right-0 top-0 bottom-0 h-full"
    : "bg-gray-900 border-l border-gray-700 flex flex-col h-full w-full";

  const containerStyles = mode === 'overlay' 
    ? { 
        width: width,
        minWidth: '400px',
        maxWidth: '800px',
        animation: 'slideIn 300ms ease-out'
      }
    : { width: '100%' };

  return (
    <div 
      className={containerClasses}
      style={containerStyles}
    >
      {/* Panel Header */}
      <div className="h-16 border-b border-gray-700 flex items-center justify-between px-4 bg-gray-900 flex-shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          {getTypeIcon()}
          <h2 className="font-semibold text-gray-100 truncate" title={title}>
            {title}
          </h2>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor()} uppercase`}>
            {type}
          </span>
        </div>
        <div className="flex items-center gap-2">
           {/* Action Buttons */}
           <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400" title="Copy content">
             <Copy className="w-4 h-4" />
           </button>
           <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400" title="Download">
             <Download className="w-4 h-4" />
           </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto p-0 bg-gray-950">
        {children}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slideIn 300ms ease-out;
        }
      `}</style>
    </div>
  );
};
