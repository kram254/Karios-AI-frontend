import React, { useState, useEffect } from 'react';
import { Zap, Play, CheckCircle, Clock, XCircle } from 'lucide-react';
import { autonomousTasksService, AutonomousTask } from '../services/api/autonomous-tasks.service';
import { useChat } from '../context/ChatContext';

const AutonomousTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<AutonomousTask[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentChat } = useChat();

  useEffect(() => {
    fetchTasks();
  }, [currentChat]);

  const fetchTasks = async () => {
    try {
      if (currentChat?.id) {
        const chatTasks = await autonomousTasksService.getChatTasks(currentChat.id);
        setTasks(chatTasks);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'running': return <Clock className="w-5 h-5 text-yellow-400 animate-spin" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-400" />;
      default: return <Clock className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] text-white">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A]">
        <div className="flex items-center">
          <Zap className="w-6 h-6 text-[#00F3FF] mr-3" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#00F3FF] to-[#FF00F3] bg-clip-text text-transparent">
            Task Builder
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00F3FF]"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Zap className="w-16 h-16 mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Autonomous Tasks</h3>
            <p className="text-center">Create tasks by typing "create task..." in chat</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {tasks.map((task) => (
              <div key={task.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white">{task.title}</h3>
                  {getStatusIcon(task.status)}
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm text-gray-400">
                  <div>Type: {task.task_type}</div>
                  <div>Status: {task.status}</div>
                  <div>Progress: {task.progress_percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AutonomousTasksPage;
