import { WorkflowEdge, WorkflowNode } from '../types/workflow.types';

export function cleanupOrphanedEdges(
  edges: WorkflowEdge[],
  nodes: WorkflowNode[]
): WorkflowEdge[] {
  const nodeIds = new Set(nodes.map(n => n.id));
  
  return edges.filter(edge => {
    const sourceId = edge.source || edge.from;
    const targetId = edge.target || edge.to;
    return nodeIds.has(sourceId) && nodeIds.has(targetId);
  });
}

export function removeDuplicateEdges(edges: WorkflowEdge[]): WorkflowEdge[] {
  const seen = new Set<string>();
  
  return edges.filter(edge => {
    const sourceId = edge.source || edge.from;
    const targetId = edge.target || edge.to;
    const key = `${sourceId}->${targetId}`;
    
    if (seen.has(key)) {
      return false;
    }
    
    seen.add(key);
    return true;
  });
}

export function detectCycles(
  edges: WorkflowEdge[],
  nodes: WorkflowNode[]
): string[][] {
  const graph = new Map<string, string[]>();
  
  nodes.forEach(node => {
    graph.set(node.id, []);
  });
  
  edges.forEach(edge => {
    const sourceId = edge.source || edge.from;
    const targetId = edge.target || edge.to;
    const neighbors = graph.get(sourceId) || [];
    neighbors.push(targetId);
    graph.set(sourceId, neighbors);
  });
  
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function dfs(nodeId: string, path: string[]): void {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);
    
    const neighbors = graph.get(nodeId) || [];
    
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, [...path]);
      } else if (recursionStack.has(neighbor)) {
        const cycleStart = path.indexOf(neighbor);
        if (cycleStart !== -1) {
          cycles.push(path.slice(cycleStart));
        }
      }
    }
    
    recursionStack.delete(nodeId);
  }
  
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      dfs(node.id, []);
    }
  });
  
  return cycles;
}

export function autoLayoutNodes(nodes: WorkflowNode[]): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  
  const startNodes = nodes.filter(n => n.type === 'start');
  const endNodes = nodes.filter(n => n.type === 'end');
  const otherNodes = nodes.filter(n => n.type !== 'start' && n.type !== 'end');
  
  const horizontalSpacing = 350;
  const verticalSpacing = 200;
  const nodesPerRow = 4;
  
  startNodes.forEach((node, i) => {
    positions.set(node.id, { x: 100, y: 100 + i * verticalSpacing });
  });
  
  otherNodes.forEach((node, i) => {
    const row = Math.floor(i / nodesPerRow);
    const col = i % nodesPerRow;
    positions.set(node.id, {
      x: 100 + (col + 1) * horizontalSpacing,
      y: 100 + row * verticalSpacing
    });
  });
  
  endNodes.forEach((node, i) => {
    const maxCol = Math.ceil(otherNodes.length / nodesPerRow);
    positions.set(node.id, {
      x: 100 + (maxCol + 1) * horizontalSpacing,
      y: 100 + i * verticalSpacing
    });
  });
  
  return positions;
}
