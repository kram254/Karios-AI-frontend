import React, { useMemo } from 'react';
import { EnhancedMultiAgentWorkflowCard } from './EnhancedMultiAgentWorkflowCard';
import { useWorkflowStore, AgentUpdate, ClarificationRequest } from '../hooks/useWorkflowStore';
import { workflowMessageQueue } from '../services/workflowMessageQueue';

interface WorkflowPanelProps {
  taskId: string;
  onClarificationResponse: (taskId: string, response: string) => void;
  compact?: boolean;
  showKariosBrowser?: boolean;
  browserHeadlessMode?: boolean;
  browserCurrentAction?: string;
  updateCounter?: number;
  workflowData?: any;
  clarificationData?: any;
}

export const WorkflowPanel: React.FC<WorkflowPanelProps> = ({
  taskId,
  onClarificationResponse,
  compact = false,
  showKariosBrowser = false,
  browserHeadlessMode = false,
  browserCurrentAction = '',
  updateCounter = 0,
  workflowData,
  clarificationData
}) => {
  const { 
    getWorkflowForTask, 
    getClarificationForTask,
    updateCounter: storeUpdateCounter 
  } = useWorkflowStore();

  const effectiveUpdateCounter = updateCounter || storeUpdateCounter;

  const workflow = useMemo(() => {
    if (workflowData) return workflowData;
    return getWorkflowForTask(taskId) || { 
      taskId,
      workflowStage: 'Initializing',
      lastUpdate: new Date().toISOString(),
      agentUpdates: [],
      planSteps: [],
      executionItems: []
    };
  }, [taskId, effectiveUpdateCounter, getWorkflowForTask, workflowData]);

  const clarificationRequest = useMemo(() => {
    if (clarificationData) return clarificationData;
    return getClarificationForTask(taskId);
  }, [taskId, effectiveUpdateCounter, getClarificationForTask, clarificationData]);

  const normalizedAgentUpdates = useMemo(() => {
    const queuedMessages = workflowMessageQueue.getAllMessages(taskId);
    const reactUpdates = workflow?.agentUpdates || [];
    
    const updatesToRender = queuedMessages.length > 0 ? queuedMessages : reactUpdates;
    
    if (queuedMessages.length > 0) {
      queuedMessages.forEach(msg => {
        if (!msg.rendered) {
          workflowMessageQueue.markAsRendered(taskId, msg.sequence);
        }
      });
    }
    
    return updatesToRender.map((update: any): AgentUpdate => {
      const allowedStatuses: Array<'started' | 'completed' | 'failed' | 'processing'> = 
        ['started', 'completed', 'failed', 'processing'];
      
      const status = allowedStatuses.includes((update.status || '').toLowerCase() as any)
        ? (update.status as 'started' | 'completed' | 'failed' | 'processing')
        : 'processing';
      
      return {
        type: update.type || 'agent_status',
        agent_type: update.agent_type || update.agentType || update.agent || 'UNKNOWN',
        status,
        message: update.message || '',
        data: update.data,
        timestamp: update.timestamp
      };
    });
  }, [taskId, effectiveUpdateCounter, workflow]);

  const normalizedClarificationRequest = useMemo((): ClarificationRequest | undefined => {
    if (!clarificationRequest) return undefined;
    
    return {
      type: clarificationRequest.type || 'clarification_request',
      task_id: clarificationRequest.task_id || taskId,
      clarification_request: clarificationRequest.clarification_request || '',
      message: clarificationRequest.message || '',
      timestamp: clarificationRequest.timestamp
    };
  }, [clarificationRequest, taskId]);

  return (
    <div 
      className="multi-agent-workflow-message mb-4" 
      key={`workflow-panel-container-${taskId}-${effectiveUpdateCounter}`}
    >
      <EnhancedMultiAgentWorkflowCard
        key={`workflow-panel-card-${taskId}-${effectiveUpdateCounter}`}
        taskId={taskId}
        workflowStage={workflow?.workflowStage || 'Initializing'}
        agentUpdates={normalizedAgentUpdates}
        planSteps={workflow?.planSteps || []}
        executionItems={workflow?.executionItems || []}
        reviewData={workflow?.reviewData}
        clarificationRequest={normalizedClarificationRequest}
        onClarificationResponse={onClarificationResponse}
        compact={compact || (showKariosBrowser && !browserHeadlessMode)}
        browserHeadlessMode={browserHeadlessMode}
        browserCurrentAction={browserCurrentAction}
      />
    </div>
  );
};

interface ActiveWorkflowPanelProps {
  onClarificationResponse: (taskId: string, response: string) => void;
  compact?: boolean;
  showKariosBrowser?: boolean;
  browserHeadlessMode?: boolean;
  browserCurrentAction?: string;
  updateCounter?: number;
}

export const ActiveWorkflowPanel: React.FC<ActiveWorkflowPanelProps> = ({
  onClarificationResponse,
  compact = false,
  showKariosBrowser = false,
  browserHeadlessMode = false,
  browserCurrentAction = '',
  updateCounter = 0
}) => {
  const { activeTaskId, updateCounter: storeUpdateCounter } = useWorkflowStore();

  if (!activeTaskId) return null;

  return (
    <WorkflowPanel
      taskId={activeTaskId}
      onClarificationResponse={onClarificationResponse}
      compact={compact}
      showKariosBrowser={showKariosBrowser}
      browserHeadlessMode={browserHeadlessMode}
      browserCurrentAction={browserCurrentAction}
      updateCounter={updateCounter || storeUpdateCounter}
    />
  );
};

export default WorkflowPanel;
