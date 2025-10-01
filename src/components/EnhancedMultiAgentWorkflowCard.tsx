import React, { useState, useEffect } from 'react';
import { WorkflowCanvas } from './WorkflowCanvas';
import { Brain, Play, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EnhancedWorkflowProps {
  taskId: string;
  workflowStage: string;
  agentUpdates: any[];
  planSteps: any[];
  executionItems: any[];
  reviewData: any;
  clarificationRequest: any;
  onClarificationResponse?: (taskId: string, response: string) => void;
}

export const EnhancedMultiAgentWorkflowCard: React.FC<EnhancedWorkflowProps> = ({
  taskId,
  workflowStage,
  agentUpdates,
  planSteps,
  executionItems,
  reviewData,
  clarificationRequest,
  onClarificationResponse
}) => {
  const [isCanvasMode, setIsCanvasMode] = useState(false);
  const [phases, setPhases] = useState<any[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());

  useEffect(() => {
    console.log('🔥 WORKFLOW CARD RE-RENDER:', {
      taskId,
      workflowStage,
      agentUpdatesCount: agentUpdates.length,
      latestUpdate: agentUpdates[agentUpdates.length - 1]
    });
    setLastUpdateTime(Date.now());
  }, [agentUpdates, planSteps, executionItems, reviewData, workflowStage, taskId]);

  useEffect(() => {
    const updatedPhases = [];

    if (planSteps.length > 0) {
      updatedPhases.push({
        title: "Phase 1: Planning & Strategy",
        subtitle: "Core Infrastructure Setup",
        items: planSteps.map((step, index) => ({
          id: index + 1,
          title: step.action || step.description || `Step ${index + 1}`,
          description: step.expected_output,
          status: getStepStatus(step, agentUpdates)
        }))
      });
    }

    if (executionItems.length > 0) {
      updatedPhases.push({
        title: "Phase 2: Execution Layer",
        subtitle: "Implementation Progress",
        items: executionItems.map((item, index) => ({
          id: index + 1,
          title: item.title,
          description: item.detail,
          status: item.status === 'completed' ? 'completed' : 'in_progress'
        }))
      });
    }

    if (reviewData) {
      updatedPhases.push({
        title: "Phase 3: Quality Review",
        subtitle: "Performance Analysis",
        items: [
          {
            id: 1,
            title: `Quality Score: ${reviewData.score || 0}%`,
            description: reviewData.summary,
            status: (reviewData.score || 0) >= 80 ? 'completed' : 'in_progress'
          },
          ...(reviewData.strengths || []).map((strength: string, index: number) => ({
            id: index + 2,
            title: strength,
            status: 'completed'
          })),
          ...(reviewData.improvements || []).map((improvement: string, index: number) => ({
            id: index + 10,
            title: improvement,
            status: 'pending'
          }))
        ]
      });
    }

    if (agentUpdates.length > 0) {
      const agentPhases = groupAgentUpdatesByType(agentUpdates);
      updatedPhases.push(...agentPhases);
    }

    setPhases(updatedPhases);
  }, [planSteps, executionItems, reviewData, agentUpdates]);

  const getStepStatus = (step: any, updates: any[]) => {
    const relatedUpdate = updates.find(update => 
      update.step_id === step.step_number || 
      update.message?.includes(step.action)
    );
    
    if (relatedUpdate) {
      return relatedUpdate.status === 'completed' ? 'completed' : 'in_progress';
    }
    return 'pending';
  };

  const groupAgentUpdatesByType = (updates: any[]) => {
    const grouped = updates.reduce((acc, update) => {
      const agentType = update.agent_type || 'GENERAL';
      if (!acc[agentType]) acc[agentType] = [];
      acc[agentType].push(update);
      return acc;
    }, {} as { [key: string]: any[] });

    return (Object.entries(grouped) as [string, any[]][]).map(([agentType, agentUpdates]) => ({
      title: `${agentType.replace('_', ' ')} Agent`,
      subtitle: `${agentUpdates.length} updates`,
      items: agentUpdates.map((update, index) => ({
        id: index + 1,
        title: update.message,
        description: update.timestamp ? new Date(update.timestamp).toLocaleTimeString() : '',
        status: update.status
      }))
    }));
  };

  const getStatusIcon = (stage: string) => {
    if (stage.includes('Completed')) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (stage.includes('Processing')) return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
    if (stage.includes('Error')) return <AlertCircle className="w-5 h-5 text-red-500" />;
    return <Play className="w-5 h-5 text-gray-500" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0A0A0A]/80 border border-[#00F3FF]/30 rounded-lg shadow-lg mb-6 backdrop-blur-sm"
    >
      <div className="p-6 border-b border-[#00F3FF]/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#00F3FF]/10 rounded-lg border border-[#00F3FF]/30">
              <Brain className="w-6 h-6 text-[#00F3FF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-[#00F3FF]">Multi-Agent Workflow</h2>
                {agentUpdates.length > 0 && (
                  <motion.span 
                    key={lastUpdateTime}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="px-2 py-1 bg-[#00F3FF]/20 text-[#00F3FF] text-xs font-bold rounded-full"
                  >
                    {agentUpdates.length} updates
                  </motion.span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {getStatusIcon(workflowStage)}
                <span className="text-sm text-gray-300">{workflowStage}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Task ID</p>
            <p className="text-sm font-mono text-[#00F3FF]">{taskId.slice(0, 8)}...</p>
          </div>
        </div>
      </div>
      
      {agentUpdates.length > 0 && (
        <div className="p-6 border-b border-[#00F3FF]/20">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#00F3FF] rounded-full animate-pulse"></span>
            Live Workflow Progress ({agentUpdates.length} steps)
          </h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {agentUpdates.map((update, index) => {
              const isCompleted = update.status === 'completed';
              const isRunning = update.status === 'started' || update.status === 'processing';
              const isFailed = update.status === 'failed';
              
              return (
                <motion.div
                  key={`${update.agent_type}-${update.timestamp}-${index}`}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ 
                    delay: 0,
                    duration: 0.3,
                    type: "spring",
                    stiffness: 200,
                    damping: 20
                  }}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-green-500/10 border-green-500/30 shadow-sm shadow-green-500/20' 
                      : isRunning
                      ? 'bg-[#00F3FF]/10 border-[#00F3FF]/30 shadow-sm shadow-[#00F3FF]/20'
                      : isFailed
                      ? 'bg-red-500/10 border-red-500/30 shadow-sm shadow-red-500/20'
                      : 'bg-gray-800/30 border-gray-600/30'
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : isRunning ? (
                      <Clock className="w-5 h-5 text-[#00F3FF] animate-spin" />
                    ) : isFailed ? (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <Play className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-semibold ${
                        isCompleted ? 'text-green-400' : isRunning ? 'text-[#00F3FF]' : isFailed ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {update.agent_type?.replace(/_/g, ' ') || 'Agent'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        isCompleted 
                          ? 'bg-green-500/20 text-green-300'
                          : isRunning
                          ? 'bg-[#00F3FF]/20 text-[#00F3FF]'
                          : isFailed
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-gray-600/20 text-gray-400'
                      }`}>
                        {update.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{update.message}</p>
                    {update.data && Object.keys(update.data).length > 0 && (
                      <div className="mt-2 text-xs text-gray-500 bg-black/30 rounded p-2 font-mono">
                        {update.data.step_number && `Step ${update.data.step_number}`}
                        {update.data.action && ` • ${update.data.action}`}
                        {update.data.tool_name && ` • ${update.data.tool_name}`}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0 text-right">
                    {update.timestamp && (
                      <span className="text-xs text-gray-500 block">
                        {new Date(update.timestamp).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {clarificationRequest && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-6 bg-orange-500/10 border-b border-orange-500/30"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-400 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-300 mb-2">Clarification Required</h3>
                <p className="text-orange-200 mb-4">{clarificationRequest.clarification_request}</p>
                <div className="flex gap-3">
                  <textarea
                    placeholder="Provide clarification..."
                    className="flex-1 p-3 bg-black/30 border border-orange-400/30 rounded-md resize-none text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    rows={3}
                  />
                  <button
                    onClick={() => {
                      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
                      if (textarea?.value && onClarificationResponse) {
                        onClarificationResponse(taskId, textarea.value);
                        textarea.value = '';
                      }
                    }}
                    className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6">
        <WorkflowCanvas
          phases={phases}
          isCanvasMode={isCanvasMode}
          onToggleCanvas={() => setIsCanvasMode(!isCanvasMode)}
        />
      </div>
    </motion.div>
  );
};
