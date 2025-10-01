import React, { useState, useEffect, useRef } from 'react';
import { X, Minimize2, Maximize2, Trash2, Download, Copy } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'log' | 'warn' | 'error' | 'ws' | 'state';
  message: string;
  data?: any;
  emoji?: string;
}

export const ProductionDebugConsole: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const maxLogs = 500;

  useEffect(() => {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const addLog = (type: LogEntry['type'], args: any[], emoji?: string) => {
      const message = args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');

      const entry: LogEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
        emoji
      };

      setLogs(prev => {
        const newLogs = [...prev, entry];
        return newLogs.slice(-maxLogs);
      });
    };

    console.log = (...args: any[]) => {
      originalLog(...args);
      const firstArg = String(args[0]);
      let emoji = '📋';
      if (firstArg.includes('🔥')) emoji = '🔥';
      else if (firstArg.includes('🚀')) emoji = '🚀';
      else if (firstArg.includes('🎯')) emoji = '🎯';
      else if (firstArg.includes('🎬')) emoji = '🎬';
      else if (firstArg.includes('🎨')) emoji = '🎨';
      else if (firstArg.includes('📊')) emoji = '📊';
      else if (firstArg.includes('✅')) emoji = '✅';
      else if (firstArg.includes('🔢')) emoji = '🔢';
      else if (firstArg.includes('📦')) emoji = '📦';
      addLog('log', args, emoji);
    };

    console.warn = (...args: any[]) => {
      originalWarn(...args);
      addLog('warn', args, '⚠️');
    };

    console.error = (...args: any[]) => {
      originalError(...args);
      addLog('error', args, '❌');
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  useEffect(() => {
    if (logsEndRef.current && isExpanded) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isExpanded]);

  const clearLogs = () => setLogs([]);

  const downloadLogs = () => {
    const logsText = logs.map(log => 
      `[${log.timestamp}] ${log.emoji || ''} ${log.type.toUpperCase()}: ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyLogs = async () => {
    const logsText = logs.map(log => 
      `[${log.timestamp}] ${log.emoji || ''} ${log.type.toUpperCase()}: ${log.message}`
    ).join('\n');
    
    try {
      await navigator.clipboard.writeText(logsText);
      console.log('✅ Logs copied to clipboard!');
    } catch (err) {
      console.error('❌ Failed to copy logs:', err);
    }
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'error': return 'text-red-500';
      case 'warn': return 'text-yellow-500';
      case 'ws': return 'text-blue-500';
      case 'state': return 'text-green-500';
      default: return 'text-gray-300';
    }
  };

  const toggleKeyListener = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      setIsVisible(prev => !prev);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', toggleKeyListener);
    return () => window.removeEventListener('keydown', toggleKeyListener);
  }, []);

  if (!isVisible) {
    return (
      <div 
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          padding: '4px 8px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: '#0f0',
          fontSize: '10px',
          borderRadius: '4px',
          zIndex: 999999,
          fontFamily: 'monospace',
          cursor: 'pointer'
        }}
        onClick={() => setIsVisible(true)}
      >
        Ctrl+Shift+D
      </div>
    );
  }

  if (!isExpanded) {
    return (
      <div 
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          width: '300px',
          maxHeight: '150px',
          background: 'rgba(0, 0, 0, 0.95)',
          border: '2px solid #0f0',
          borderRadius: '8px',
          zIndex: 999999,
          fontFamily: 'monospace',
          fontSize: '11px',
          overflow: 'hidden'
        }}
      >
        <div style={{
          padding: '8px',
          borderBottom: '1px solid #0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0, 255, 0, 0.1)'
        }}>
          <span style={{ color: '#0f0', fontWeight: 'bold' }}>🔍 DEBUG ({logs.length})</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Maximize2 
              size={14} 
              style={{ color: '#0f0', cursor: 'pointer' }}
              onClick={() => setIsExpanded(true)}
            />
            <X 
              size={14} 
              style={{ color: '#f00', cursor: 'pointer' }}
              onClick={() => setIsVisible(false)}
            />
          </div>
        </div>
        <div style={{
          padding: '8px',
          maxHeight: '100px',
          overflowY: 'auto'
        }}>
          {logs.slice(-5).map(log => (
            <div key={log.id} style={{ marginBottom: '4px', color: getLogColor(log.type) }}>
              <span style={{ opacity: 0.5 }}>[{log.timestamp}]</span> {log.emoji} {log.message.slice(0, 50)}...
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        width: '600px',
        height: '80vh',
        background: 'rgba(0, 0, 0, 0.98)',
        border: '2px solid #0f0',
        borderRadius: '8px',
        zIndex: 999999,
        fontFamily: 'monospace',
        fontSize: '11px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 0 20px rgba(0, 255, 0, 0.5)'
      }}
    >
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid #0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(0, 255, 0, 0.1)'
      }}>
        <span style={{ color: '#0f0', fontWeight: 'bold' }}>🔍 PRODUCTION DEBUG CONSOLE ({logs.length}/{maxLogs})</span>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }} title="Copy all logs">
            <Copy 
              size={16} 
              style={{ color: '#0f0', cursor: 'pointer' }}
              onClick={copyLogs}
            />
          </div>
          <div style={{ position: 'relative' }} title="Download logs">
            <Download 
              size={16} 
              style={{ color: '#0f0', cursor: 'pointer' }}
              onClick={downloadLogs}
            />
          </div>
          <div style={{ position: 'relative' }} title="Clear logs">
            <Trash2 
              size={16} 
              style={{ color: '#f00', cursor: 'pointer' }}
              onClick={clearLogs}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Minimize2 
              size={16} 
              style={{ color: '#0f0', cursor: 'pointer' }}
              onClick={() => setIsExpanded(false)}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <X 
              size={16} 
              style={{ color: '#f00', cursor: 'pointer' }}
              onClick={() => setIsVisible(false)}
            />
          </div>
        </div>
      </div>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px',
        color: '#0f0'
      }}>
        {logs.map(log => (
          <div 
            key={log.id} 
            style={{ 
              marginBottom: '6px', 
              borderBottom: '1px solid rgba(0, 255, 0, 0.1)',
              paddingBottom: '4px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ opacity: 0.5, minWidth: '70px' }}>[{log.timestamp}]</span>
              <span style={{ fontSize: '14px' }}>{log.emoji}</span>
              <span className={getLogColor(log.type)} style={{ flex: 1 }}>{log.message}</span>
            </div>
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>
      <div style={{
        padding: '8px',
        borderTop: '1px solid #0f0',
        background: 'rgba(0, 255, 0, 0.05)',
        color: '#0f0',
        fontSize: '10px',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>Press Ctrl+Shift+D to toggle</span>
        <span>Auto-scrolls to latest</span>
      </div>
    </div>
  );
};
