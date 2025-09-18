import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { TaskItem } from './TaskItem';
import { useChat } from '../../context/ChatContext';

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
}

export const TaskPanel: React.FC<TaskPanelProps> = ({ chatId, isWebAutomation = false }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showNewTask, setShowNewTask] = useState(false);
  const [taskInput, setTaskInput] = useState('');
  const { addMessage } = useChat();

  const createTask = async () => {
    if (taskInput.trim()) {
      const newTask = {
        id: `task_${Date.now()}`,
        title: taskInput.substring(0, 50) + (taskInput.length > 50 ? '...' : ''),
        description: taskInput,
        status: 'in_progress',
        progress: 10
      };
      
      setTasks(prev => [...prev, newTask]);
      setTaskInput('');
      setShowNewTask(false);
      
      await addMessage({
        role: 'user',
        content: taskInput,
        chatId: chatId
      });
      
      await addMessage({
        role: 'assistant', 
        content: `I'll help you with this task. Let me use the available tools to complete it.

**Task**: ${taskInput}

I have access to some tools, but they may not be sufficient for your specific request. To fully assist you, I'll need to use various tools which allows me to complete tasks comprehensively.

🔍 **Search Perplexity**

Loading tools...`,
        chatId: chatId
      });
      
      setTimeout(async () => {
        setTasks(prev => prev.map(t => 
          t.id === newTask.id ? { ...t, progress: 50 } : t
        ));
        await addMessage({
          role: 'assistant',
          content: `🌐 **Google Search**\n\nComputer started\n\n✓ Navigate to search\n✓ Processing results\n\n🔍 **Search Perplexity**`,
          chatId: chatId
        });
      }, 2000);
      
      setTimeout(async () => {
        setTasks(prev => prev.map(t => 
          t.id === newTask.id ? { ...t, status: 'completed', progress: 100 } : t
        ));
        await addMessage({
          role: 'assistant',
          content: `✅ **Task Completed**\n\nSuccessfully completed: "${taskInput}"\n\n**Tools used:**\n- Perplexity Search\n- Google Search\n- Data Analysis\n\nTask execution finished.`,
          chatId: chatId
        });
      }, 4000);
    }
  };

  if (isWebAutomation) return null;

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A]">
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#2A2A2A]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          <span className="text-white font-medium">Tasks</span>
        </div>
        <button
          onClick={() => setShowNewTask(!showNewTask)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-blue-400 hover:text-blue-300 rounded"
        >
          <Plus className="w-3 h-3" />
          New Task
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {showNewTask && (
          <div className="p-4 border-b border-[#2A2A2A]">
            <input 
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="Enter task description..."
              className="w-full bg-gray-700 text-white p-3 rounded text-sm mb-3"
              onKeyPress={(e) => e.key === 'Enter' && createTask()}
            />
            <button 
              onClick={createTask}
              className="w-full bg-blue-600 text-white text-sm rounded py-2 hover:bg-blue-700"
            >
              Create Task
            </button>
          </div>
        )}
        <div className="p-4">
          {tasks.length > 0 ? (
            tasks.map(task => (
              <TaskItem key={task.id} {...task} />
            ))
          ) : !showNewTask && (
            <div className="text-center text-gray-400 text-sm py-8">
              No tasks yet. Create your first task to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
