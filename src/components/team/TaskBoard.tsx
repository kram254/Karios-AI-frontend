import React, { useState } from 'react';
import { Plus, GripVertical, Clock, User, Tag, AlertCircle, CheckCircle2, Circle, Pause, XCircle } from 'lucide-react';
import type { TeamTask, TeamMember } from '../../services/agentTeamService';

interface TaskBoardProps {
  tasks: TeamTask[];
  members: TeamMember[];
  onUpdateTask: (taskId: number, updates: Partial<TeamTask>) => void;
  onCreateTask?: () => void;
  onTaskClick?: (task: TeamTask) => void;
}

const COLUMNS: { key: string; label: string; color: string; icon: React.ElementType }[] = [
  { key: 'backlog', label: 'Backlog', color: '#6B7280', icon: Circle },
  { key: 'todo', label: 'To Do', color: '#3B82F6', icon: Circle },
  { key: 'in_progress', label: 'In Progress', color: '#F59E0B', icon: Clock },
  { key: 'in_review', label: 'In Review', color: '#8B5CF6', icon: AlertCircle },
  { key: 'done', label: 'Done', color: '#10B981', icon: CheckCircle2 },
  { key: 'blocked', label: 'Blocked', color: '#EF4444', icon: Pause },
];

const PRIORITY_COLORS: Record<string, { text: string; bg: string }> = {
  critical: { text: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' },
  high: { text: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },
  medium: { text: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' },
  low: { text: '#6B7280', bg: 'rgba(107, 114, 128, 0.15)' },
};

const TaskCard: React.FC<{ task: TeamTask; members: TeamMember[]; onClick?: () => void }> = ({ task, members, onClick }) => {
  const priority = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
  const assignee = members.find(m => m.id === task.assignee_id);

  return (
    <div
      className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-3 cursor-pointer hover:border-[#3A3A3A] transition-all duration-200 group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-white leading-snug line-clamp-2 flex-1">{task.title}</h4>
        <GripVertical size={12} className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
      </div>
      {task.description && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase"
            style={{ color: priority.text, background: priority.bg }}
          >
            {task.priority}
          </span>
          {task.labels && task.labels.slice(0, 2).map((label, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-gray-400">
              {label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          {task.estimated_minutes && (
            <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
              <Clock size={8} /> {task.estimated_minutes}m
            </span>
          )}
          {assignee && (
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-white/10 flex items-center justify-center" title={assignee.name}>
              <span className="text-[8px] text-white font-medium">{assignee.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, members, onUpdateTask, onCreateTask, onTaskClick }) => {
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const getColumnTasks = (status: string) => tasks.filter(t => t.status === status);

  const handleDragStart = (e: React.DragEvent, task: TeamTask) => {
    e.dataTransfer.setData('taskId', String(task.id));
    e.dataTransfer.setData('currentStatus', task.status);
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = parseInt(e.dataTransfer.getData('taskId'));
    const currentStatus = e.dataTransfer.getData('currentStatus');
    if (currentStatus !== newStatus && taskId) {
      onUpdateTask(taskId, { status: newStatus } as any);
    }
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 min-h-[400px]">
      {COLUMNS.map((col) => {
        const colTasks = getColumnTasks(col.key);
        const Icon = col.icon;
        const isDragOver = dragOverColumn === col.key;

        return (
          <div
            key={col.key}
            className="flex-shrink-0 w-[260px] flex flex-col"
            onDragOver={(e) => { e.preventDefault(); setDragOverColumn(col.key); }}
            onDragLeave={() => setDragOverColumn(null)}
            onDrop={(e) => handleDrop(e, col.key)}
          >
            <div className="flex items-center gap-2 mb-3 px-1">
              <Icon size={12} style={{ color: col.color }} />
              <span className="text-xs font-medium text-gray-300 uppercase tracking-wider">{col.label}</span>
              <span className="text-[10px] text-gray-600 bg-white/5 px-1.5 py-0.5 rounded-full ml-auto">{colTasks.length}</span>
            </div>
            <div
              className={`flex-1 space-y-2 rounded-lg p-2 transition-colors duration-200 ${isDragOver ? 'bg-white/5 border border-dashed border-white/20' : 'bg-transparent'}`}
            >
              {colTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                >
                  <TaskCard task={task} members={members} onClick={() => onTaskClick?.(task)} />
                </div>
              ))}
              {colTasks.length === 0 && (
                <div className="flex items-center justify-center py-8 text-gray-600 text-xs">
                  No tasks
                </div>
              )}
            </div>
            {col.key === 'backlog' && onCreateTask && (
              <button
                onClick={onCreateTask}
                className="mt-2 flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-cyan-400 transition-colors py-2 rounded-lg hover:bg-white/5"
              >
                <Plus size={12} /> Add task
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TaskBoard;
