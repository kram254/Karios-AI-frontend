import React, { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, Wrench, CheckCircle } from 'lucide-react';

interface ErrorRecoveryPanelProps {
  nodeId: string;
  node: any;
  error: string;
  executionContext: any;
  onApplyFix: (nodeId: string, fixedConfig: any) => void;
  onDismiss: () => void;
}

export function ErrorRecoveryPanel({
  nodeId,
  node,
  error,
  executionContext,
  onApplyFix,
  onDismiss
}: ErrorRecoveryPanelProps) {
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetchAIFix();
  }, [nodeId, error]);

  const fetchAIFix = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/workflows/ai/fix-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          node,
          error,
          executionContext
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAiSuggestion(data.fix);
      }
    } catch (err) {
      console.error('Failed to fetch AI fix:', err);
      setAiSuggestion({ canFix: false, suggestion: 'Unable to generate automatic fix' });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFix = async () => {
    if (!aiSuggestion?.modifiedConfig) return;
    
    setApplying(true);
    try {
      await onApplyFix(nodeId, aiSuggestion.modifiedConfig);
      onDismiss();
    } catch (err) {
      console.error('Failed to apply fix:', err);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 p-4 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-white" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">Node Execution Failed</h3>
            <p className="text-sm text-red-100">AI is analyzing the error...</p>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Error Details */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Error Message:</h4>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800 font-mono">{error}</p>
            </div>
          </div>

          {/* AI Suggestion */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-gray-600 mt-4">AI is analyzing the error and generating a fix...</p>
            </div>
          ) : aiSuggestion?.canFix ? (
            <div className="space-y-4">
              {/* Issue Explanation */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-blue-600" />
                  What Went Wrong:
                </h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-900">{aiSuggestion.issue}</p>
                </div>
              </div>

              {/* Suggested Fix */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Suggested Fix:
                </h4>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-900 mb-3">{aiSuggestion.fix}</p>
                  
                  {aiSuggestion.reasoning && (
                    <div className="mt-2 pt-2 border-t border-green-300">
                      <p className="text-xs text-green-700 italic">{aiSuggestion.reasoning}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Confidence Score */}
              {aiSuggestion.confidence && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Fix Confidence:</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all"
                      style={{ width: `${aiSuggestion.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {(aiSuggestion.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              )}

              {/* Modified Config Preview */}
              {aiSuggestion.modifiedConfig && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Updated Configuration:</h4>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <pre className="text-xs text-gray-800 overflow-x-auto">
                      {JSON.stringify(aiSuggestion.modifiedConfig, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600">
                {aiSuggestion?.suggestion || 'Unable to generate automatic fix. Manual intervention required.'}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onDismiss}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Dismiss
          </button>
          {aiSuggestion?.canFix && aiSuggestion?.modifiedConfig && (
            <>
              <button
                onClick={fetchAIFix}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate Fix
              </button>
              <button
                onClick={handleApplyFix}
                disabled={applying}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 rounded-lg hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {applying ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Applying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Apply Fix & Retry
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
