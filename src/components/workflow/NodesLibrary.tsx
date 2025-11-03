import React from 'react';
import { X, Play, Database, Code, GitBranch, RefreshCw, UserCheck, Flag, StickyNote } from 'lucide-react';
import type { NodeType } from '../../types/workflow';

interface NodesLibraryProps {
  onAddNode: (type: NodeType) => void;
  onClose: () => void;
}

const nodeCategories = [
  {
    title: 'Flow Control',
    nodes: [
      { type: 'start' as NodeType, label: 'Start', icon: Play, color: '#10b981', description: 'Workflow entry point' },
      { type: 'end' as NodeType, label: 'End', icon: Flag, color: '#ef4444', description: 'Workflow completion' },
    ],
  },
  {
    title: 'AI & Data',
    nodes: [
      { type: 'agent' as NodeType, label: 'AI Agent', icon: Database, color: '#3b82f6', description: 'LLM reasoning node' },
      { type: 'mcp-tool' as NodeType, label: 'MCP Tool', icon: Code, color: '#8b5cf6', description: 'External tool call' },
      { type: 'transform' as NodeType, label: 'Transform', icon: Code, color: '#f59e0b', description: 'Data manipulation' },
    ],
  },
  {
    title: 'Logic',
    nodes: [
      { type: 'if-else' as NodeType, label: 'If/Else', icon: GitBranch, color: '#ef4444', description: 'Conditional branch' },
      { type: 'while' as NodeType, label: 'While Loop', icon: RefreshCw, color: '#f59e0b', description: 'Loop iteration' },
    ],
  },
  {
    title: 'Human-in-Loop',
    nodes: [
      { type: 'approval' as NodeType, label: 'Approval', icon: UserCheck, color: '#06b6d4', description: 'User approval gate' },
    ],
  },
  {
    title: 'Annotations',
    nodes: [
      { type: 'note' as NodeType, label: 'Note', icon: StickyNote, color: '#eab308', description: 'Visual annotation' },
    ],
  },
];

export function NodesLibrary({ onAddNode, onClose }: NodesLibraryProps) {
  return (
    <div
      style={{
        width: '280px',
        height: '100%',
        backgroundColor: '#1a1a1a',
        borderRight: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ margin: 0, color: 'white', fontSize: 16, fontWeight: 600 }}>Nodes Library</h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#999',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={18} />
        </button>
      </div>

      <div style={{ padding: '16px', flex: 1, overflow: 'auto' }}>
        {nodeCategories.map((category) => (
          <div key={category.title} style={{ marginBottom: 24 }}>
            <h4
              style={{
                margin: '0 0 12px 0',
                color: '#999',
                fontSize: 12,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {category.title}
            </h4>
            {category.nodes.map((node) => {
              const Icon = node.icon;
              return (
                <button
                  key={node.type}
                  onClick={() => onAddNode(node.type)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    marginBottom: '8px',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#222';
                    e.currentTarget.style.borderColor = node.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#0a0a0a';
                    e.currentTarget.style.borderColor = '#333';
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: `${node.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={16} color={node.color} />
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ color: 'white', fontSize: 13, fontWeight: 500, marginBottom: 2 }}>
                      {node.label}
                    </div>
                    <div style={{ color: '#999', fontSize: 11 }}>{node.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
