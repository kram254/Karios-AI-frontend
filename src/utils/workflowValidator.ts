import type { WorkflowNode, WorkflowEdge } from '../types/workflow';

export interface ValidationError {
  type: 'error' | 'warning';
  message: string;
  nodeId?: string;
  edgeId?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export function validateWorkflow(nodes: WorkflowNode[], edges: WorkflowEdge[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (nodes.length === 0) {
    errors.push({ type: 'error', message: 'Workflow must have at least one node' });
    return { isValid: false, errors, warnings };
  }

  const startNodes = nodes.filter(n => n.data.nodeType === 'start');
  const endNodes = nodes.filter(n => n.data.nodeType === 'end');

  if (startNodes.length === 0) {
    errors.push({ type: 'error', message: 'Workflow must have exactly one Start node' });
  } else if (startNodes.length > 1) {
    errors.push({ type: 'error', message: 'Workflow can only have one Start node' });
    startNodes.forEach(node => {
      errors.push({ type: 'error', message: 'Duplicate Start node', nodeId: node.id });
    });
  }

  if (endNodes.length === 0) {
    warnings.push({ type: 'warning', message: 'Workflow should have at least one End node' });
  }

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const edgeMap = new Map<string, WorkflowEdge[]>();
  
  edges.forEach(edge => {
    if (!edgeMap.has(edge.source)) {
      edgeMap.set(edge.source, []);
    }
    edgeMap.get(edge.source)!.push(edge);
  });

  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function detectCycle(nodeId: string): boolean {
    if (recursionStack.has(nodeId)) {
      return true;
    }
    if (visited.has(nodeId)) {
      return false;
    }

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const outgoingEdges = edgeMap.get(nodeId) || [];
    for (const edge of outgoingEdges) {
      if (detectCycle(edge.target)) {
        errors.push({
          type: 'error',
          message: 'Circular dependency detected',
          nodeId,
          edgeId: edge.id,
        });
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  startNodes.forEach(node => detectCycle(node.id));

  const connectedNodes = new Set<string>();
  function markConnected(nodeId: string) {
    if (connectedNodes.has(nodeId)) return;
    connectedNodes.add(nodeId);
    
    const outgoingEdges = edgeMap.get(nodeId) || [];
    outgoingEdges.forEach(edge => {
      if (nodeMap.has(edge.target)) {
        markConnected(edge.target);
      }
    });
  }

  startNodes.forEach(node => markConnected(node.id));

  nodes.forEach(node => {
    if (!connectedNodes.has(node.id) && node.data.nodeType !== 'start') {
      warnings.push({
        type: 'warning',
        message: 'Node is not connected to workflow',
        nodeId: node.id,
      });
    }
  });

  nodes.forEach(node => {
    const requiredFields = getRequiredFields(node.data.nodeType);
    requiredFields.forEach(field => {
      if (!node.data.config?.[field]) {
        errors.push({
          type: 'error',
          message: `Node is missing required field: ${field}`,
          nodeId: node.id,
        });
      }
    });
  });

  edges.forEach(edge => {
    if (!nodeMap.has(edge.source)) {
      errors.push({
        type: 'error',
        message: 'Edge source node does not exist',
        edgeId: edge.id,
      });
    }
    if (!nodeMap.has(edge.target)) {
      errors.push({
        type: 'error',
        message: 'Edge target node does not exist',
        edgeId: edge.id,
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

function getRequiredFields(nodeType: string): string[] {
  switch (nodeType) {
    case 'agent':
      return ['prompt', 'model'];
    case 'mcp-tool':
      return ['tool'];
    case 'transform':
      return ['code'];
    case 'if-else':
    case 'while':
      return ['condition'];
    default:
      return [];
  }
}
