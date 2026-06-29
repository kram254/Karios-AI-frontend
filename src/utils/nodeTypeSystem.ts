import type { NodeType } from '../types/workflow';

export interface NodeIOSchema {
  inputs: NodeInput[];
  outputs: NodeOutput[];
}

export interface NodeInput {
  name: string;
  type: DataType;
  required: boolean;
  description?: string;
}

export interface NodeOutput {
  name: string;
  type: DataType;
  description?: string;
}

export type DataType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'
  | 'any'
  | 'void';

export const NODE_TYPE_SCHEMAS: Record<NodeType, NodeIOSchema> = {
  'start': {
    inputs: [],
    outputs: [
      { name: 'context', type: 'object', description: 'Initial workflow context' }
    ],
  },
  'agent': {
    inputs: [
      { name: 'input', type: 'string', required: true, description: 'Input text for agent' },
      { name: 'context', type: 'object', required: false, description: 'Additional context' }
    ],
    outputs: [
      { name: 'response', type: 'string', description: 'Agent response' },
      { name: 'metadata', type: 'object', description: 'Response metadata' }
    ],
  },
  'mcp-tool': {
    inputs: [
      { name: 'toolInput', type: 'any', required: true, description: 'Tool input parameters' }
    ],
    outputs: [
      { name: 'result', type: 'any', description: 'Tool execution result' }
    ],
  },
  'transform': {
    inputs: [
      { name: 'data', type: 'any', required: true, description: 'Data to transform' }
    ],
    outputs: [
      { name: 'transformed', type: 'any', description: 'Transformed data' }
    ],
  },
  'if-else': {
    inputs: [
      { name: 'value', type: 'any', required: true, description: 'Value to evaluate' }
    ],
    outputs: [
      { name: 'result', type: 'boolean', description: 'Condition result' }
    ],
  },
  'while': {
    inputs: [
      { name: 'value', type: 'any', required: true, description: 'Value to evaluate' }
    ],
    outputs: [
      { name: 'result', type: 'boolean', description: 'Loop condition result' },
      { name: 'iteration', type: 'number', description: 'Current iteration' }
    ],
  },
  'approval': {
    inputs: [
      { name: 'data', type: 'any', required: true, description: 'Data for approval' }
    ],
    outputs: [
      { name: 'approved', type: 'boolean', description: 'Approval status' },
      { name: 'data', type: 'any', description: 'Passed through data' }
    ],
  },
  'end': {
    inputs: [
      { name: 'result', type: 'any', required: false, description: 'Final workflow result' }
    ],
    outputs: [],
  },
  'note': {
    inputs: [],
    outputs: [],
  },
  'condition': {
    inputs: [
      { name: 'value', type: 'any', required: true, description: 'Value to evaluate' }
    ],
    outputs: [
      { name: 'result', type: 'boolean', description: 'Condition result' }
    ],
  },
  'loop': {
    inputs: [
      { name: 'value', type: 'any', required: true, description: 'Value to evaluate' }
    ],
    outputs: [
      { name: 'result', type: 'boolean', description: 'Loop condition result' },
      { name: 'iteration', type: 'number', description: 'Current iteration' }
    ],
  },
  'guardrail': {
    inputs: [
      { name: 'text', type: 'string', required: false, description: 'Text to validate' }
    ],
    outputs: [
      { name: 'passed', type: 'boolean', description: 'Guardrail result' },
      { name: 'details', type: 'object', description: 'Validation details' }
    ],
  },
  'guardrails': {
    inputs: [
      { name: 'text', type: 'string', required: false, description: 'Text to validate' }
    ],
    outputs: [
      { name: 'passed', type: 'boolean', description: 'Guardrail result' },
      { name: 'details', type: 'object', description: 'Validation details' }
    ],
  },
  'set-state': {
    inputs: [
      { name: 'value', type: 'any', required: false, description: 'Value to store' }
    ],
    outputs: [
      { name: 'state', type: 'object', description: 'Updated state' }
    ],
  },
  'file-search': {
    inputs: [
      { name: 'query', type: 'string', required: true, description: 'Search query' }
    ],
    outputs: [
      { name: 'results', type: 'array', description: 'Search results' }
    ],
  },
  'webhook-trigger': {
    inputs: [],
    outputs: [
      { name: 'payload', type: 'object', description: 'Webhook payload' }
    ],
  },
  'schedule-trigger': {
    inputs: [],
    outputs: [
      { name: 'tick', type: 'object', description: 'Schedule trigger payload' }
    ],
  },
  'integration': {
    inputs: [
      { name: 'params', type: 'object', required: false, description: 'Integration parameters' }
    ],
    outputs: [
      { name: 'result', type: 'any', description: 'Integration result' }
    ],
  },
};

export function areTypesCompatible(sourceType: DataType, targetType: DataType): boolean {
  if (sourceType === 'any' || targetType === 'any') return true;
  if (sourceType === targetType) return true;
  
  if (targetType === 'string') {
    return true;
  }
  
  return false;
}

export function validateConnection(
  sourceNodeType: NodeType,
  targetNodeType: NodeType,
  sourceHandle?: string,
  targetHandle?: string
): { valid: boolean; message?: string } {
  if (sourceHandle === 'error') {
    return { valid: true };
  }
  const sourceSchema = NODE_TYPE_SCHEMAS[sourceNodeType];
  const targetSchema = NODE_TYPE_SCHEMAS[targetNodeType];

  if (sourceSchema.outputs.length === 0) {
    return { valid: false, message: 'Source node has no outputs' };
  }

  if (targetSchema.inputs.length === 0 && targetNodeType !== 'end') {
    return { valid: false, message: 'Target node has no inputs' };
  }

  const sourceOutput =
    (sourceHandle ? sourceSchema.outputs.find((o) => o.name === sourceHandle) : null) || sourceSchema.outputs[0];
  const targetInput =
    (targetHandle ? targetSchema.inputs.find((i) => i.name === targetHandle) : null) || targetSchema.inputs[0];

  if (targetInput && !areTypesCompatible(sourceOutput.type, targetInput.type)) {
    return {
      valid: false,
      message: `Type mismatch: ${sourceOutput.type} → ${targetInput.type}`,
    };
  }

  return { valid: true };
}

export function getNodeSchema(nodeType: NodeType): NodeIOSchema {
  return NODE_TYPE_SCHEMAS[nodeType];
}
