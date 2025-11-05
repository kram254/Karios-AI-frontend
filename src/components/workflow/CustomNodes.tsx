import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { PlayCircle, Bot, Wrench, Shuffle, GitBranch, RotateCw, ShieldCheck, StopCircle, StickyNote } from 'lucide-react';

export function CustomNode({ data, selected }: NodeProps) {
  const nodeType = data.nodeType || 'agent';
  const isRunning = data.isRunning;
  const executionStatus = data.executionStatus;

  const noteText = String((data as any).noteText || 'Double-click to edit note');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState<string>(noteText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getBorderStyle = () => {
    if (nodeType === 'note') return 'none';
    if (isRunning) return '2px solid #3b82f6';
    if (executionStatus === 'completed') return '2px solid #10b981';
    if (executionStatus === 'failed') return '2px solid #ef4444';
    if (selected) return '2px solid #8b5cf6';
    switch (nodeType) {
      case 'start':
        return '2px solid rgba(16, 185, 129, 0.4)';
      case 'agent':
        return '2px solid rgba(59, 130, 246, 0.4)';
      case 'mcp-tool':
        return '2px solid rgba(139, 92, 246, 0.4)';
      case 'transform':
        return '2px solid rgba(245, 158, 11, 0.4)';
      case 'if-else':
        return '2px solid rgba(236, 72, 153, 0.4)';
      case 'while':
        return '2px solid rgba(20, 184, 166, 0.4)';
      case 'approval':
        return '2px solid rgba(6, 182, 212, 0.4)';
      case 'end':
        return '2px solid rgba(239, 68, 68, 0.4)';
      default:
        return '1px solid rgba(255, 255, 255, 0.1)';
    }
  };

  const getBackgroundColor = () => {
    if (nodeType === 'note') return 'rgba(254, 243, 199, 0.95)';
    const baseColor = 'rgba(255, 255, 255, 0.85)';
    switch (nodeType) {
      case 'start':
        return `linear-gradient(135deg, ${baseColor}, rgba(16, 185, 129, 0.08))`;
      case 'agent':
        return `linear-gradient(135deg, ${baseColor}, rgba(59, 130, 246, 0.08))`;
      case 'mcp-tool':
        return `linear-gradient(135deg, ${baseColor}, rgba(139, 92, 246, 0.08))`;
      case 'transform':
        return `linear-gradient(135deg, ${baseColor}, rgba(245, 158, 11, 0.08))`;
      case 'if-else':
        return `linear-gradient(135deg, ${baseColor}, rgba(236, 72, 153, 0.08))`;
      case 'while':
        return `linear-gradient(135deg, ${baseColor}, rgba(20, 184, 166, 0.08))`;
      case 'approval':
        return `linear-gradient(135deg, ${baseColor}, rgba(6, 182, 212, 0.08))`;
      case 'end':
        return `linear-gradient(135deg, ${baseColor}, rgba(239, 68, 68, 0.08))`;
      default:
        return baseColor;
    }
  };

  const getBoxShadow = () => {
    if (isRunning) return '0 8px 24px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255,255,255,0.5)';
    if (executionStatus === 'completed') return '0 8px 24px rgba(16, 185, 129, 0.4), 0 0 0 1px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(255,255,255,0.5)';
    if (executionStatus === 'failed') return '0 8px 24px rgba(239, 68, 68, 0.4), 0 0 0 1px rgba(239, 68, 68, 0.1), inset 0 1px 0 rgba(255,255,255,0.5)';
    if (selected) return '0 8px 24px rgba(139, 92, 246, 0.4), 0 0 0 1px rgba(139, 92, 246, 0.1), inset 0 1px 0 rgba(255,255,255,0.5)';
    return '0 4px 16px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.5)';
  };

  const getTextColor = () => {
    if (nodeType === 'note') return '#92400e';
    return '#18181b';
  };

  useEffect(() => {
    if (nodeType === 'note') {
      setEditText(noteText);
    }
  }, [noteText, nodeType]);

  if (nodeType === 'note') {
    useEffect(() => {
      if (isEditing && textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
      }
    }, [isEditing]);

    const handleSave = () => {
      setIsEditing(false);
      if ((data as any).onUpdate) {
        (data as any).onUpdate({ noteText: editText });
      }
    };

    return (
      <div
        className="relative"
        onDoubleClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
        style={{
          padding: '10px',
          fontSize: '11px',
          backgroundColor: '#fef9c3',
          border: selected ? '2px solid #eab308' : 'none',
          borderRadius: '6px',
          minWidth: '140px',
          maxWidth: '200px',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        }}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSave();
              }
              if (e.key === 'Escape') {
                setIsEditing(false);
                setEditText(noteText);
              }
            }}
            style={{
              width: '100%',
              minHeight: '60px',
              padding: '4px',
              fontSize: '11px',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              color: '#92400e',
              fontFamily: 'inherit',
            }}
          />
        ) : (
          <div style={{ color: '#92400e', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {noteText}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '14px',
        border: getBorderStyle(),
        background: getBackgroundColor(),
        backdropFilter: 'blur(16px)',
        minWidth: '200px',
        boxShadow: getBoxShadow(),
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
      }} />
      {nodeType !== 'end' && (
        <Handle
          type="target"
          position={Position.Top}
          style={{
            background: '#8b5cf6',
            width: '8px',
            height: '8px',
            border: '2px solid white',
          }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: getGlassyIconBackground(nodeType),
          backdropFilter: 'blur(10px)',
          boxShadow: getIconShadow(nodeType),
          border: '1px solid rgba(255, 255, 255, 0.2)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)',
            transform: 'rotate(45deg)',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            {getNodeIcon(nodeType)}
          </div>
        </div>
        <div style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: getTextColor() }}>
          {data.label}
        </div>
        {isRunning && (
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#3b82f6',
              animation: 'pulse 2s infinite',
            }}
          />
        )}
      </div>

      {data.config?.prompt && (
        <div
          style={{
            fontSize: '10px',
            color: '#6b7280',
            marginTop: '10px',
            padding: '8px 10px',
            background: 'linear-gradient(135deg, rgba(0,0,0,0.02), rgba(0,0,0,0.04))',
            borderRadius: '6px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            border: '1px solid rgba(0,0,0,0.05)',
            backdropFilter: 'blur(4px)',
          }}
        >
          {data.config.prompt.substring(0, 40)}...
        </div>
      )}
      
      {getNodeTypeLabel(nodeType) && (
        <div
          style={{
            fontSize: '9px',
            color: getNodeTypeLabelColor(nodeType),
            marginTop: '8px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            textShadow: '0 1px 2px rgba(0,0,0,0.1)',
            display: 'inline-block',
            padding: '2px 6px',
            background: `${getNodeTypeLabelColor(nodeType)}15`,
            borderRadius: '4px',
            border: `1px solid ${getNodeTypeLabelColor(nodeType)}30`,
          }}
        >
          {getNodeTypeLabel(nodeType)}
        </div>
      )}

      {nodeType !== 'start' && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{
            background: '#8b5cf6',
            width: '8px',
            height: '8px',
            border: '2px solid white',
          }}
        />
      )}

      {(nodeType === 'if-else' || nodeType === 'while') && (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            style={{
              background: '#10b981',
              width: '8px',
              height: '8px',
              border: '2px solid white',
              top: '50%',
            }}
          />
          <Handle
            type="source"
            position={Position.Left}
            id="false"
            style={{
              background: '#ef4444',
              width: '8px',
              height: '8px',
              border: '2px solid white',
              top: '50%',
            }}
          />
        </>
      )}
    </div>
  );
}

function getGlassyIconBackground(type: string) {
  switch (type) {
    case 'start':
      return 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.35))';
    case 'agent':
      return 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(37, 99, 235, 0.35))';
    case 'mcp-tool':
      return 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(124, 58, 237, 0.35))';
    case 'transform':
      return 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.35))';
    case 'if-else':
      return 'linear-gradient(135deg, rgba(236, 72, 153, 0.25), rgba(219, 39, 119, 0.35))';
    case 'while':
      return 'linear-gradient(135deg, rgba(20, 184, 166, 0.25), rgba(13, 148, 136, 0.35))';
    case 'approval':
      return 'linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(8, 145, 178, 0.35))';
    case 'end':
      return 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(220, 38, 38, 0.35))';
    case 'note':
      return 'linear-gradient(135deg, rgba(234, 179, 8, 0.25), rgba(202, 138, 4, 0.35))';
    default:
      return 'linear-gradient(135deg, rgba(156, 163, 175, 0.25), rgba(107, 114, 128, 0.35))';
  }
}

function getIconShadow(type: string) {
  switch (type) {
    case 'start':
      return '0 4px 12px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)';
    case 'agent':
      return '0 4px 12px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)';
    case 'mcp-tool':
      return '0 4px 12px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)';
    case 'transform':
      return '0 4px 12px rgba(245, 158, 11, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)';
    case 'if-else':
      return '0 4px 12px rgba(236, 72, 153, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)';
    case 'while':
      return '0 4px 12px rgba(20, 184, 166, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)';
    case 'approval':
      return '0 4px 12px rgba(6, 182, 212, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)';
    case 'end':
      return '0 4px 12px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)';
    case 'note':
      return '0 4px 12px rgba(234, 179, 8, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)';
    default:
      return '0 4px 12px rgba(156, 163, 175, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)';
  }
}

function getNodeTypeLabel(type: string) {
  switch (type) {
    case 'start':
      return 'Entry Point';
    case 'agent':
      return 'AI Agent';
    case 'mcp-tool':
      return 'MCP Tool';
    case 'transform':
      return 'Transform';
    case 'if-else':
      return 'Conditional';
    case 'while':
      return 'Loop';
    case 'approval':
      return 'Approval Gate';
    case 'end':
      return 'End Point';
    default:
      return null;
  }
}

function getNodeTypeLabelColor(type: string) {
  switch (type) {
    case 'start':
      return '#10b981';
    case 'agent':
      return '#3b82f6';
    case 'mcp-tool':
      return '#8b5cf6';
    case 'transform':
      return '#f59e0b';
    case 'if-else':
      return '#ec4899';
    case 'while':
      return '#14b8a6';
    case 'approval':
      return '#06b6d4';
    case 'end':
      return '#ef4444';
    default:
      return '#6b7280';
  }
}

function getNodeIcon(type: string) {
  const iconStyle = { width: '18px', height: '18px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' };
  
  switch (type) {
    case 'start':
      return <PlayCircle style={iconStyle} color="#10b981" fill="#10b981" fillOpacity={0.2} />;
    case 'agent':
      return <Bot style={iconStyle} color="#3b82f6" strokeWidth={2.5} />;
    case 'mcp-tool':
      return <Wrench style={iconStyle} color="#8b5cf6" strokeWidth={2.5} />;
    case 'transform':
      return <Shuffle style={iconStyle} color="#f59e0b" strokeWidth={2.5} />;
    case 'if-else':
      return <GitBranch style={iconStyle} color="#ec4899" strokeWidth={2.5} />;
    case 'while':
      return <RotateCw style={iconStyle} color="#14b8a6" strokeWidth={2.5} />;
    case 'approval':
      return <ShieldCheck style={iconStyle} color="#06b6d4" strokeWidth={2.5} />;
    case 'end':
      return <StopCircle style={iconStyle} color="#ef4444" fill="#ef4444" fillOpacity={0.2} />;
    case 'note':
      return <StickyNote style={iconStyle} color="#eab308" strokeWidth={2.5} />;
    default:
      return null;
  }
}

export const nodeTypes = {
  custom: CustomNode,
};
