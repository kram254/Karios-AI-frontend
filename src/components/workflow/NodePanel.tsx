import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { NodePanelProps } from '../../types/workflow';

interface ExtendedNodePanelProps extends NodePanelProps {
  onDelete: () => void;
}

export function NodePanel({ nodeId, data, onUpdate, onClose, onDelete }: ExtendedNodePanelProps) {
  const [config, setConfig] = useState(data.config || {});
  const nodeType = data.nodeType;

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onUpdate({ config: newConfig });
  };

  return (
    <div
      style={{
        width: '360px',
        height: '100%',
        backgroundColor: '#1a1a1a',
        borderLeft: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
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
        <h3 style={{ margin: 0, color: 'white', fontSize: 16, fontWeight: 600 }}>{data.label}</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onDelete}
            style={{
              background: 'none',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Trash2 size={18} />
          </button>
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
      </div>

      <div style={{ padding: '16px', flex: 1, overflow: 'auto' }}>
        {nodeType === 'start' && (
          <div>
            <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>
              Input Variables (one per line)
            </label>
            <textarea
              value={(config.inputVariables as string[])?.join('\n') || ''}
              onChange={(e) => handleConfigChange('inputVariables', e.target.value.split('\n').filter(Boolean))}
              style={{
                width: '100%',
                minHeight: '100px',
                backgroundColor: '#0a0a0a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: 'white',
                padding: '8px',
                fontSize: 13,
                fontFamily: 'monospace',
                resize: 'vertical',
              }}
              placeholder="url\nquery\napi_key"
            />
          </div>
        )}

        {nodeType === 'agent' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>Prompt</label>
              <textarea
                value={config.prompt || ''}
                onChange={(e) => handleConfigChange('prompt', e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '120px',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px',
                  fontSize: 13,
                  resize: 'vertical',
                }}
                placeholder="Enter agent instructions..."
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>Model</label>
              <select
                value={config.model || 'gpt-4'}
                onChange={(e) => handleConfigChange('model', e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px',
                  fontSize: 13,
                }}
              >
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>Temperature</label>
              <input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={config.temperature || 0.7}
                onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px',
                  fontSize: 13,
                }}
              />
            </div>
          </>
        )}

        {nodeType === 'transform' && (
          <div>
            <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>
              Transform Code (JavaScript)
            </label>
            <textarea
              value={config.code || ''}
              onChange={(e) => handleConfigChange('code', e.target.value)}
              style={{
                width: '100%',
                minHeight: '200px',
                backgroundColor: '#0a0a0a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: 'white',
                padding: '8px',
                fontSize: 13,
                fontFamily: 'monospace',
                resize: 'vertical',
              }}
              placeholder="// Transform input data\nreturn input.toUpperCase();"
            />
          </div>
        )}

        {nodeType === 'if-else' && (
          <div>
            <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>Condition</label>
            <textarea
              value={config.condition || ''}
              onChange={(e) => handleConfigChange('condition', e.target.value)}
              style={{
                width: '100%',
                minHeight: '80px',
                backgroundColor: '#0a0a0a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: 'white',
                padding: '8px',
                fontSize: 13,
                fontFamily: 'monospace',
                resize: 'vertical',
              }}
              placeholder="input.value > 100"
            />
          </div>
        )}

        {nodeType === 'while' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>Loop Condition</label>
              <textarea
                value={config.condition || ''}
                onChange={(e) => handleConfigChange('condition', e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '80px',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px',
                  fontSize: 13,
                  fontFamily: 'monospace',
                  resize: 'vertical',
                }}
                placeholder="index < array.length"
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>Max Iterations</label>
              <input
                type="number"
                min="1"
                max="100"
                value={config.maxIterations || 10}
                onChange={(e) => handleConfigChange('maxIterations', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px',
                  fontSize: 13,
                }}
              />
            </div>
          </>
        )}

        {nodeType === 'approval' && (
          <div>
            <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>Approval Message</label>
            <textarea
              value={config.approvalMessage || ''}
              onChange={(e) => handleConfigChange('approvalMessage', e.target.value)}
              style={{
                width: '100%',
                minHeight: '100px',
                backgroundColor: '#0a0a0a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: 'white',
                padding: '8px',
                fontSize: 13,
                resize: 'vertical',
              }}
              placeholder="Please review the results before continuing..."
            />
          </div>
        )}

        {nodeType === 'mcp-tool' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>Tool Name</label>
              <input
                type="text"
                value={config.tool || ''}
                onChange={(e) => handleConfigChange('tool', e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px',
                  fontSize: 13,
                }}
                placeholder="e.g., scrape, search, analyze"
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>Tool Arguments (JSON)</label>
              <textarea
                value={JSON.stringify(config.toolArgs || {}, null, 2)}
                onChange={(e) => {
                  try {
                    handleConfigChange('toolArgs', JSON.parse(e.target.value));
                  } catch {}
                }}
                style={{
                  width: '100%',
                  minHeight: '120px',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '8px',
                  fontSize: 13,
                  fontFamily: 'monospace',
                  resize: 'vertical',
                }}
                placeholder='{\n  "url": "https://example.com"\n}'
              />
            </div>
          </>
        )}

        {nodeType === 'end' && (
          <div>
            <label style={{ display: 'block', color: '#999', fontSize: 12, marginBottom: 8 }}>Output Variable</label>
            <input
              type="text"
              value={config.outputVariable || ''}
              onChange={(e) => handleConfigChange('outputVariable', e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#0a0a0a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: 'white',
                padding: '8px',
                fontSize: 13,
              }}
              placeholder="result"
            />
          </div>
        )}
      </div>
    </div>
  );
}
