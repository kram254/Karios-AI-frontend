import React from 'react';
import { X, PlayCircle, Bot, Wrench, Shuffle, GitBranch, RotateCw, ShieldCheck, StopCircle, StickyNote } from 'lucide-react';
import type { NodeType } from '../../types/workflow';

interface NodesLibraryProps {
  onAddNode: (type: NodeType) => void;
  onClose: () => void;
}

const nodeCategories = [
  {
    title: 'Flow Control',
    nodes: [
      { type: 'start' as NodeType, label: 'Start', icon: PlayCircle, color: '#10b981', description: 'Workflow entry point' },
      { type: 'end' as NodeType, label: 'End', icon: StopCircle, color: '#ef4444', description: 'Workflow completion' },
    ],
  },
  {
    title: 'AI & Data',
    nodes: [
      { type: 'agent' as NodeType, label: 'AI Agent', icon: Bot, color: '#3b82f6', description: 'LLM reasoning node' },
      { type: 'mcp-tool' as NodeType, label: 'MCP Tool', icon: Wrench, color: '#8b5cf6', description: 'External tool call' },
      { type: 'transform' as NodeType, label: 'Transform', icon: Shuffle, color: '#f59e0b', description: 'Data manipulation' },
    ],
  },
  {
    title: 'Logic',
    nodes: [
      { type: 'if-else' as NodeType, label: 'If/Else', icon: GitBranch, color: '#ec4899', description: 'Conditional branch' },
      { type: 'while' as NodeType, label: 'While Loop', icon: RotateCw, color: '#14b8a6', description: 'Loop iteration' },
    ],
  },
  {
    title: 'Human-in-Loop',
    nodes: [
      { type: 'approval' as NodeType, label: 'Approval', icon: ShieldCheck, color: '#06b6d4', description: 'User approval gate' },
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
        background: 'rgba(10, 10, 10, 0.85)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ margin: 0, color: 'white', fontSize: 16, fontWeight: 600 }}>Nodes Library</h3>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            borderRadius: '6px',
            color: '#999',
            cursor: 'pointer',
            padding: 6,
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.color = '#999';
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
                    padding: '8px',
                    marginBottom: '6px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    backdropFilter: 'blur(10px)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.borderColor = `${node.color}80`;
                    e.currentTarget.style.transform = 'translateX(4px)';
                    e.currentTarget.style.boxShadow = `0 4px 12px ${node.color}40`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: `linear-gradient(135deg, ${node.color}20, ${node.color}10)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1px solid ${node.color}30`,
                    }}
                  >
                    <Icon size={14} color={node.color} strokeWidth={2.5} />
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ color: 'white', fontSize: 11, fontWeight: 500, marginBottom: 1 }}>
                      {node.label}
                    </div>
                    <div style={{ color: '#999', fontSize: 9 }}>{node.description}</div>
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
