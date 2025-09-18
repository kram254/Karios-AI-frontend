import React, { useState } from 'react';
import { Plus } from 'lucide-react';

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

  if (isWebAutomation) return null;

  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 mb-4">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          <span className="text-white font-medium">Tasks</span>
        </div>
        <button
          onClick={() => setShowNewTask(!showNewTask)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-blue-400 hover:text-blue-300"
        >
          <Plus className="w-3 h-3" />
          New Task
        </button>
      </div>
      {showNewTask && (
        <div className="p-3 border-t border-gray-700">
          <input 
            placeholder="Enter task description..."
            className="w-full bg-gray-700 text-white p-2 rounded text-sm mb-2"
          />
          <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded">
            Create Task
          </button>
        </div>
      )}
      {tasks.length === 0 && !showNewTask && (
        <div className="p-4 text-center text-gray-400 text-sm">
          No tasks yet. Create your first task to get started.
        </div>
      )}
    </div>
  );
};
