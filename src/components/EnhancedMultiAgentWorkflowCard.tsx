import React, { useState, useEffect } from 'react';
import { WorkflowCanvas } from './WorkflowCanvas';
import { Brain, Play, CheckCircle, AlertCircle, Clock, ChevronDown, ChevronRight, Edit2, Save, X, FileText, ClipboardList } from 'lucide-react';
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
  theme?: 'light' | 'dark';
}

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export const EnhancedMultiAgentWorkflowCard: React.FC<EnhancedWorkflowProps> = ({
  taskId,
  workflowStage,
  agentUpdates,
  planSteps,
  executionItems,
  reviewData,
  clarificationRequest,
  onClarificationResponse,
  theme = 'dark'
}) => {
  const [isCanvasMode, setIsCanvasMode] = useState(false);
  const [phases, setPhases] = useState<any[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
  const [collapsedAgents, setCollapsedAgents] = useState<Set<string>>(new Set());
  const [approvedAgents, setApprovedAgents] = useState<Set<string>>(new Set());
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [editingPlan, setEditingPlan] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState('');
  const [editedPlan, setEditedPlan] = useState<any>(null);
  const [showPromptCard, setShowPromptCard] = useState(false);
  const [showPlanCard, setShowPlanCard] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  useEffect(() => {
    const now = Date.now();
    console.log('🔥 WORKFLOW CARD RE-RENDER:', {
      taskId,
      workflowStage,
      agentUpdatesCount: agentUpdates.length,
      latestUpdate: agentUpdates[agentUpdates.length - 1],
      renderTime: new Date(now).toLocaleTimeString(),
      allUpdates: agentUpdates
    });
    setLastUpdateTime(now);

    const grouped = agentUpdates.reduce((acc, update) => {
      const agentType = update.agent_type || 'UNKNOWN';
      if (!acc[agentType]) acc[agentType] = [];
      acc[agentType].push(update);
      return acc;
    }, {} as { [key: string]: any[] });

    const promptRefinerComplete = grouped['PROMPT_REFINER']?.some((u: any) => u.status === 'completed');
    const promptRefinerData = grouped['PROMPT_REFINER']?.find((u: any) => u.status === 'completed' && u.data?.prp_data);
    const plannerComplete = grouped['PLANNER']?.some((u: any) => u.status === 'completed');
    const plannerData = grouped['PLANNER']?.find((u: any) => u.status === 'completed' && u.data?.execution_plan);

    console.log('🔍 PROMPT REFINER CHECK:', {
      promptRefinerComplete,
      hasPromptRefinerData: !!promptRefinerData,
      promptRefinerUpdates: grouped['PROMPT_REFINER'],
      showPromptCard,
      dataStructure: promptRefinerData?.data
    });

    if (promptRefinerComplete && promptRefinerData && !showPromptCard) {
      console.log('🎯 SETTING showPromptCard = true', {
        prp_data: promptRefinerData.data?.prp_data
      });
      setShowPromptCard(true);
      if (!editedPrompt && promptRefinerData.data?.prp_data) {
        setEditedPrompt(JSON.stringify(promptRefinerData.data.prp_data, null, 2));
      }
    }

    if (plannerComplete && plannerData && !showPlanCard && approvedAgents.has('PROMPT_REFINER')) {
      console.log('🎯 SETTING showPlanCard = true', {
        execution_plan: plannerData.data?.execution_plan
      });
      setShowPlanCard(true);
      if (!editedPlan && plannerData.data?.execution_plan) {
        setEditedPlan(plannerData.data.execution_plan);
      }
    }
  }, [agentUpdates, planSteps, executionItems, reviewData, workflowStage, taskId, showPromptCard, showPlanCard, editedPrompt, editedPlan, approvedAgents]);

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
    const agentMap: { [key: string]: string } = {
      'PROMPT_REFINER': 'Prompt Refiner',
      'PLANNER': 'Planner',
      'TASK_EXECUTOR': 'Task Executor',
      'REVIEWER': 'Reviewer',
      'FORMATTER': 'Formatter'
    };

    const grouped = updates.reduce((acc, update) => {
      const agentType = update.agent_type || 'GENERAL';
      if (!acc[agentType]) acc[agentType] = [];
      acc[agentType].push(update);
      return acc;
    }, {} as { [key: string]: any[] });

    return (Object.entries(grouped) as [string, any[]][]).map(([agentType, agentUpdates]) => ({
      title: `${agentMap[agentType] || agentType.replace('_', ' ')} Agent`,
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
            <p className="text-xs text-gray-500 mt-1">Last: {new Date(lastUpdateTime).toLocaleTimeString()}</p>
          </div>
        </div>
      </div>
      
      {agentUpdates.length > 0 && (
        <div className="p-6 border-b border-[#00F3FF]/20">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#00F3FF] rounded-full animate-pulse"></span>
            Live Workflow Progress ({agentUpdates.length} steps) - Updated: {new Date(lastUpdateTime).toLocaleTimeString()}
          </h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {(() => {
              const agentMap: { [key: string]: string } = {
                'PROMPT_REFINER': 'Prompt Refiner',
                'PLANNER': 'Planner',
                'TASK_EXECUTOR': 'Task Executor',
                'REVIEWER': 'Reviewer',
                'FORMATTER': 'Formatter'
              };

              const grouped = agentUpdates.reduce((acc, update, index) => {
                const agentType = update.agent_type || 'UNKNOWN';
                if (!acc[agentType]) acc[agentType] = [];
                acc[agentType].push({ ...update, originalIndex: index });
                return acc;
              }, {} as { [key: string]: any[] });

              const filteredEntries = (Object.entries(grouped) as [string, any[]][]).filter(([agentType]) => {
                if (agentType === 'PROMPT_REFINER') return true;
                if (agentType === 'PLANNER') return approvedAgents.has('PROMPT_REFINER');
                if (agentType === 'TASK_EXECUTOR') return approvedAgents.has('PLANNER');
                if (agentType === 'REVIEWER') return approvedAgents.has('TASK_EXECUTOR');
                if (agentType === 'FORMATTER') return approvedAgents.has('REVIEWER');
                return false;
              });

              return filteredEntries.map(([agentType, updates]) => {
                const agentName = agentMap[agentType] || agentType.replace(/_/g, ' ');
                const allCompleted = updates.every(u => u.status === 'completed');
                const hasStarted = updates.some(u => u.status === 'started' || u.status === 'processing');
                const isCollapsed = collapsedAgents.has(agentType);
                
                const toggleCollapse = () => {
                  setCollapsedAgents(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(agentType)) {
                      newSet.delete(agentType);
                    } else {
                      newSet.add(agentType);
                    }
                    return newSet;
                  });
                };
                
                return (
                  <motion.div
                    key={agentType}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={theme === 'dark' 
                      ? "bg-[#1a1a1a] rounded-lg border border-gray-700/50 overflow-hidden" 
                      : "bg-white rounded-lg border border-gray-300 overflow-hidden shadow-sm"
                    }
                  >
                    <div 
                      onClick={toggleCollapse}
                      className={`px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-opacity-80 transition-colors ${
                        theme === 'dark'
                          ? allCompleted 
                            ? 'bg-green-500/10 border-b border-green-500/30' 
                            : hasStarted
                            ? 'bg-[#00F3FF]/10 border-b border-[#00F3FF]/30'
                            : 'bg-gray-800/30 border-b border-gray-700/30'
                          : allCompleted 
                            ? 'bg-green-50 border-b border-green-200' 
                            : hasStarted
                            ? 'bg-blue-50 border-b border-blue-200'
                            : 'bg-gray-100 border-b border-gray-200'
                      }`}
                    >
                      {isCollapsed ? (
                        <ChevronRight className={theme === 'dark' ? "w-4 h-4 text-gray-400 flex-shrink-0" : "w-4 h-4 text-gray-600 flex-shrink-0"} />
                      ) : (
                        <ChevronDown className={theme === 'dark' ? "w-4 h-4 text-gray-400 flex-shrink-0" : "w-4 h-4 text-gray-600 flex-shrink-0"} />
                      )}
                      {allCompleted ? (
                        <CheckCircle className={theme === 'dark' ? "w-5 h-5 text-green-500 flex-shrink-0" : "w-5 h-5 text-green-600 flex-shrink-0"} />
                      ) : hasStarted ? (
                        <Clock className={theme === 'dark' ? "w-5 h-5 text-[#00F3FF] animate-spin flex-shrink-0" : "w-5 h-5 text-blue-600 animate-spin flex-shrink-0"} />
                      ) : (
                        <Play className={theme === 'dark' ? "w-5 h-5 text-gray-500 flex-shrink-0" : "w-5 h-5 text-gray-600 flex-shrink-0"} />
                      )}
                      <div className="flex-1">
                        <span className={`font-semibold text-sm ${
                          theme === 'dark'
                            ? allCompleted ? 'text-green-400' : hasStarted ? 'text-[#00F3FF]' : 'text-gray-400'
                            : allCompleted ? 'text-green-700' : hasStarted ? 'text-blue-700' : 'text-gray-700'
                        }`}>
                          {agentName}
                        </span>
                        <span className={theme === 'dark' ? "text-xs text-gray-500 ml-2" : "text-xs text-gray-600 ml-2"}>
                          {updates.length} {updates.length === 1 ? 'update' : 'updates'}
                        </span>
                      </div>
                      {agentType === 'PROMPT_REFINER' && showPromptCard && allCompleted && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowPromptModal(true);
                          }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg ${theme === 'dark' ? 'bg-gradient-to-r from-[#00F3FF] to-[#0099CC] text-black hover:shadow-[#00F3FF]/50' : 'bg-gradient-to-r from-blue-600 to-blue-400 text-white hover:shadow-blue-500/50'}`}
                        >
                          <FileText className="w-4 h-4" />
                          <span className="text-sm">Review & Approve</span>
                        </button>
                      )}
                      {agentType === 'PLANNER' && showPlanCard && allCompleted && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowPlanModal(true);
                          }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg ${theme === 'dark' ? 'bg-gradient-to-r from-[#00F3FF] to-[#0099CC] text-black hover:shadow-[#00F3FF]/50' : 'bg-gradient-to-r from-blue-600 to-blue-400 text-white hover:shadow-blue-500/50'}`}
                        >
                          <ClipboardList className="w-4 h-4" />
                          <span className="text-sm">Review & Approve</span>
                        </button>
                      )}
                    </div>
                    
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="p-3 space-y-2">
                            {updates.map((update, idx) => {
                        const isCompleted = update.status === 'completed';
                        const isRunning = update.status === 'started' || update.status === 'processing';
                        const isFailed = update.status === 'failed';
                        
                        return (
                          <motion.div
                            key={`${update.agent_type}-${update.originalIndex}-${idx}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={theme === 'dark'
                              ? "flex items-start gap-3 p-3 bg-black/20 rounded-md hover:bg-black/30 transition-colors"
                              : "flex items-start gap-3 p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                            }
                          >
                            <div className={theme === 'dark'
                              ? "flex-shrink-0 text-xs font-bold text-[#00F3FF] bg-[#00F3FF]/20 w-7 h-7 rounded-full flex items-center justify-center"
                              : "flex-shrink-0 text-xs font-bold text-blue-600 bg-blue-100 w-7 h-7 rounded-full flex items-center justify-center"
                            }>
                              {update.originalIndex + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                                  theme === 'dark'
                                    ? isCompleted 
                                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                      : isRunning
                                      ? 'bg-[#00F3FF]/20 text-[#00F3FF] border border-[#00F3FF]/30'
                                      : isFailed
                                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                      : 'bg-gray-700/50 text-gray-400 border border-gray-600/30'
                                    : isCompleted 
                                      ? 'bg-green-100 text-green-700 border border-green-300' 
                                      : isRunning
                                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                      : isFailed
                                      ? 'bg-red-100 text-red-700 border border-red-300'
                                      : 'bg-gray-200 text-gray-700 border border-gray-300'
                                }`}>
                                  {update.status}
                                </span>
                                {update.timestamp && (
                                  <span className={theme === 'dark' ? "text-xs text-gray-500" : "text-xs text-gray-600"}>
                                    {new Date(update.timestamp).toLocaleTimeString('en-US', { 
                                      hour: '2-digit', 
                                      minute: '2-digit',
                                      second: '2-digit'
                                    })}
                                  </span>
                                )}
                              </div>
                              <p className={theme === 'dark' ? "text-sm text-gray-300 leading-relaxed" : "text-sm text-gray-800 leading-relaxed"}>{update.message}</p>
                              {update.data && Object.keys(update.data).length > 0 && (
                                <div className={theme === 'dark'
                                  ? "mt-1 text-xs text-gray-500 bg-black/20 rounded px-2 py-1 font-mono"
                                  : "mt-1 text-xs text-gray-600 bg-gray-100 rounded px-2 py-1 font-mono"
                                }>
                                  {update.data.step_number && `Step ${update.data.step_number}`}
                                  {update.data.action && ` • ${update.data.action}`}
                                  {update.data.tool_name && ` • ${update.data.tool_name}`}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              });
            })()}
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

      {theme === 'light' && (
        <div className="p-6">
          <WorkflowCanvas
            phases={phases}
            isCanvasMode={isCanvasMode}
            onToggleCanvas={() => setIsCanvasMode(!isCanvasMode)}
          />
        </div>
      )}

      <AnimatePresence>
        {showPromptModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowPromptModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-[#0a0a0a] border-2 border-[#00F3FF]/30' : 'bg-white border-2 border-blue-200'}`}
            >
              <div className={`flex items-center justify-between p-6 border-b ${theme === 'dark' ? 'border-[#00F3FF]/20 bg-gradient-to-r from-[#00F3FF]/10 to-transparent' : 'border-blue-200 bg-gradient-to-r from-blue-50 to-transparent'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-[#00F3FF]/20' : 'bg-blue-100'}`}>
                    <FileText className={`w-6 h-6 ${theme === 'dark' ? 'text-[#00F3FF]' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-[#00F3FF]' : 'text-blue-700'}`}>Refined Prompt</h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Review and edit before proceeding</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPromptModal(false)}
                  className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-[#00F3FF]/10 text-gray-400 hover:text-[#00F3FF]' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
                {editingPrompt ? (
                  <textarea
                    value={editedPrompt}
                    onChange={(e) => setEditedPrompt(e.target.value)}
                    className={`w-full h-96 p-4 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 transition-all ${theme === 'dark' ? 'bg-black/40 text-gray-300 border border-gray-700 focus:ring-[#00F3FF] focus:border-[#00F3FF]' : 'bg-gray-50 text-gray-800 border border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                    placeholder="Enter refined prompt..."
                  />
                ) : (
                  <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-black/40 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                    <pre className={`whitespace-pre-wrap text-sm font-mono ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>{editedPrompt}</pre>
                  </div>
                )}
              </div>

              <div className={`flex items-center justify-end gap-3 p-6 border-t ${theme === 'dark' ? 'border-[#00F3FF]/20 bg-black/20' : 'border-blue-200 bg-gray-50'}`}>
                {editingPrompt ? (
                  <>
                    <button
                      onClick={() => setEditingPrompt(false)}
                      className={`px-6 py-2.5 rounded-lg font-medium transition-all ${theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const parsedData = JSON.parse(editedPrompt);
                          const response = await fetch(`${API_BASE_URL}/api/multi-agent/task/approve-prompt`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              task_id: taskId,
                              edited_prp_data: parsedData
                            })
                          });
                          const result = await response.json();
                          if (result.success) {
                            setEditingPrompt(false);
                            setShowPromptModal(false);
                            setApprovedAgents(prev => new Set(prev).add('PROMPT_REFINER'));
                            console.log('✅ Prompt Refiner approved successfully');
                          }
                        } catch (error) {
                          console.error('❌ Approval error:', error);
                        }
                      }}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg ${theme === 'dark' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-green-500/50' : 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:shadow-green-500/50'}`}
                    >
                      <Save className="w-5 h-5" />
                      Save & Approve
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditingPrompt(true)}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg ${theme === 'dark' ? 'bg-gradient-to-r from-[#00F3FF] to-[#0099CC] text-black hover:shadow-[#00F3FF]/50' : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-blue-500/50'}`}
                  >
                    <Edit2 className="w-5 h-5" />
                    Edit Prompt
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPlanModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowPlanModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-[#0a0a0a] border-2 border-[#00F3FF]/30' : 'bg-white border-2 border-blue-200'}`}
            >
              <div className={`flex items-center justify-between p-6 border-b ${theme === 'dark' ? 'border-[#00F3FF]/20 bg-gradient-to-r from-[#00F3FF]/10 to-transparent' : 'border-blue-200 bg-gradient-to-r from-blue-50 to-transparent'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-[#00F3FF]/20' : 'bg-blue-100'}`}>
                    <ClipboardList className={`w-6 h-6 ${theme === 'dark' ? 'text-[#00F3FF]' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-[#00F3FF]' : 'text-blue-700'}`}>Execution Plan</h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Review and edit before execution</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPlanModal(false)}
                  className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-[#00F3FF]/10 text-gray-400 hover:text-[#00F3FF]' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
                {editingPlan ? (
                  <textarea
                    value={JSON.stringify(editedPlan, null, 2)}
                    onChange={(e) => {
                      try {
                        setEditedPlan(JSON.parse(e.target.value));
                      } catch (err) {
                      }
                    }}
                    className={`w-full h-96 p-4 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 transition-all ${theme === 'dark' ? 'bg-black/40 text-gray-300 border border-gray-700 focus:ring-[#00F3FF] focus:border-[#00F3FF]' : 'bg-gray-50 text-gray-800 border border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                    placeholder="Enter execution plan..."
                  />
                ) : (
                  <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-black/40 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
                    <pre className={`whitespace-pre-wrap text-sm font-mono ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>{JSON.stringify(editedPlan, null, 2)}</pre>
                  </div>
                )}
              </div>

              <div className={`flex items-center justify-end gap-3 p-6 border-t ${theme === 'dark' ? 'border-[#00F3FF]/20 bg-black/20' : 'border-blue-200 bg-gray-50'}`}>
                {editingPlan ? (
                  <>
                    <button
                      onClick={() => setEditingPlan(false)}
                      className={`px-6 py-2.5 rounded-lg font-medium transition-all ${theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch(`${API_BASE_URL}/api/multi-agent/task/approve-plan`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              task_id: taskId,
                              edited_plan: editedPlan
                            })
                          });
                          const result = await response.json();
                          if (result.success) {
                            setEditingPlan(false);
                            setShowPlanModal(false);
                            setApprovedAgents(prev => new Set(prev).add('PLANNER'));
                            console.log('✅ Planner approved successfully');
                          }
                        } catch (error) {
                          console.error('❌ Approval error:', error);
                        }
                      }}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg ${theme === 'dark' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-green-500/50' : 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:shadow-green-500/50'}`}
                    >
                      <Save className="w-5 h-5" />
                      Save & Approve
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditingPlan(true)}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg ${theme === 'dark' ? 'bg-gradient-to-r from-[#00F3FF] to-[#0099CC] text-black hover:shadow-[#00F3FF]/50' : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-blue-500/50'}`}
                  >
                    <Edit2 className="w-5 h-5" />
                    Edit Plan
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
