import React, { useState, useEffect } from 'react';
import { X, Copy, Download, Code, RefreshCw } from 'lucide-react';

interface CodePreviewProps {
  workflowId: string;
  onClose: () => void;
}

export function CodePreview({ workflowId, onClose }: CodePreviewProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguage] = useState<'typescript' | 'python'>('typescript');
  const [copied, setCopied] = useState(false);

  const fetchCode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/workflows/${workflowId}/generate-code?format=${language}`);
      const data = await response.json();
      setCode(data.code || '');
    } catch (error) {
      console.error('Failed to fetch code:', error);
      setCode('// Failed to generate code');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (workflowId) {
      fetchCode();
    }
  }, [workflowId, language]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = language === 'typescript' ? 'ts' : 'py';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '50%',
      height: '100%',
      backgroundColor: '#1e1e1e',
      borderLeft: '1px solid #333',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid #333',
        backgroundColor: '#252526',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Code size={18} color="#8b5cf6" />
          <span style={{ color: 'white', fontWeight: 600 }}>Generated Code</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'typescript' | 'python')}
            style={{
              backgroundColor: '#3c3c3c',
              border: '1px solid #555',
              color: 'white',
              padding: '4px 8px',
              borderRadius: 4,
              fontSize: 12,
            }}
          >
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
          </select>
          <button
            onClick={fetchCode}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px',
              backgroundColor: '#3c3c3c',
              border: '1px solid #555',
              color: 'white',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={handleCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px',
              backgroundColor: copied ? '#10b981' : '#3c3c3c',
              border: '1px solid #555',
              color: 'white',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            <Copy size={14} />
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px',
              backgroundColor: '#3c3c3c',
              border: '1px solid #555',
              color: 'white',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            <Download size={14} />
          </button>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: 4,
              backgroundColor: 'transparent',
              border: 'none',
              color: '#999',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 0 }}>
        {isLoading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#666',
          }}>
            Loading...
          </div>
        ) : (
          <pre style={{
            margin: 0,
            padding: 16,
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
            fontSize: 13,
            lineHeight: 1.6,
            color: '#d4d4d4',
            backgroundColor: '#1e1e1e',
            overflow: 'auto',
            height: '100%',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
