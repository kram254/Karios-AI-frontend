import { atom } from 'jotai';

const atomWithStorage = <T>(key: string, initialValue: T) => {
  const baseAtom = atom<T>(initialValue);
  
  const derivedAtom = atom(
    (get) => {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (stored) {
        try {
          return JSON.parse(stored) as T;
        } catch {
          return get(baseAtom);
        }
      }
      return get(baseAtom);
    },
    (get, set, update: T | ((prev: T) => T)) => {
      const nextValue = typeof update === 'function' 
        ? (update as (prev: T) => T)(get(derivedAtom))
        : update;
      set(baseAtom, nextValue);
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(nextValue));
      }
    }
  );
  
  return derivedAtom;
};

export interface AgentUpdate {
  type: string;
  agent_type: string;
  status: 'started' | 'completed' | 'failed' | 'processing';
  message: string;
  timestamp: string;
  data?: any;
  sequence?: number;
}

export interface WorkflowData {
  taskId: string;
  workflowStage: string;
  lastUpdate: string;
  agentUpdates: AgentUpdate[];
  planSteps: any[];
  executionItems: any[];
  reviewData?: any;
  clarificationNeeded?: boolean;
  currentStep?: string;
  stepProgress?: number;
}

export interface ClarificationRequest {
  type: string;
  task_id: string;
  clarification_request: string;
  message: string;
  timestamp: string;
}

export interface WorkflowState {
  workflows: Record<string, WorkflowData>;
  activeTaskId: string | null;
  clarificationRequests: Record<string, ClarificationRequest>;
  updateCounter: number;
  browserHeadlessMode: boolean;
  browserCurrentAction: string;
}

const initialState: WorkflowState = {
  workflows: {},
  activeTaskId: null,
  clarificationRequests: {},
  updateCounter: 0,
  browserHeadlessMode: false,
  browserCurrentAction: ''
};

export const workflowStateAtom = atomWithStorage<WorkflowState>('workflow-state', initialState);

export const activeWorkflowAtom = atom(
  (get) => {
    const state = get(workflowStateAtom);
    if (!state.activeTaskId) return null;
    return state.workflows[state.activeTaskId] || null;
  }
);

export const activeTaskIdAtom = atom(
  (get) => get(workflowStateAtom).activeTaskId,
  (get, set, taskId: string | null) => {
    set(workflowStateAtom, {
      ...get(workflowStateAtom),
      activeTaskId: taskId
    });
  }
);

export const updateCounterAtom = atom(
  (get) => get(workflowStateAtom).updateCounter
);

export const browserModeAtom = atom(
  (get) => ({
    headless: get(workflowStateAtom).browserHeadlessMode,
    currentAction: get(workflowStateAtom).browserCurrentAction
  }),
  (get, set, update: { headless?: boolean; currentAction?: string }) => {
    const current = get(workflowStateAtom);
    set(workflowStateAtom, {
      ...current,
      browserHeadlessMode: update.headless ?? current.browserHeadlessMode,
      browserCurrentAction: update.currentAction ?? current.browserCurrentAction
    });
  }
);

export const addAgentUpdateAtom = atom(
  null,
  (get, set, { taskId, update }: { taskId: string; update: AgentUpdate }) => {
    const current = get(workflowStateAtom);
    const existingWorkflow = current.workflows[taskId] || {
      taskId,
      workflowStage: 'Initializing',
      lastUpdate: new Date().toISOString(),
      agentUpdates: [],
      planSteps: [],
      executionItems: []
    };

    const isDuplicate = existingWorkflow.agentUpdates.some(
      (u) =>
        u.agent_type === update.agent_type &&
        u.status === update.status &&
        u.timestamp === update.timestamp
    );

    if (isDuplicate) {
      return;
    }

    const agentTypeMap: Record<string, string> = {
      'PROMPT_REFINER': 'Prompt Refiner',
      'PLANNER': 'Planner',
      'TASK_EXECUTOR': 'Task Executor',
      'REVIEWER': 'Reviewer',
      'FORMATTER': 'Formatter'
    };

    const agentName = agentTypeMap[update.agent_type] || update.agent_type || 'Unknown';
    const newWorkflowStage = update.status === 'completed' 
      ? `${agentName} Completed` 
      : `${agentName} Processing`;

    set(workflowStateAtom, {
      ...current,
      activeTaskId: taskId,
      updateCounter: current.updateCounter + 1,
      workflows: {
        ...current.workflows,
        [taskId]: {
          ...existingWorkflow,
          workflowStage: newWorkflowStage,
          lastUpdate: update.timestamp || new Date().toISOString(),
          agentUpdates: [...existingWorkflow.agentUpdates, update]
        }
      }
    });
  }
);

export const initializeWorkflowAtom = atom(
  null,
  (get, set, { taskId, workflowStage }: { taskId: string; workflowStage?: string }) => {
    const current = get(workflowStateAtom);
    const existingWorkflow = current.workflows[taskId];

    set(workflowStateAtom, {
      ...current,
      activeTaskId: taskId,
      updateCounter: current.updateCounter + 1,
      workflows: {
        ...current.workflows,
        [taskId]: {
          ...existingWorkflow,
          taskId,
          workflowStage: workflowStage || 'Initializing',
          lastUpdate: new Date().toISOString(),
          agentUpdates: existingWorkflow?.agentUpdates || [],
          planSteps: existingWorkflow?.planSteps || [],
          executionItems: existingWorkflow?.executionItems || []
        }
      }
    });
  }
);

export const setClarificationRequestAtom = atom(
  null,
  (get, set, { taskId, request }: { taskId: string; request: ClarificationRequest | null }) => {
    const current = get(workflowStateAtom);
    
    if (request === null) {
      const { [taskId]: _, ...rest } = current.clarificationRequests;
      set(workflowStateAtom, {
        ...current,
        clarificationRequests: rest
      });
    } else {
      set(workflowStateAtom, {
        ...current,
        updateCounter: current.updateCounter + 1,
        clarificationRequests: {
          ...current.clarificationRequests,
          [taskId]: request
        }
      });
    }
  }
);

export const clearWorkflowAtom = atom(
  null,
  (get, set, taskId: string) => {
    const current = get(workflowStateAtom);
    const { [taskId]: _, ...remainingWorkflows } = current.workflows;
    const { [taskId]: __, ...remainingClarifications } = current.clarificationRequests;

    set(workflowStateAtom, {
      ...current,
      workflows: remainingWorkflows,
      clarificationRequests: remainingClarifications,
      activeTaskId: current.activeTaskId === taskId ? null : current.activeTaskId
    });
  }
);

export const resetWorkflowStateAtom = atom(
  null,
  (_get, set) => {
    set(workflowStateAtom, initialState);
  }
);

export const getWorkflowUpdatesAtom = atom(
  (get) => {
    const state = get(workflowStateAtom);
    if (!state.activeTaskId) return [];
    const workflow = state.workflows[state.activeTaskId];
    if (!workflow) return [];
    return workflow.agentUpdates;
  }
);

export const getClarificationForTaskAtom = atom(
  (get) => {
    const state = get(workflowStateAtom);
    if (!state.activeTaskId) return null;
    return state.clarificationRequests[state.activeTaskId] || null;
  }
);
