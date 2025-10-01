import React, { useEffect, useRef } from 'react';
import multiAgentWebSocketService, { MultiAgentWSMessage } from '../services/multiAgentWebSocket';

interface TaskIdFixerProps {
  chatId: string;
  onTaskIdReceived: (taskId: string) => void;
}

export const TaskIdFixer: React.FC<TaskIdFixerProps> = ({ chatId, onTaskIdReceived }) => {
  const lastTaskIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!chatId) return;

    const callbacks = {
      onAgentStatus: (data: MultiAgentWSMessage) => {
        if (data.task_id && data.task_id !== lastTaskIdRef.current) {
          lastTaskIdRef.current = data.task_id;
          onTaskIdReceived(data.task_id);
          console.log('🔥 TASK ID FIXER - Backend task ID received:', data.task_id);
        }
      },
      
      onClarificationRequest: (data: MultiAgentWSMessage) => {
        if (data.task_id && data.task_id !== lastTaskIdRef.current) {
          lastTaskIdRef.current = data.task_id;
          onTaskIdReceived(data.task_id);
          console.log('🔥 TASK ID FIXER - Backend task ID from clarification:', data.task_id);
        }
      },
      
      onWorkflowStarted: (data: MultiAgentWSMessage) => {
        if (data.task_id && data.task_id !== lastTaskIdRef.current) {
          lastTaskIdRef.current = data.task_id;
          onTaskIdReceived(data.task_id);
          console.log('🔥 TASK ID FIXER - Backend task ID from workflow_started:', data.task_id);
        }
      }
    };

    if (!multiAgentWebSocketService.isConnected()) {
      multiAgentWebSocketService.connect(chatId, callbacks);
    }

    const handleTaskCreated = (event: CustomEvent) => {
      const { taskId } = event.detail;
      if (taskId && taskId !== lastTaskIdRef.current) {
        lastTaskIdRef.current = taskId;
        onTaskIdReceived(taskId);
        console.log('🔥 TASK ID FIXER - Task created event:', taskId);
      }
    };

    window.addEventListener('multi-agent-task-created', handleTaskCreated as EventListener);

    return () => {
      window.removeEventListener('multi-agent-task-created', handleTaskCreated as EventListener);
    };
  }, [chatId, onTaskIdReceived]);

  return null;
};
