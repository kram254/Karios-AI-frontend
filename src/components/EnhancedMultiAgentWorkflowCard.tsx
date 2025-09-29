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

    return Object.entries(grouped).map(([agentType, agentUpdates]) => ({
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
      className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6"
    >
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Multi-Agent Workflow</h2>
              <div className="flex items-center gap-2 mt-1">
                {getStatusIcon(workflowStage)}
                <span className="text-sm text-gray-600">{workflowStage}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Task ID</p>
            <p className="text-sm font-mono text-gray-900">{taskId}</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {clarificationRequest && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-6 bg-orange-50 border-b border-orange-200"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-500 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 mb-2">Clarification Required</h3>
                <p className="text-orange-800 mb-4">{clarificationRequest.clarification_request}</p>
                <div className="flex gap-3">
                  <textarea
                    placeholder="Provide clarification..."
                    className="flex-1 p-3 border border-orange-300 rounded-md resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
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
