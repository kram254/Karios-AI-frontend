import React, { useState, useEffect } from 'react';
import { Circle, Play, SkipForward, X } from 'lucide-react';

interface BreakpointDebuggerProps {
  nodes: any[];
  onToggleBreakpoint: (nodeId: string) => void;
  breakpoints: Set<string>;
  executionState: {
    isPaused: boolean;
    currentNodeId: string | null;
    variables: Record<string, any>;
  };
  onContinue: () => void;
  onStepOver: () => void;
}

export function BreakpointDebugger({
  nodes,
  onToggleBreakpoint,
  breakpoints,
  executionState,
  onContinue,
  onStepOver
}: BreakpointDebuggerProps) {
  const [selectedVariable, setSelectedVariable] = useState<string | null>(null);

  if (!executionState.isPaused) return null;

  const currentNode = nodes.find(n => n.id === executionState.currentNodeId);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '300px',
        backgroundColor: '#0a0a0a',
        borderTop: '2px solid #ef4444',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '12px 20px',
          backgroundColor: '#ef444420',
          borderBottom: '1px solid #ef4444',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Circle size={12} color="#ef4444" fill="#ef4444" />
          <span style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>
            Breakpoint Hit: {currentNode?.data?.label || 'Unknown Node'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onContinue}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            <Play size={14} />
            Continue
          </button>
          <button
            onClick={onStepOver}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            <SkipForward size={14} />
            Step Over
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: '50%', borderRight: '1px solid #333', padding: 16, overflow: 'auto' }}>
          <div style={{ color: '#888', fontSize: 11, marginBottom: 12, textTransform: 'uppercase' }}>
            Variables
          </div>
          {Object.entries(executionState.variables).map(([key, value]) => (
            <div
              key={key}
              onClick={() => setSelectedVariable(key)}
              style={{
                padding: '8px 12px',
                backgroundColor: selectedVariable === key ? '#8b5cf620' : '#1a1a1a',
                border: `1px solid ${selectedVariable === key ? '#8b5cf6' : '#333'}`,
                borderRadius: 6,
                marginBottom: 8,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#10b981', fontSize: 12, fontFamily: 'monospace' }}>
                  {key}
                </span>
                <span style={{ color: '#888', fontSize: 11 }}>
                  {typeof value}
                </span>
              </div>
              <div style={{ color: '#888', fontSize: 11, marginTop: 4, fontFamily: 'monospace' }}>
                {String(value).substring(0, 50)}{String(value).length > 50 ? '...' : ''}
              </div>
            </div>
          ))}
        </div>

        <div style={{ width: '50%', padding: 16, overflow: 'auto' }}>
          <div style={{ color: '#888', fontSize: 11, marginBottom: 12, textTransform: 'uppercase' }}>
            Breakpoints
          </div>
          {nodes.map((node) => {
            const hasBreakpoint = breakpoints.has(node.id);
            return (
              <div
                key={node.id}
                style={{
                  padding: '8px 12px',
                  backgroundColor: hasBreakpoint ? '#ef444420' : '#1a1a1a',
                  border: `1px solid ${hasBreakpoint ? '#ef4444' : '#333'}`,
                  borderRadius: 6,
                  marginBottom: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: 'white', fontSize: 12 }}>
                  {node.data?.label || node.id}
                </span>
                <button
                  onClick={() => onToggleBreakpoint(node.id)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: hasBreakpoint ? '#ef4444' : '#333',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 11,
                  }}
                >
                  {hasBreakpoint ? 'Remove' : 'Add'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
