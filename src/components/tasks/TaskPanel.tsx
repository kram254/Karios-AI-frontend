import React, { useState } from 'react';
import { Plus, Zap, Square } from 'lucide-react';
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
  const [showStartTask, setShowStartTask] = useState(false);
  const [showChatInput, setShowChatInput] = useState(false);
  const [taskInput, setTaskInput] = useState('');
  const { addMessage } = useChat();

  const generateTaskTitle = (prompt: string): string => {
    const cleanPrompt = prompt.trim();
    if (cleanPrompt.length <= 30) return cleanPrompt;
    
    const words = cleanPrompt.split(' ');
    if (words.length <= 4) return cleanPrompt.substring(0, 30);
    
    const keyWords = words.slice(0, 4).join(' ');
    return keyWords.length > 30 ? keyWords.substring(0, 27) + '...' : keyWords;
  };

  const createTask = async () => {
    if (taskInput.trim()) {
      const taskTitle = generateTaskTitle(taskInput);
      const newTask = {
        id: `task_${Date.now()}`,
        title: taskTitle,
        description: taskInput,
        status: 'in_progress',
        progress: 10
      };
      
      setTasks(prev => [...prev, newTask]);
      setTaskInput('');
      setShowNewTask(false);
      setShowStartTask(false);
      setShowChatInput(false);
      
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
          onClick={() => {
            setShowNewTask(!showNewTask);
            if (!showNewTask) {
              setShowStartTask(true);
              setShowChatInput(false);
            } else {
              setShowStartTask(false);
              setShowChatInput(false);
            }
          }}
          className="flex items-center gap-1 px-2 py-1 text-xs text-blue-400 hover:text-blue-300 rounded"
        >
          <Plus className="w-3 h-3" />
          New Task
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {showNewTask && showStartTask && !showChatInput && (
          <div className="p-4 border-b border-[#2A2A2A]">
            <button 
              onClick={() => {
                setShowChatInput(true);
                setShowStartTask(false);
              }}
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
        {showNewTask && showChatInput && (
          <div className="p-4 border-b border-[#2A2A2A]">
            <input 
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="Enter message"
              className="w-full bg-gray-700 text-white p-3 rounded text-sm mb-3"
              onKeyPress={(e) => e.key === 'Enter' && createTask()}
              autoFocus
            />
            <div className="flex gap-2">
              <button 
                onClick={createTask}
                className="flex-1 bg-blue-600 text-white text-sm rounded py-2 hover:bg-blue-700"
              >
                Send
              </button>
            </div>
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
    </div>
  );
};
