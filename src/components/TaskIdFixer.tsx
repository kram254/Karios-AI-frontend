import React, { useEffect, useRef } from 'react';

interface TaskIdFixerProps {
  chatId: string;
  onTaskIdReceived: (taskId: string) => void;
}

export const TaskIdFixer: React.FC<TaskIdFixerProps> = ({ chatId, onTaskIdReceived }) => {
  const lastTaskIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!chatId) return;

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
