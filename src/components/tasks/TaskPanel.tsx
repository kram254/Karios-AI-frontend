import React, { useState, useEffect } from 'react';
import { Plus, Zap, Square } from 'lucide-react';
import { TaskItem } from './TaskItem';
import { useChat } from '../../context/ChatContext';
import ClarificationModal from './ClarificationModal';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  progress: number;
}

interface TaskPanelProps {
  chatId: string;
  isWebAutomation?: boolean;
  onTaskModeChange?: (isTaskMode: boolean) => void;
  onCreateTask?: (taskInput: string) => void;
}

export const TaskPanel: React.FC<TaskPanelProps> = ({ chatId, isWebAutomation = false, onTaskModeChange, onCreateTask }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showStartTask, setShowStartTask] = useState(false);
  const [showClarificationModal, setShowClarificationModal] = useState(false);
  const [clarificationRequest, setClarificationRequest] = useState('');
  const [pendingTaskId, setPendingTaskId] = useState('');
  const { addMessage } = useChat();

  const generateTaskTitle = (prompt: string): string => {
    const cleanPrompt = prompt.trim();
    if (cleanPrompt.length <= 30) return cleanPrompt;
    
    const words = cleanPrompt.split(' ');
    if (words.length <= 4) return cleanPrompt.substring(0, 30);
    
    const keyWords = words.slice(0, 4).join(' ');
    return keyWords.length > 30 ? keyWords.substring(0, 27) + '...' : keyWords;
  };

  const createMultiAgentTask = async (taskInput: string) => {
    if (taskInput.trim()) {
      try {
        const response = await fetch('/api/multi-agent/create-task', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            user_id: 1,
            original_request: taskInput
          }),
        });

        const result = await response.json();

        if (result.success) {
          const taskTitle = generateTaskTitle(taskInput);
          const newTask = {
            id: result.task_id,
            title: taskTitle,
            description: taskInput,
            status: 'processing',
            progress: 10
          };
          
          setTasks(prev => [...prev, newTask]);
          setShowNewTask(false);
          setShowStartTask(false);
          
          await addMessage({
            role: 'user',
            content: taskInput,
            chatId: chatId
          });
          
          await addMessage({
            role: 'assistant',
            content: result.message || `✨ **Multi-Agent Task Created**\n\nTask ID: ${result.task_id}\n\nThe multi-agent system is processing your request...`,
            chatId: chatId
          });

          pollTaskStatus(result.task_id);
        } else {
          console.error('Failed to create multi-agent task:', result.error);
        }
      } catch (error) {
        console.error('Error creating multi-agent task:', error);
      }
    }
  };

  const pollTaskStatus = async (taskId: string) => {
    try {
      const response = await fetch(`/api/multi-agent/task/${taskId}/status`);
      const result = await response.json();

      if (result.success) {
        if (result.requires_clarification) {
          setPendingTaskId(taskId);
          setClarificationRequest(result.clarification_request || '');
          setShowClarificationModal(true);
        } else {
          setTasks(prev => prev.map(t => 
            t.id === taskId ? { 
              ...t, 
              status: result.workflow_stage,
              progress: getProgressFromStage(result.workflow_stage)
            } : t
          ));

          if (result.workflow_stage !== 'completed' && result.workflow_stage !== 'failed') {
            setTimeout(() => pollTaskStatus(taskId), 3000);
          }
        }
      }
    } catch (error) {
      console.error('Error polling task status:', error);
    }
  };

  const getProgressFromStage = (stage: string): number => {
    const stageProgress: Record<string, number> = {
      'created': 10,
      'refining': 20,
      'clarifying': 25,
      'planning': 40,
      'executing': 60,
      'reviewing': 80,
      'formatting': 90,
      'completed': 100,
      'failed': 0
    };
    return stageProgress[stage] || 10;
  };

  const handleClarificationSubmit = async (taskId: string, response: string) => {
    try {
      await fetch('/api/multi-agent/task/clarification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_id: taskId,
          clarification_response: response
        }),
      });

      setShowClarificationModal(false);
      setClarificationRequest('');
      setPendingTaskId('');
      
      setTimeout(() => pollTaskStatus(taskId), 1000);
    } catch (error) {
      console.error('Error submitting clarification:', error);
    }
  };

  const handleStartTask = () => {
    setShowStartTask(false);
    onTaskModeChange?.(true);
    const chatInput = document.querySelector('input[placeholder*="Ask"]') as HTMLInputElement;
    if (chatInput) {
      chatInput.focus();
    }
  };

  useEffect(() => {
    if (onCreateTask) {
      (window as any).createTaskFromChat = (taskInput: string) => {
        createMultiAgentTask(taskInput);
      };
    }
    return () => {
      delete (window as any).createTaskFromChat;
    };
  }, [onCreateTask, chatId]);

  if (isWebAutomation) return null;

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A]">
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#2A2A2A]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          <span className="text-white font-medium">Tasks</span>
        </div>
        <button
          onClick={() => {
            setShowNewTask(!showNewTask);
            if (!showNewTask) {
              setShowStartTask(true);
            } else {
              setShowStartTask(false);
            }
          }}
          className="flex items-center gap-1 px-2 py-1 text-xs text-blue-400 hover:text-blue-300 rounded"
        >
          <Plus className="w-3 h-3" />
          New Task
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {showNewTask && showStartTask && (
          <div className="p-4 border-b border-[#2A2A2A]">
            <button 
              onClick={handleStartTask}
              className="w-full flex items-center gap-2 bg-orange-100 text-orange-800 p-3 rounded hover:bg-orange-200 transition-colors"
            >
              <Zap className="w-4 h-4" />
              Start task
            </button>
            <button className="w-full flex items-center gap-2 text-gray-400 p-3 mt-2 rounded hover:bg-gray-700/30 transition-colors">
              <Square className="w-4 h-4" />
              Example case
            </button>
          </div>
        )}
        <div className="p-4">
          {tasks.length > 0 && (
            <div className="mb-3">
              <h3 className="text-gray-400 text-xs font-medium mb-3">Today</h3>
              {tasks.map(task => (
                <TaskItem key={task.id} {...task} />
              ))}
            </div>
          )}
          {tasks.length === 0 && !showNewTask && (
            <div className="text-center text-gray-400 text-sm py-8">
              No tasks yet. Create your first task to get started.
            </div>
          )}
        </div>
      </div>
      
      <ClarificationModal
        open={showClarificationModal}
        taskId={pendingTaskId}
        clarificationRequest={clarificationRequest}
        onSubmit={handleClarificationSubmit}
        onClose={() => setShowClarificationModal(false)}
      />
    </div>
  );
};
