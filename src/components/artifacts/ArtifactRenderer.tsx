import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Artifact } from '../../services/artifactManager.service';
import { Code, Play, Copy, Download, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const WorkflowCanvas = lazy(() => import('../WorkflowCanvas').then(m => ({ default: m.WorkflowCanvas })));

interface ArtifactRendererProps {
  artifact: Artifact;
  onExecute?: (artifact: Artifact) => void;
  onClose?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const ArtifactRenderer: React.FC<ArtifactRendererProps> = ({
  artifact,
  onExecute,
  onClose,
  isFullscreen = false,
  onToggleFullscreen
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(artifact.content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([artifact.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.metadata.title || 'artifact'}.${getFileExtension(artifact.type)}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExecute = async () => {
    if (!artifact.metadata.executable) return;
    
    setIsExecuting(true);
    try {
      if (onExecute) {
        await onExecute(artifact);
      }
      
      if (artifact.type === 'code' && artifact.metadata.language === 'javascript') {
        executeJavaScript(artifact.content);
      } else if (artifact.type === 'html' || artifact.type === 'react') {
        renderInIframe(artifact.content);
      }
    } catch (error) {
      console.error('Execution error:', error);
      setExecutionResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsExecuting(false);
    }
  };

  const executeJavaScript = (code: string) => {
    try {
      const result = new Function(code)();
      setExecutionResult({ result });
    } catch (error: any) {
      setExecutionResult({ error: error.message });
    }
  };

  const renderInIframe = (content: string) => {
    if (!iframeRef.current) return;
    
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    
    doc.open();
    doc.write(content);
    doc.close();
  };

  const getFileExtension = (type: string): string => {
    const extensions: Record<string, string> = {
      'code': artifact.metadata.language || 'txt',
      'react': 'jsx',
      'html': 'html',
      'markdown': 'md',
      'workflow': 'json',
      'diagram': 'mmd'
    };
    return extensions[type] || 'txt';
  };

  const renderContent = () => {
    switch (artifact.type) {
      case 'code':
        return renderCode();
      case 'html':
        return renderHTML();
      case 'react':
        return renderReact();
      case 'workflow':
        return renderWorkflow();
      case 'multi_agent_workflow':
        return renderMultiAgentWorkflow();
      case 'diagram':
        return renderDiagram();
      case 'markdown':
        return renderMarkdown();
      default:
        return <div className="p-4 text-white">Unsupported artifact type</div>;
    }
  };

  const renderCode = () => (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <SyntaxHighlighter
          language={artifact.metadata.language || 'text'}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1.5rem',
            background: 'transparent',
            fontSize: '0.9rem',
            lineHeight: '1.5'
          }}
          showLineNumbers
        >
          {artifact.content}
        </SyntaxHighlighter>
      </div>
      {executionResult && (
        <div className="border-t border-gray-700 p-4 bg-gray-900">
          <div className="text-sm text-gray-400 mb-2">Execution Result:</div>
          <pre className="text-white text-sm overflow-auto">
            {JSON.stringify(executionResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );

  const renderHTML = () => (
    <div className="h-full bg-white">
      <iframe
        ref={iframeRef}
        className="w-full h-full border-none"
        sandbox="allow-scripts allow-same-origin"
        title="HTML Preview"
      />
    </div>
  );

  const renderReact = () => (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto bg-gray-900">
        <SyntaxHighlighter
          language="jsx"
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1.5rem',
            background: 'transparent'
          }}
          showLineNumbers
        >
          {artifact.content}
        </SyntaxHighlighter>
      </div>
      <div className="border-t border-gray-700 p-4 bg-gray-800">
        <div className="text-sm text-gray-400">
          React component preview requires live execution environment
        </div>
      </div>
    </div>
  );

  const renderWorkflow = () => {
    try {
      const workflowData = JSON.parse(artifact.content);
      return (
        <Suspense fallback={<div className="flex items-center justify-center h-full text-white">Loading workflow...</div>}>
          <WorkflowCanvas
            phases={workflowData.phases || workflowData.steps || []}
            isCanvasMode={false}
          />
        </Suspense>
      );
    } catch (error) {
      return (
        <div className="p-4 text-red-400">
          Failed to parse workflow data
        </div>
      );
    }
  };

  const renderMultiAgentWorkflow = () => {
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-full text-white">Loading workflow...</div>}>
        <div className="h-full overflow-auto p-4">
          <div className="text-white text-sm whitespace-pre-wrap">
            {artifact.content}
          </div>
        </div>
      </Suspense>
    );
  };

  const renderDiagram = () => (
    <div className="h-full flex items-center justify-center bg-gray-900 text-white p-4">
      <pre className="text-sm">{artifact.content}</pre>
    </div>
  );

  const renderMarkdown = () => (
    <div className="h-full overflow-auto p-6 bg-gray-900 text-white prose prose-invert max-w-none">
      <div className="whitespace-pre-wrap">{artifact.content}</div>
    </div>
  );

  useEffect(() => {
    if (artifact.type === 'html' && artifact.metadata.executable) {
      renderInIframe(artifact.content);
    }
  }, [artifact]);

  return (
    <div className="h-full flex flex-col bg-[#1A1A1A] border-l border-gray-800">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-[#0A0A0A]">
        <div className="flex items-center gap-3">
          <Code className="w-5 h-5 text-[#00F3FF]" />
          <div>
            <div className="text-white font-semibold text-sm">
              {artifact.metadata.title}
            </div>
            <div className="text-gray-400 text-xs">
              {artifact.metadata.description}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {artifact.metadata.executable && (
            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className="p-2 rounded-lg bg-[#00F3FF]/10 hover:bg-[#00F3FF]/20 text-[#00F3FF] transition-colors disabled:opacity-50"
              title="Execute"
            >
              {isExecuting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
          )}

          <button
            onClick={handleCopy}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
            title="Copy to clipboard"
          >
            <Copy className="w-4 h-4" />
          </button>

          <button
            onClick={handleDownload}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>

          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
              title="Close"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>

      {copySuccess && (
        <div className="absolute top-16 right-4 bg-green-500 text-white px-3 py-2 rounded-lg text-sm">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
};
