import React from 'react';
import { Activity, Zap } from 'lucide-react';

interface StreamingOutputDisplayProps {
  nodeId: string;
  output: string;
  isStreaming: boolean;
}

export function StreamingOutputDisplay({ nodeId, output, isStreaming }: StreamingOutputDisplayProps) {
  if (!output) return null;

  return (
    <div className="absolute top-full left-0 mt-2 w-80 max-w-md bg-white rounded-lg shadow-xl border border-purple-200 z-50 overflow-hidden">
      {/* Header with streaming indicator */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-2 flex items-center gap-2">
        <div className="flex items-center gap-2 text-white text-sm font-medium">
          {isStreaming ? (
            <>
              <Activity className="w-4 h-4 animate-pulse" />
              <span>Streaming Response...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>Response Complete</span>
            </>
          )}
        </div>
      </div>

      {/* Streaming output content */}
      <div className="p-3 max-h-64 overflow-y-auto bg-gray-50">
        <div className="prose prose-sm max-w-none">
          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
            {output}
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-purple-600 ml-1 animate-pulse"></span>
            )}
          </p>
        </div>
      </div>

      {/* Token counter */}
      <div className="px-3 py-2 bg-gray-100 border-t border-gray-200 text-xs text-gray-600">
        {output.length} characters • {output.split(' ').length} words
      </div>
    </div>
  );
}
