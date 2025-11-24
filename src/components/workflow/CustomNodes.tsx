import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  PlayCircle,
  Bot,
  Wrench,
  Code,
  GitBranch,
  RotateCw,
  CheckCircle,
  StopCircle,
  StickyNote,
  Shield,
  Database,
  Search,
} from 'lucide-react';
import type { WorkflowNode } from '../../types/workflow';

// Node icon mapping
const nodeIcons = {
  start: PlayCircle,
  agent: Bot,
  'mcp-tool': Wrench,
  transform: Code,
  'if-else': GitBranch,
  while: RotateCw,
  approval: CheckCircle,
  end: StopCircle,
  note: StickyNote,
  guardrail: Shield,
  'set-state': Database,
  'file-search': Search,
};

// Node color mapping
const nodeColors = {
  start: 'from-green-500/20 to-green-600/20 border-green-500',
  agent: 'from-blue-500/20 to-blue-600/20 border-blue-500',
  'mcp-tool': 'from-purple-500/20 to-purple-600/20 border-purple-500',
  transform: 'from-orange-500/20 to-orange-600/20 border-orange-500',
  'if-else': 'from-yellow-500/20 to-yellow-600/20 border-yellow-500',
  while: 'from-pink-500/20 to-pink-600/20 border-pink-500',
  approval: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500',
  end: 'from-red-500/20 to-red-600/20 border-red-500',
  note: 'from-gray-500/20 to-gray-600/20 border-gray-500',
  guardrail: 'from-indigo-500/20 to-indigo-600/20 border-indigo-500',
  'set-state': 'from-teal-500/20 to-teal-600/20 border-teal-500',
  'file-search': 'from-violet-500/20 to-violet-600/20 border-violet-500',
};

// Custom node component
function CustomNode({ data, selected }: NodeProps<WorkflowNode['data']>) {
  const nodeType = data.nodeType;
  const Icon = nodeIcons[nodeType] || Bot;
  const colorClass = nodeColors[nodeType] || 'from-gray-500/20 to-gray-600/20 border-gray-500';
  
  const showInputHandle = nodeType !== 'start';
  const showOutputHandle = nodeType !== 'end';
  
  // Execution status styling
  const getStatusStyle = () => {
    if (data.isRunning) {
      return 'ring-2 ring-blue-400 animate-pulse';
    }
    if (data.executionStatus === 'completed') {
      return 'ring-2 ring-green-400';
    }
    if (data.executionStatus === 'failed') {
      return 'ring-2 ring-red-400';
    }
    if (selected) {
      return 'ring-2 ring-white/50';
    }
    return '';
  };

  return (
    <div
      className={`
        relative min-w-[180px] rounded-lg border-2 bg-gradient-to-br backdrop-blur-sm
        shadow-lg transition-all duration-200 hover:shadow-xl
        ${colorClass}
        ${getStatusStyle()}
      `}
    >
      {showInputHandle && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-white border-2 border-gray-600"
        />
      )}
      
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-5 h-5 text-white" />
          <span className="font-semibold text-white text-sm">{data.label}</span>
        </div>
        
        {data.config?.prompt && (
          <div className="text-xs text-gray-300 mt-1 line-clamp-2">
            {data.config.prompt}
          </div>
        )}
        
        {data.config?.model && (
          <div className="text-xs text-gray-400 mt-1">
            Model: {data.config.model}
          </div>
        )}
        
        {data.config?.tool && (
          <div className="text-xs text-gray-400 mt-1">
            Tool: {data.config.tool}
          </div>
        )}
        
        {data.isRunning && (
          <div className="absolute -top-2 -right-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-ping" />
          </div>
        )}
        
        {data.executionStatus === 'completed' && (
          <div className="absolute -top-2 -right-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
        )}
        
        {data.executionStatus === 'failed' && (
          <div className="absolute -top-2 -right-2">
            <StopCircle className="w-5 h-5 text-red-500" />
          </div>
        )}
      </div>
      
      {showOutputHandle && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 !bg-white border-2 border-gray-600"
        />
      )}
      
      {nodeType === 'if-else' && (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            className="w-3 h-3 !bg-green-500 border-2 border-gray-600"
            style={{ top: '40%' }}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            className="w-3 h-3 !bg-red-500 border-2 border-gray-600"
            style={{ top: '60%' }}
          />
        </>
      )}
    </div>
  );
}

// Export node types for ReactFlow
export const nodeTypes = {
  custom: CustomNode,
};

// Export individual components if needed
export { CustomNode };
