import React, { useState, useEffect } from 'react';
import { Sparkles, Lightbulb, Wand2, X, Check } from 'lucide-react';
import axios from 'axios';

interface CopilotSuggestion {
  type: 'node' | 'connection' | 'prompt' | 'fix';
  title: string;
  description: string;
  action: () => void;
  confidence: number;
}

interface AICopilotProps {
  selectedNodeId: string | null;
  nodes: any[];
  edges: any[];
  onAddNode: (type: string, position: { x: number; y: number }) => void;
  onUpdateNode: (nodeId: string, updates: any) => void;
  onConnect: (source: string, target: string) => void;
  validationErrors: any[];
}

export function AICopilot({
  selectedNodeId,
  nodes,
  edges,
  onAddNode,
  onUpdateNode,
  onConnect,
  validationErrors
}: AICopilotProps) {
  const [suggestions, setSuggestions] = useState<CopilotSuggestion[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    generateSuggestions();
  }, [selectedNodeId, nodes, edges, validationErrors]);

  const generateSuggestions = async () => {
    const newSuggestions: CopilotSuggestion[] = [];

    if (selectedNodeId) {
      const node = nodes.find(n => n.id === selectedNodeId);
      if (node?.data?.nodeType === 'agent') {
        if (!node.data.config?.prompt || node.data.config.prompt.length < 50) {
          newSuggestions.push({
            type: 'prompt',
            title: 'Generate System Prompt',
            description: 'AI can write a detailed system prompt for this agent',
            confidence: 0.9,
            action: () => generatePrompt(node)
          });
        }
      }

      const outgoingEdges = edges.filter(e => e.source === selectedNodeId);
      if (outgoingEdges.length === 0 && node?.data?.nodeType !== 'end') {
        newSuggestions.push({
          type: 'node',
          title: 'Add Next Step',
          description: 'Suggest what node should come next',
          confidence: 0.85,
          action: () => suggestNextNode(node)
        });
      }
    }

    if (validationErrors.length > 0) {
      newSuggestions.push({
        type: 'fix',
        title: 'Auto-Fix Errors',
        description: `Fix ${validationErrors.length} validation error(s)`,
        confidence: 0.8,
        action: () => autoFixErrors()
      });
    }

    const agentNodes = nodes.filter(n => n.data?.nodeType === 'agent');
    if (agentNodes.length > 0) {
      const lastAgent = agentNodes[agentNodes.length - 1];
      const hasGuardrail = nodes.some(n => n.data?.nodeType === 'guardrail');
      if (!hasGuardrail) {
        newSuggestions.push({
          type: 'node',
          title: 'Add Safety Guardrail',
          description: 'Protect against harmful outputs',
          confidence: 0.75,
          action: () => addGuardrailNode(lastAgent)
        });
      }
    }

    setSuggestions(newSuggestions.slice(0, 3));
  };

  const generatePrompt = async (node: any) => {
    setIsGenerating(true);
    try {
      const response = await axios.post('/api/workflows/generate-prompt', {
        nodeType: node.data.nodeType,
        workflowContext: {
          nodes: nodes.map(n => ({ id: n.id, type: n.data.nodeType })),
          position: nodes.indexOf(node)
        }
      });

      onUpdateNode(node.id, {
        config: {
          ...node.data.config,
          prompt: response.data.prompt
        }
      });
    } catch (error) {
      console.error('Failed to generate prompt:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const suggestNextNode = async (currentNode: any) => {
    setIsGenerating(true);
    try {
      const response = await axios.post('/api/workflows/suggest-next-node', {
        currentNode: currentNode.data.nodeType,
        workflowNodes: nodes.map(n => n.data.nodeType)
      });

      const position = {
        x: currentNode.position.x,
        y: currentNode.position.y + 180
      };

      const newNodeId = onAddNode(response.data.nodeType, position);
      if (newNodeId) {
        onConnect(currentNode.id, newNodeId);
      }
    } catch (error) {
      console.error('Failed to suggest node:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const autoFixErrors = () => {
    validationErrors.forEach(error => {
      if (error.nodeId && error.type === 'error') {
        const node = nodes.find(n => n.id === error.nodeId);
        if (node) {
          const fixes: any = {};
          if (error.message.includes('prompt')) {
            fixes.prompt = 'You are a helpful AI assistant.';
          }
          if (error.message.includes('model')) {
            fixes.model = 'gpt-4';
          }
          if (Object.keys(fixes).length > 0) {
            onUpdateNode(error.nodeId, { config: { ...node.data.config, ...fixes } });
          }
        }
      }
    });
  };

  const addGuardrailNode = (afterNode: any) => {
    const position = {
      x: afterNode.position.x,
      y: afterNode.position.y + 180
    };
    onAddNode('guardrail', position);
  };

  if (!isVisible || suggestions.length === 0) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          width: 48,
          height: 48,
          borderRadius: '50%',
          backgroundColor: '#8b5cf6',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
          zIndex: 999,
        }}
      >
        <Sparkles size={20} color="white" />
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 360,
        backgroundColor: '#0a0a0a',
        border: '1px solid #8b5cf6',
        borderRadius: 12,
        boxShadow: '0 8px 24px rgba(139, 92, 246, 0.3)',
        zIndex: 999,
      }}
    >
      <div
        style={{
          padding: 16,
          borderBottom: '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} color="#8b5cf6" />
          <span style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>AI Copilot</span>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            padding: 4,
          }}
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ padding: 16 }}>
        {isGenerating && (
          <div style={{ textAlign: 'center', padding: 20, color: '#888' }}>
            <Wand2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
            <div style={{ fontSize: 12 }}>Generating...</div>
          </div>
        )}

        {!isGenerating && suggestions.map((suggestion, index) => (
          <div
            key={index}
            style={{
              marginBottom: 12,
              padding: 12,
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#8b5cf6';
              e.currentTarget.style.backgroundColor = '#8b5cf620';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#333';
              e.currentTarget.style.backgroundColor = '#1a1a1a';
            }}
            onClick={suggestion.action}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Lightbulb size={14} color="#f59e0b" />
              <span style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>
                {suggestion.title}
              </span>
              <div
                style={{
                  marginLeft: 'auto',
                  fontSize: 10,
                  color: '#10b981',
                  backgroundColor: '#10b98120',
                  padding: '2px 6px',
                  borderRadius: 4,
                }}
              >
                {Math.round(suggestion.confidence * 100)}%
              </div>
            </div>
            <div style={{ color: '#888', fontSize: 11 }}>{suggestion.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
