import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  workflowStateAtom,
  activeWorkflowAtom,
  activeTaskIdAtom,
  updateCounterAtom,
  browserModeAtom,
  addAgentUpdateAtom,
  initializeWorkflowAtom,
  setClarificationRequestAtom,
  clearWorkflowAtom,
  resetWorkflowStateAtom,
  getWorkflowUpdatesAtom,
  getClarificationForTaskAtom,
  AgentUpdate,
  ClarificationRequest,
  WorkflowData
} from '../stores/workflowStore';

export function useWorkflowStore() {
  const [workflowState, setWorkflowState] = useAtom(workflowStateAtom);
  const activeWorkflow = useAtomValue(activeWorkflowAtom);
  const [activeTaskId, setActiveTaskId] = useAtom(activeTaskIdAtom);
  const updateCounter = useAtomValue(updateCounterAtom);
  const [browserMode, setBrowserMode] = useAtom(browserModeAtom);
  const addAgentUpdate = useSetAtom(addAgentUpdateAtom);
  const initializeWorkflow = useSetAtom(initializeWorkflowAtom);
  const setClarificationRequest = useSetAtom(setClarificationRequestAtom);
  const clearWorkflow = useSetAtom(clearWorkflowAtom);
  const resetWorkflowState = useSetAtom(resetWorkflowStateAtom);
  const workflowUpdates = useAtomValue(getWorkflowUpdatesAtom);
  const activeClarification = useAtomValue(getClarificationForTaskAtom);

  const handleAgentStatus = (data: {
    task_id: string;
    agent_type: string;
    status: string;
    message?: string;
    timestamp?: string;
    data?: any;
  }) => {
    if (!data.task_id) return;

    const allowedStatuses: Array<'started' | 'completed' | 'failed' | 'processing'> = 
      ['started', 'completed', 'failed', 'processing'];
    
    const status = allowedStatuses.includes(data.status as any)
      ? (data.status as 'started' | 'completed' | 'failed' | 'processing')
      : 'processing';

    const update: AgentUpdate = {
      type: 'agent_status',
      agent_type: data.agent_type || 'UNKNOWN',
      status,
      message: data.message || '',
      timestamp: data.timestamp || new Date().toISOString(),
      data: data.data
    };

    addAgentUpdate({ taskId: data.task_id, update });

    if (data.agent_type === 'TASK_EXECUTOR' && data.data) {
      if (data.data.headless !== undefined) {
        setBrowserMode({ headless: data.data.headless });
      }
      if (data.data.current_action || data.message) {
        setBrowserMode({ currentAction: data.data.current_action || data.message || '' });
      }
    }
  };

  const handleWorkflowStarted = (data: { task_id: string; workflow_stage?: string }) => {
    if (!data.task_id) return;
    initializeWorkflow({ taskId: data.task_id, workflowStage: data.workflow_stage });
  };

  const handleClarificationRequest = (data: {
    task_id: string;
    clarification_request?: string;
    message?: string;
    timestamp?: string;
  }) => {
    if (!data.task_id) return;

    const request: ClarificationRequest = {
      type: 'clarification_request',
      task_id: data.task_id,
      clarification_request: data.clarification_request || '',
      message: data.message || 'Please provide additional information to continue',
      timestamp: data.timestamp || new Date().toISOString()
    };

    setClarificationRequest({ taskId: data.task_id, request });
    setActiveTaskId(data.task_id);
  };

  const handleClarificationResolved = (taskId: string) => {
    setClarificationRequest({ taskId, request: null });
  };

  const handleTaskCompleted = (taskId: string) => {
    setBrowserMode({ currentAction: '' });
  };

  const getWorkflowForTask = (taskId: string): WorkflowData | null => {
    return workflowState.workflows[taskId] || null;
  };

  const getNormalizedUpdates = (taskId?: string): AgentUpdate[] => {
    const targetTaskId = taskId || activeTaskId;
    if (!targetTaskId) return [];
    
    const workflow = workflowState.workflows[targetTaskId];
    if (!workflow) return [];
    
    return workflow.agentUpdates.map((update) => {
      const allowedStatuses: Array<'started' | 'completed' | 'failed' | 'processing'> = 
        ['started', 'completed', 'failed', 'processing'];
      
      const status = allowedStatuses.includes(update.status)
        ? update.status
        : 'processing';
      
      return {
        ...update,
        type: update.type || 'agent_status',
        agent_type: update.agent_type || 'UNKNOWN',
        status,
        message: update.message || ''
      };
    });
  };

  const getClarificationForTask = (taskId: string): ClarificationRequest | null => {
    return workflowState.clarificationRequests[taskId] || null;
  };

  return {
    workflowState,
    activeWorkflow,
    activeTaskId,
    setActiveTaskId,
    updateCounter,
    browserMode,
    setBrowserMode,
    workflowUpdates,
    activeClarification,
    
    handleAgentStatus,
    handleWorkflowStarted,
    handleClarificationRequest,
    handleClarificationResolved,
    handleTaskCompleted,
    
    getWorkflowForTask,
    getNormalizedUpdates,
    getClarificationForTask,
    
    clearWorkflow,
    resetWorkflowState
  };
}

export type { AgentUpdate, ClarificationRequest, WorkflowData };
