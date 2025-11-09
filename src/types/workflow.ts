export type NodeType = 
  | 'start'
  | 'agent'
  | 'mcp-tool'
  | 'transform'
  | 'if-else'
  | 'while'
  | 'approval'
  | 'end'
  | 'note'
  | 'guardrail'
  | 'set-state'
  | 'file-search';

export interface WorkflowNode {
  id: string;
  type: 'custom';
  position: { x: number; y: number };
  data: {
    label: string;
    nodeType: NodeType;
    isRunning?: boolean;
    executionStatus?: 'completed' | 'failed' | 'pending';
    config?: {
      prompt?: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
      reasoningEffort?: 'minimum' | 'low' | 'medium' | 'high';
      outputFormat?: 'text' | 'json' | 'widgets';
      verbosity?: 'low' | 'medium' | 'high';
      includeChatHistory?: boolean;
      writeConversationHistory?: boolean;
      showReasoning?: boolean;
      tools?: string[];
      mcpServer?: string;
      tool?: string;
      toolArgs?: Record<string, any>;
      code?: string;
      condition?: string;
      maxIterations?: number;
      iterationMode?: 'sequential' | 'parallel';
      approvalMessage?: string;
      requireMultiLevelApproval?: boolean;
      approvers?: string[];
      outputVariable?: string;
      inputVariables?: string[];
      noteText?: string;
      guardrailType?: 'moderation' | 'pii' | 'jailbreak' | 'hallucination' | 'custom';
      guardrailRules?: string[];
      vectorStoreId?: string;
      stateKey?: string;
      stateValue?: any;
      searchQuery?: string;
      topK?: number;
    };
    outputs?: Record<string, any>;
    inputs?: Record<string, any>;
    onUpdate?: (data: any) => void;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  type?: 'default' | 'smoothstep' | 'step' | 'straight';
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  difficulty?: string;
  estimatedTime?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
  version?: string;
  isTemplate?: boolean;
  isPublic?: boolean;
  userId?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  currentNodeId?: string;
  nodeResults: Record<string, any>;
  variables: Record<string, any>;
  input?: any;
  output?: any;
  error?: string;
  startedAt: string;
  completedAt?: string;
  threadId?: string;
}

export interface NodePanelProps {
  nodeId: string;
  data: WorkflowNode['data'];
  onUpdate: (updates: Partial<WorkflowNode['data']>) => void;
  onClose: () => void;
}

export interface ExecutionLog {
  timestamp: string;
  nodeId: string;
  message: string;
  level: 'info' | 'error' | 'warning' | 'success';
  data?: any;
}
