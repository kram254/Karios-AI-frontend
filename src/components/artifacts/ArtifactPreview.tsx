import React from 'react';
import { Artifact } from '../../services/artifactManager.service';
import { Code, FileText, Layout, GitBranch, Image, ChevronRight, Globe, Zap } from 'lucide-react';

interface ArtifactPreviewProps {
  artifact: Artifact;
  onClick: () => void;
  variant?: 'card' | 'chip';
  isActive?: boolean;
}

export const ArtifactPreview: React.FC<ArtifactPreviewProps> = ({ artifact, onClick, variant = 'card', isActive = false }) => {
  const getIcon = () => {
    switch (artifact.type) {
      case 'code':
      case 'react':
        return <Code className="w-5 h-5" />;
      case 'html':
        return <Layout className="w-5 h-5" />;
      case 'workflow':
      case 'multi_agent_workflow':
        return <GitBranch className="w-5 h-5" />;
      case 'web_automation':
        return <Globe className="w-5 h-5" />;
      case 'diagram':
      case 'svg':
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

  const getTypeLabel = () => {
    switch (artifact.type) {
      case 'code':
        return 'Code';
      case 'react':
        return 'React';
      case 'html':
        return 'HTML';
      case 'workflow':
        return 'Workflow';
      case 'multi_agent_workflow':
        return 'Workflow';
      case 'web_automation':
        return 'Automation';
      case 'diagram':
        return 'Diagram';
      case 'svg':
        return 'SVG';
      case 'markdown':
        return 'Document';
      default:
        return 'Artifact';
    }
  };

  if (variant === 'chip') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2 border transition-colors text-left ${
          isActive
            ? 'border-[#00F3FF]/60 bg-[#00F3FF]/10'
            : 'border-gray-700/50 bg-black/20 hover:bg-black/30 hover:border-[#00F3FF]/40'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className={`flex items-center justify-center w-7 h-7 rounded-lg ${isActive ? 'bg-[#00F3FF]/20 text-[#00F3FF]' : 'bg-gray-800/60 text-gray-300'}`}>
            {getIcon()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-white truncate">{artifact.metadata.title}</div>
            <div className="text-xs text-gray-400 truncate">{getTypeLabel()}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {artifact.metadata.executable && (
            <div className="flex items-center gap-1 text-xs text-[#00F3FF]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00F3FF]" />
              <span>Open</span>
            </div>
          )}
          <ChevronRight className={`w-4 h-4 ${isActive ? 'text-[#00F3FF]' : 'text-gray-400'}`} />
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3 border transition-all duration-200 text-left group ${
        isActive
          ? 'border-[#00F3FF]/60 bg-[#00F3FF]/10'
          : 'border-gray-700/50 bg-[#1a1a2e]/80 hover:bg-[#1a1a2e] hover:border-[#00F3FF]/40'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={`flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0 ${isActive ? 'bg-[#00F3FF]/20 text-[#00F3FF]' : 'bg-gray-800/60 text-[#00F3FF]'}`}>
          {getIcon()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-white truncate">{artifact.metadata.title}</div>
          <div className="text-xs text-gray-400">{getTypeLabel()}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#00F3FF]/10 text-[#00F3FF] text-xs font-medium">
          <span>+</span>
          <span>Open</span>
        </div>
        <ChevronRight className={`w-4 h-4 ${isActive ? 'text-[#00F3FF]' : 'text-gray-400 group-hover:text-[#00F3FF]'} transition-colors`} />
      </div>
    </button>
  );
};
