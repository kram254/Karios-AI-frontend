import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Brain, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Loader2, 
  ChevronDown, 
  ChevronUp,
  MessageSquare,
  Settings,
  Play,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface AgentStatusData {
  type: string;
  agent_type: string;
  status: 'started' | 'completed' | 'failed' | 'processing';
  message: string;
  data?: any;
  timestamp?: string;
}

interface ClarificationData {
  type: string;
  task_id: string;
  clarification_request: string;
  message: string;
  timestamp?: string;
}

interface MultiAgentWorkflowCardProps {
  taskId: string;
  workflowStage: string;
  agentUpdates: AgentStatusData[];
  clarificationRequest?: ClarificationData;
  onClarificationResponse?: (taskId: string, response: string) => void;
  isExpanded?: boolean;
}

const MultiAgentWorkflowCard: React.FC<MultiAgentWorkflowCardProps> = ({
  taskId,
  workflowStage,
  agentUpdates,
  clarificationRequest,
  onClarificationResponse,
  isExpanded = true
}) => {
  const [expanded, setExpanded] = useState(isExpanded);
  const [clarificationResponse, setClarificationResponse] = useState('');

  const getAgentIcon = (agentType: string) => {
    switch (agentType) {
      case 'HOST': return <Settings className="w-4 h-4" />;
      case 'PROMPT_REFINER': return <User className="w-4 h-4" />;
      case 'PLANNER': return <Brain className="w-4 h-4" />;
      case 'TASK_EXECUTOR': return <Play className="w-4 h-4" />;
      case 'REVIEWER': return <CheckCircle className="w-4 h-4" />;
      case 'FORMATTER': return <MessageSquare className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'processing': return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'started': return <Clock className="w-4 h-4 text-yellow-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-green-500/30 bg-green-900/20';
      case 'failed': return 'border-red-500/30 bg-red-900/20';
      case 'processing': return 'border-blue-500/30 bg-blue-900/20';
      case 'started': return 'border-yellow-500/30 bg-yellow-900/20';
      default: return 'border-gray-500/30 bg-gray-900/20';
    }
  };

  const handleClarificationSubmit = () => {
    if (clarificationResponse.trim() && onClarificationResponse && clarificationRequest) {
      onClarificationResponse(clarificationRequest.task_id, clarificationResponse.trim());
      setClarificationResponse('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-[#1A1A2E] to-[#16213E] border border-[#00F3FF]/20 rounded-lg p-4 mb-4 shadow-lg"
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between cursor-pointer mb-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#00F3FF]/10 rounded-lg">
            <Brain className="w-5 h-5 text-[#00F3FF]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Multi-Agent Workflow</h3>
            <p className="text-sm text-gray-400">Task ID: {taskId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 px-2 py-1 bg-[#2A2A2A] rounded-full">
            {workflowStage}
          </span>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Clarification Request */}
      <AnimatePresence>
        {clarificationRequest && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-4 bg-orange-900/20 border border-orange-500/30 rounded-lg"
          >
            <div className="flex items-start gap-3 mb-3">
              <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-orange-400 font-semibold mb-2">Clarification Needed</h4>
                <p className="text-white text-sm mb-3">{clarificationRequest.clarification_request}</p>
                
                <div className="space-y-3">
                  <textarea
                    value={clarificationResponse}
                    onChange={(e) => setClarificationResponse(e.target.value)}
                    placeholder="Please provide the requested clarification..."
                    className="w-full bg-[#2A2A2A] text-white p-3 rounded-lg border border-gray-600 focus:border-[#00F3FF]/50 focus:outline-none resize-none"
                    rows={3}
                  />
                  <button
                    onClick={handleClarificationSubmit}
                    disabled={!clarificationResponse.trim()}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      clarificationResponse.trim()
                        ? 'bg-[#00F3FF] text-black hover:bg-[#00F3FF]/80'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Submit Response
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Agent Updates */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {agentUpdates.map((update, index) => (
              <motion.div
                key={`${update.agent_type}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-3 rounded-lg border ${getStatusColor(update.status)}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-1.5 bg-[#2A2A2A] rounded">
                    {getAgentIcon(update.agent_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium text-sm">
                        {update.agent_type.replace('_', ' ')}
                      </span>
                      {getStatusIcon(update.status)}
                    </div>
                    <p className="text-gray-300 text-sm">{update.message}</p>
                  </div>
                  {update.timestamp && (
                    <span className="text-xs text-gray-500">
                      {new Date(update.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                
                {/* Show additional data if available */}
                {update.data && Object.keys(update.data).length > 0 && (
                  <div className="mt-2 p-2 bg-[#1A1A1A]/50 rounded text-xs text-gray-400">
                    <details>
                      <summary className="cursor-pointer hover:text-gray-300">
                        View Details
                      </summary>
                      <pre className="mt-2 overflow-x-auto">
                        {JSON.stringify(update.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </motion.div>
            ))}
            
            {agentUpdates.length === 0 && (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 text-[#00F3FF] animate-spin mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Initializing workflow...</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MultiAgentWorkflowCard;
