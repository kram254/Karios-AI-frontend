import React, { useEffect, useState } from 'react';
import { Sparkles, TrendingUp, AlertCircle, Lightbulb, Plus, X } from 'lucide-react';

interface AISuggestionsPanelProps {
  nodes: any[];
  edges: any[];
  workflowName: string;
  onAddNode: (suggestion: any) => void;
  show: boolean;
  onClose: () => void;
}

export function AISuggestionsPanel({ 
  nodes, 
  edges, 
  workflowName, 
  onAddNode,
  show,
  onClose
}: AISuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [optimizations, setOptimizations] = useState<any>(null);
  const [explanation, setExplanation] = useState<string>('');

  // Fetch AI suggestions when nodes change
  useEffect(() => {
    if (nodes.length > 0 && show) {
      fetchSuggestions();
      fetchOptimizations();
      fetchExplanation();
    }
  }, [nodes.length, show]);

  const fetchSuggestions = async () => {
    if (nodes.length === 0) return;
    
    setLoading(true);
    try {
      const lastNode = nodes[nodes.length - 1];
      const response = await fetch('/api/workflows/ai/suggest-next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: workflowName,
          nodes: nodes,
          lastNodeType: lastNode?.data?.nodeType,
          lastNodeOutput: null
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptimizations = async () => {
    if (nodes.length < 3) return;
    
    try {
      const response = await fetch('/api/workflows/ai/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges })
      });

      if (response.ok) {
        const data = await response.json();
        setOptimizations(data.optimizations);
      }
    } catch (error) {
      console.error('Failed to fetch optimizations:', error);
    }
  };

  const fetchExplanation = async () => {
    if (nodes.length === 0) return;
    
    try {
      const response = await fetch('/api/workflows/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges })
      });

      if (response.ok) {
        const data = await response.json();
        setExplanation(data.explanation);
      }
    } catch (error) {
      console.error('Failed to fetch explanation:', error);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50';
    if (confidence >= 0.6) return 'text-blue-600 bg-blue-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  if (!show) return null;

  return (
    <div className="fixed right-4 top-20 w-96 max-h-[calc(100vh-100px)] bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-semibold">AI Assistant</h3>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/20 rounded p-1 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="overflow-y-auto max-h-[calc(100vh-180px)]">
        {/* Workflow Explanation */}
        {explanation && (
          <div className="p-4 bg-blue-50 border-b border-blue-100">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-blue-900 mb-1">What this workflow does:</p>
                <p className="text-sm text-blue-800">{explanation}</p>
              </div>
            </div>
          </div>
        )}

        {/* Suggested Next Nodes */}
        <div className="p-4 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Suggested Next Steps
          </h4>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-xs text-gray-500 mt-2">AI is thinking...</p>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg p-3 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => onAddNode(suggestion)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-purple-600">
                        {suggestion.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{suggestion.reason}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                      {(suggestion.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                      {suggestion.nodeType}
                    </span>
                    <button className="text-xs text-gray-500 group-hover:text-purple-600">
                      Click to add →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              Add nodes to get AI suggestions
            </p>
          )}
        </div>

        {/* Optimizations */}
        {optimizations && optimizations.canOptimize && (
          <div className="p-4 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Optimization Opportunities
            </h4>
            
            {optimizations.estimatedSpeedup && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                <p className="text-xs font-medium text-green-900">
                  Potential speedup: {optimizations.estimatedSpeedup}
                </p>
              </div>
            )}

            {optimizations.suggestions && optimizations.suggestions.length > 0 && (
              <div className="space-y-2">
                {optimizations.suggestions.map((suggestion: string, index: number) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">{suggestion}</p>
                  </div>
                ))}
              </div>
            )}

            {optimizations.parallelizableNodes && optimizations.parallelizableNodes.length > 0 && (
              <div className="mt-3 p-2 bg-blue-50 rounded">
                <p className="text-xs font-medium text-blue-900 mb-1">Parallel Execution Available</p>
                <p className="text-xs text-blue-700">
                  {optimizations.parallelizableNodes.length} node groups can run in parallel
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="p-4 bg-gray-50">
          <button
            onClick={fetchSuggestions}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Refresh Suggestions'}
          </button>
        </div>
      </div>
    </div>
  );
}
