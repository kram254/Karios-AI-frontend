export interface WorkflowNode {
  id: string;
  type: 'agent' | 'mcp' | 'if-else' | 'while' | 'user-approval' | 'transform' | 'set-state' | 'end' | 'start' | 'guardrails' | 'tool' | 'phase' | 'condition' | 'loop' | 'note';
  position: { x: number; y: number };
  data: NodeData;
  title?: string;
  subtitle?: string;
  items?: any[];
}

export interface NodeData {
  label: string;
  nodeType?: string;
  nodeName?: string;
  name?: string;
  instructions?: string;
  model?: string;
  includeChatHistory?: boolean;
  tools?: string[];
  outputFormat?: string;
  reasoningEffort?: string;
  jsonOutputSchema?: string;
  jsonSchema?: any;
  mcpTools?: any[];
  systemPrompt?: string;
  mcpServers?: MCPServer[];
  mcpAction?: string;
  outputField?: string;
  inputVariables?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
    defaultValue?: any;
  }>;
  condition?: string;
  truePath?: string;
  falsePath?: string;
  trueLabel?: string;
  falseLabel?: string;
  transformScript?: string;
  stateKey?: string;
  stateValue?: string;
  noteText?: string;
  transformType?: string;
  mcpTool?: string;
  piiEnabled?: boolean;
  searchQuery?: string;
  mapUrl?: string;
  batchUrls?: string;
  guardrailType?: string;
  scrapeUrl?: string;
  whileCondition?: string;
  approvalMessage?: string;
  outputMapping?: string | any;
  scrapeFormats?: string[];
  mcpParams?: any;
  moderationEnabled?: boolean;
  jailbreakEnabled?: boolean;
  hallucinationEnabled?: boolean;
  searchLimit?: number;
  mapLimit?: number;
  actionOnViolation?: string;
  maxIterations?: number | string;
  timeoutMinutes?: number | string;
}

export interface MCPServer {
  id: string;
  name: string;
  label: string;
  url: string;
  description?: string;
  authType: string;
  accessToken?: string;
  tools?: any[];
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  sourceHandle?: string;
  from?: string;
  to?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  estimatedTime?: string;
  difficulty?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'paused' | 'waiting-auth';
  currentNodeId?: string;
  nodeResults: Record<string, NodeExecutionResult>;
  startedAt: string;
  completedAt?: string;
  error?: string;
  pendingAuth?: WorkflowPendingAuth;
}

export interface NodeExecutionResult {
  nodeId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'pending-authorization' | 'pending-approval';
  input?: any;
  output?: any;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  toolCalls?: Array<{
    name?: string;
    arguments?: any;
    output?: any;
  }>;
  pendingAuth?: WorkflowPendingAuth;
}

export interface WorkflowState {
  variables: Record<string, any>;
  chatHistory: Array<{ role: string; content: string }>;
}

export interface WorkflowPendingAuth {
  authId: string;
  nodeId: string;
  toolName: string;
  authUrl?: string | null;
  status: 'pending' | 'completed' | 'failed';
  userId?: string;
  message?: string;
  threadId?: string;
  executionId?: string;
}
