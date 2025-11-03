import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import type { Workflow } from '../../types/workflow';

interface WorkflowSettingsProps {
  workflow: Workflow | null;
  onClose: () => void;
  onUpdate: (updates: Partial<Workflow>) => void;
}

export function WorkflowSettings({ workflow, onClose, onUpdate }: WorkflowSettingsProps) {
  const [name, setName] = useState(workflow?.name || '');
  const [description, setDescription] = useState(workflow?.description || '');
  const [category, setCategory] = useState(workflow?.category || '');
  const [tags, setTags] = useState(workflow?.tags?.join(', ') || '');

  const handleSave = () => {
    onUpdate({
      name,
      description,
      category,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '500px',
          maxWidth: '90%',
          backgroundColor: '#1a1a1a',
          borderRadius: '12px',
          border: '1px solid #333',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
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
          <h3 style={{ margin: 0, color: 'white', fontSize: 16, fontWeight: 600 }}>Workflow Settings</h3>
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

        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: '#999', fontSize: 13, marginBottom: 8, fontWeight: 500 }}>
              Workflow Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#0a0a0a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: 'white',
                padding: '10px',
                fontSize: 14,
              }}
              placeholder="My Workflow"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: '#999', fontSize: 13, marginBottom: 8, fontWeight: 500 }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                minHeight: '80px',
                backgroundColor: '#0a0a0a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: 'white',
                padding: '10px',
                fontSize: 14,
                resize: 'vertical',
              }}
              placeholder="Describe what this workflow does..."
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: '#999', fontSize: 13, marginBottom: 8, fontWeight: 500 }}>
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#0a0a0a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: 'white',
                padding: '10px',
                fontSize: 14,
              }}
            >
              <option value="">Select a category</option>
              <option value="web-scraping">Web Scraping</option>
              <option value="data-processing">Data Processing</option>
              <option value="ai-automation">AI Automation</option>
              <option value="business">Business</option>
              <option value="research">Research</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', color: '#999', fontSize: 13, marginBottom: 8, fontWeight: 500 }}>
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#0a0a0a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: 'white',
                padding: '10px',
                fontSize: 14,
              }}
              placeholder="automation, web, ai"
            />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: '#333',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              <Save size={16} />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
