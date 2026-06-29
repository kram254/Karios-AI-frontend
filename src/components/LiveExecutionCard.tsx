import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Circle, 
  Loader2, 
  ChevronRight,
  ChevronDown,
  Globe,
  FileText,
  Search,
  Zap,
  Activity,
  ListTodo,
  Brain,
  MoreHorizontal,
  AlertCircle
} from 'lucide-react';

interface TaskItem {
  id: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: number;
  endTime?: number;
}

interface AgentAction {
  id: string;
  type: 'search' | 'outline' | 'analyze' | 'extract' | 'navigate' | 'other';
  description: string;
  timestamp: number;
  duration?: number;
}

interface AgentThought {
  id: string;
  type: 'info' | 'analysis' | 'planning' | 'execution' | 'search' | 'outline';
  content: string;
  status: 'active' | 'completed' | 'pending';
  timestamp: number;
}

interface LiveExecutionCardProps {
  isVisible: boolean;
  taskObjective: string;
  tasks: TaskItem[];
  agentActions: AgentAction[];
  thinkingStartTime: number | null;
  currentThought?: string;
  onCollapse?: () => void;
  workflowStatus?: 'idle' | 'running' | 'completed' | 'failed';
  currentStep?: { number: number; total: number; description: string };
  confidenceLevel?: 'high' | 'medium' | 'low';
}

const WORKFLOW_CONFIG = {
  idle: { label: 'Idle', color: '#6B7280' },
  running: { label: 'Working on your request', color: '#3B82F6' },
  completed: { label: 'Completed', color: '#10B981' },
  failed: { label: 'Something went wrong', color: '#EF4444' }
};

export const LiveExecutionCard: React.FC<LiveExecutionCardProps> = ({
  isVisible,
  taskObjective,
  tasks,
  agentActions,
  thinkingStartTime,
  currentThought,
  onCollapse,
  workflowStatus = 'running',
  currentStep,
  confidenceLevel = 'high'
}) => {
  const [thinkingDuration, setThinkingDuration] = useState(0);
  const [isMainExpanded, setIsMainExpanded] = useState(true);
  const [isTasksExpanded, setIsTasksExpanded] = useState(false);
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);
  const actionsEndRef = useRef<HTMLDivElement>(null);

  const [thoughts, setThoughts] = useState<AgentThought[]>([]);

  useEffect(() => {
    if (!thinkingStartTime) {
      setThinkingDuration(0);
      return;
    }

    const interval = setInterval(() => {
      setThinkingDuration(Math.floor((Date.now() - thinkingStartTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [thinkingStartTime]);

  useEffect(() => {
    if (actionsEndRef.current && isMainExpanded) {
      actionsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [agentActions, isMainExpanded]);

  useEffect(() => {
    const newThoughts: AgentThought[] = [];
    
    if (agentActions.length > 0) {
      agentActions.forEach((action, idx) => {
        let thoughtType: AgentThought['type'] = 'info';
        if (action.type === 'analyze') thoughtType = 'analysis';
        else if (action.type === 'search') thoughtType = 'search';
        else if (action.type === 'outline') thoughtType = 'outline';
        else if (action.type === 'navigate') thoughtType = 'execution';
        
        newThoughts.push({
          id: action.id,
          type: thoughtType,
          content: action.description,
          status: idx === agentActions.length - 1 ? 'active' : 'completed',
          timestamp: action.timestamp
        });
      });
    }
    
    setThoughts(newThoughts);
  }, [agentActions]);

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const getThoughtIcon = (type: string) => {
    switch (type) {
      case 'search': return <Search className="w-3.5 h-3.5 text-gray-500" />;
      case 'outline': return <FileText className="w-3.5 h-3.5 text-gray-500" />;
      case 'execution': return <Globe className="w-3.5 h-3.5 text-gray-500" />;
      case 'analysis': return <Brain className="w-3.5 h-3.5 text-gray-500" />;
      case 'planning': return <Zap className="w-3.5 h-3.5 text-gray-500" />;
      default: return <Activity className="w-3.5 h-3.5 text-gray-500" />;
    }
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-gray-500 flex-shrink-0" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-cyan-400 animate-spin flex-shrink-0" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />;
      default:
        return <Circle className="w-4 h-4 text-gray-600 flex-shrink-0" />;
    }
  };

  const getThoughtStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />;
      case 'active':
        return <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin flex-shrink-0" />;
      default:
        return <Circle className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />;
    }
  };

  if (!isVisible) return null;

  const config = WORKFLOW_CONFIG[workflowStatus];
  const runningTask = tasks.find(t => t.status === 'running');
  const completedActions = agentActions.filter(a => a.duration !== undefined);
  const activeAction = agentActions.length > 0 ? agentActions[agentActions.length - 1] : null;

  return (
    <div className="lec-wrapper space-y-2">
      <div className="lec-main-card">
        <div
          className="lec-header"
          onClick={() => setIsMainExpanded(!isMainExpanded)}
        >
          <div className="lec-header-left">
            <div className="lec-spinner-wrap">
              {workflowStatus === 'running' ? (
                <div className="lec-spin-ring" />
              ) : workflowStatus === 'completed' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Circle className="w-4 h-4 text-gray-500" />
              )}
            </div>
            <span className="lec-header-label">{config.label}</span>
          </div>
          <span className={`lec-badge ${confidenceLevel === 'low' ? 'lec-badge-low' : confidenceLevel === 'medium' ? 'lec-badge-medium' : ''}`}>
            {confidenceLevel.toUpperCase()}
          </span>
        </div>

        <AnimatePresence>
          {isMainExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <div className="lec-main-body">
                <div className="lec-progress-section">
                  <div className="lec-progress-header">
                    <span className="lec-progress-label">Task Progress</span>
                    <span className="lec-progress-pct">{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="lec-progress-track">
                    <motion.div
                      className="lec-progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                <div className="lec-status-list">
                  {taskObjective && (
                    <div className="lec-status-row lec-status-done">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>Received task: {taskObjective}</span>
                    </div>
                  )}
                  {completedActions.slice(-2).map((action, idx) => (
                    <div key={action.id || idx} className="lec-status-row lec-status-done">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{action.description}</span>
                    </div>
                  ))}
                  {runningTask && (
                    <motion.div
                      className="lec-status-row lec-status-active"
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>
                        Starting step {currentStep?.number || 1}/{currentStep?.total || totalTasks || 1}: {runningTask.description}
                      </span>
                    </motion.div>
                  )}
                  {!runningTask && activeAction && (
                    <motion.div
                      className="lec-status-row lec-status-active"
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{activeAction.description}</span>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {(thoughts.length > 0 || currentThought || thinkingStartTime) && (
        <div className="lec-thinking-card">
          <div className="lec-thinking-header">
            <div className="flex items-center gap-2">
              <span className="lec-section-label">Thinking Process</span>
            </div>
            {thinkingStartTime && (
              <span className="lec-thinking-time">{thinkingDuration}s</span>
            )}
          </div>

          <div className="lec-thought-list">
            {thoughts.map((thought, idx) => {
              const isActive = thought.status === 'active';
              return (
                <div
                  key={thought.id}
                  className={`lec-thought-item ${isActive ? 'lec-thought-item-active' : ''}`}
                >
                  <div className="lec-thought-item-header">
                    <div className="flex items-center gap-2">
                      {getThoughtIcon(thought.type)}
                      <span className={`text-xs font-medium ${isActive ? 'text-gray-100' : 'text-gray-300'}`}>
                        {thought.content}
                      </span>
                    </div>
                    <span className={`lec-thought-status ${isActive ? 'lec-thought-status-active' : ''}`}>
                      {isActive ? 'Active' : 'Completed'}
                    </span>
                  </div>
                  {isActive && currentThought && (
                    <div className="lec-thought-code-block">
                      <pre className="lec-thought-code">{currentThought}</pre>
                    </div>
                  )}
                </div>
              );
            })}
            {currentThought && thoughts.length === 0 && (
              <div className="lec-thought-item lec-thought-item-active">
                <div className="lec-thought-item-header">
                  <div className="flex items-center gap-2">
                    <Brain className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-medium text-gray-100">Processing</span>
                  </div>
                  <span className="lec-thought-status lec-thought-status-active">Active</span>
                </div>
                <div className="lec-thought-code-block">
                  <pre className="lec-thought-code">{currentThought}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tasks.length > 0 && (
        <div className="lec-steps-card">
          <div className="lec-steps-header">
            <ListTodo className="w-3.5 h-3.5 text-gray-500" />
            <span className="lec-section-label">Execution Steps</span>
          </div>

          <div className="lec-steps-list">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`lec-step-row ${task.status === 'running' ? 'lec-step-row-active' : ''} ${task.status === 'completed' ? 'lec-step-row-done' : ''}`}
              >
                {task.status === 'completed' ? (
                  <span className="lec-step-checkbox lec-step-checkbox-done">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  </span>
                ) : task.status === 'running' ? (
                  <span className="lec-step-checkbox lec-step-checkbox-active">
                    <span className="lec-step-fill" />
                  </span>
                ) : task.status === 'failed' ? (
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                ) : (
                  <span className="lec-step-checkbox lec-step-checkbox-empty" />
                )}
                <span className={`text-xs ${
                  task.status === 'completed'
                    ? 'text-gray-500 line-through opacity-60'
                    : task.status === 'running'
                    ? 'text-gray-100 font-medium'
                    : 'text-gray-400'
                }`}>
                  {task.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {agentActions.length > 0 && (
        <div className="lec-actions-outer">
          {agentActions.slice(-4).map((action) => (
            <div key={action.id} className="lec-action-card">
              <div className="lec-action-icon-wrap">
                {getThoughtIcon(action.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-200 truncate">{action.description}</p>
                {action.duration !== undefined && (
                  <p className="text-[10px] text-gray-500 truncate">{(action.duration / 1000).toFixed(1)}s elapsed</p>
                )}
              </div>
              <ChevronRight className="w-3 h-3 text-gray-600 flex-shrink-0" />
            </div>
          ))}
          <div ref={actionsEndRef} />
        </div>
      )}
    </div>
  );
};

export default LiveExecutionCard;
