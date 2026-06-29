import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock, Zap, DollarSign, X } from 'lucide-react';

interface TimelineEvent {
  nodeId: string;
  nodeLabel: string;
  nodeType: string;
  status: 'running' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  duration?: number;
  tokenUsage?: number;
  apiCalls?: number;
  error?: string;
}

interface ExecutionTimelineProps {
  executionId: string;
  events: TimelineEvent[];
  onReplayToNode?: (nodeId: string) => void;
  onClose?: () => void;
}

export function ExecutionTimeline({ executionId, events, onReplayToNode, onClose }: ExecutionTimelineProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentEventIndex, setCurrentEventIndex] = useState(events.length - 1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const totalDuration = events.reduce((sum, e) => sum + (e.duration || 0), 0);
  const totalTokens = events.reduce((sum, e) => sum + (e.tokenUsage || 0), 0);
  const totalApiCalls = events.reduce((sum, e) => sum + (e.apiCalls || 0), 0);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentEventIndex(prev => {
        if (prev >= events.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, events.length]);

  const handleReplay = () => {
    setCurrentEventIndex(0);
    setIsPlaying(true);
  };

  const handleSeek = (index: number) => {
    setCurrentEventIndex(index);
    setIsPlaying(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

  const maxDuration = Math.max(...events.map(e => e.duration || 0));

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 shadow-2xl z-50" style={{ height: '300px' }}>
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Clock size={18} />
              Execution Timeline
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {formatDuration(totalDuration)}
              </span>
              {totalTokens > 0 && (
                <span className="flex items-center gap-1">
                  <Zap size={14} />
                  {totalTokens.toLocaleString()} tokens
                </span>
              )}
              {totalApiCalls > 0 && (
                <span className="flex items-center gap-1">
                  <DollarSign size={14} />
                  {totalApiCalls} API calls
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleReplay}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1 text-sm"
            >
              <RotateCcw size={14} />
              Replay
            </button>
            
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded flex items-center gap-1 text-sm"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              className="px-2 py-1 bg-gray-700 text-white rounded text-sm border border-gray-600"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={4}>4x</option>
            </select>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-700 text-gray-400 hover:text-white rounded"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="space-y-2">
            {events.map((event, index) => {
              const isActive = index === currentEventIndex;
              const isPast = index < currentEventIndex;
              const barWidth = event.duration ? (event.duration / maxDuration) * 100 : 0;

              return (
                <div
                  key={`${event.nodeId}-${index}`}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-900/30 border-blue-500'
                      : isPast
                      ? 'bg-gray-800/50 border-gray-700'
                      : 'bg-gray-800/30 border-gray-700/50'
                  }`}
                  onClick={() => handleSeek(index)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(event.status)}`} />
                      <span className="text-white font-medium text-sm">{event.nodeLabel}</span>
                      <span className="text-gray-500 text-xs">{event.nodeType}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {event.duration && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatDuration(event.duration)}
                        </span>
                      )}
                      {event.tokenUsage && (
                        <span className="flex items-center gap-1">
                          <Zap size={12} />
                          {event.tokenUsage.toLocaleString()}
                        </span>
                      )}
                      {event.apiCalls && (
                        <span className="flex items-center gap-1">
                          <DollarSign size={12} />
                          {event.apiCalls}
                        </span>
                      )}
                      {onReplayToNode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onReplayToNode(event.nodeId);
                          }}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                        >
                          Replay from here
                        </button>
                      )}
                    </div>
                  </div>

                  {event.duration && (
                    <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full ${getStatusColor(event.status)}`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  )}

                  {event.error && (
                    <div className="mt-2 text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded">
                      {event.error}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
