import React from 'react';
import { Artifact } from '../../services/artifactManager.service';
import { Code, FileText, Layout, GitBranch, Image, ChevronRight } from 'lucide-react';

interface ArtifactPreviewProps {
  artifact: Artifact;
  onClick: () => void;
}

export const ArtifactPreview: React.FC<ArtifactPreviewProps> = ({ artifact, onClick }) => {
  const getIcon = () => {
    switch (artifact.type) {
      case 'code':
      case 'react':
        return <Code className="w-5 h-5" />;
      case 'html':
        return <Layout className="w-5 h-5" />;
      case 'workflow':
      case 'multi_agent_workflow':
      case 'web_automation':
        return <GitBranch className="w-5 h-5" />;
      case 'diagram':
        return <Image className="w-5 h-5" />;
      case 'markdown':
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getPreviewContent = (): string => {
    const maxLength = 100;
    const content = artifact.content;

    if (content.length <= maxLength) {
      return content;
    }

    const lines = content.split('\n').slice(0, 3);
    const preview = lines.join('\n');
    
    return preview.length > maxLength 
      ? preview.substring(0, maxLength) + '...' 
      : preview + '...';
  };

  const getComplexityColor = () => {
    switch (artifact.metadata.complexity) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div
      onClick={onClick}
      className="group relative bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-700/50 rounded-lg p-4 cursor-pointer transition-all duration-300 hover:border-[#00F3FF]/50 hover:shadow-lg hover:shadow-[#00F3FF]/10"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 rounded-lg bg-[#00F3FF]/10 text-[#00F3FF] group-hover:bg-[#00F3FF]/20 transition-colors">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-white font-semibold text-sm truncate">
              {artifact.metadata.title}
            </h4>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#00F3FF] transition-colors flex-shrink-0" />
          </div>
          
          <p className="text-gray-400 text-xs line-clamp-2">
            {artifact.metadata.description}
          </p>
        </div>
      </div>

      <div className="bg-black/30 rounded-md p-3 mb-3 font-mono text-xs text-gray-300 overflow-hidden">
        <pre className="whitespace-pre-wrap line-clamp-3">
          {getPreviewContent()}
        </pre>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {artifact.metadata.language && (
            <span className="px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
              {artifact.metadata.language}
            </span>
          )}
          
          {artifact.metadata.lineCount && (
            <span className="text-gray-500">
              {artifact.metadata.lineCount} lines
            </span>
          )}
          
          {artifact.metadata.complexity && (
            <span className={`${getComplexityColor()} font-medium`}>
              {artifact.metadata.complexity}
            </span>
          )}
        </div>

        {artifact.metadata.executable && (
          <div className="flex items-center gap-1 text-[#00F3FF]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00F3FF] animate-pulse" />
            <span>Executable</span>
          </div>
        )}
      </div>

      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#00F3FF]/0 via-[#00F3FF]/5 to-[#00F3FF]/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
};
