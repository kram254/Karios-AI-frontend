import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { PlayCircle, Bot, Wrench, Shuffle, GitBranch, RotateCw, ShieldCheck, StopCircle, StickyNote } from 'lucide-react';

export function CustomNode({ data, selected }: NodeProps) {
  const nodeType = data.nodeType;
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
    return '1px solid #e5e7eb';
  };

  const getBackgroundColor = () => {
    if (nodeType === 'note') return '#fef3c7';
    if (nodeType === 'if-else' || nodeType === 'while') return '#fff7ed';
    return 'white';
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
        padding: '12px',
        borderRadius: '8px',
        border: getBorderStyle(),
        backgroundColor: getBackgroundColor(),
        minWidth: '160px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.2s ease',
      }}
    >
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        {getNodeIcon(nodeType)}
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
            marginTop: '4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {data.config.prompt.substring(0, 40)}...
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

function getNodeIcon(type: string) {
  const iconStyle = { width: '16px', height: '16px' };
  
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
