import React, { useState, useEffect, useRef } from 'react';
import { WorkflowCanvas } from './WorkflowCanvas';
import { Brain, Play, CheckCircle, AlertCircle, Clock, ChevronDown, ChevronRight, Edit2, Save, X, FileText, ClipboardList, Code, BarChart3, FileCheck, Box, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExecutionOutputModal, ReviewScoreModal, FormattedOutputModal } from './WorkflowOutputModals';

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

const EnhancedMultiAgentWorkflowCardComponent: React.FC<EnhancedWorkflowProps> = ({
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
  const [collapsedAgents, setCollapsedAgents] = useState<Set<string>>(new Set(['PROMPT_REFINER', 'PLANNER', 'TASK_EXECUTOR', 'REVIEWER', 'FORMATTER']));
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [editingPlan, setEditingPlan] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState('');
  const [editedPlan, setEditedPlan] = useState<any>(null);
  const [showPromptCard, setShowPromptCard] = useState(false);
  const [showPlanCard, setShowPlanCard] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showFormatterModal, setShowFormatterModal] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Set<number>>(new Set());
  const updateDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (updateDebounceRef.current) {
      clearTimeout(updateDebounceRef.current);
    }
    
    updateDebounceRef.current = setTimeout(() => {
      const now = Date.now();
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

    if (grouped['PROMPT_REFINER']) {
      console.log('🎯🎯🎯 CARD RECEIVED - PROMPT_REFINER updates:', grouped['PROMPT_REFINER'].length);
      grouped['PROMPT_REFINER'].forEach((update: any, idx: number) => {
        console.log(`🎯🎯🎯 CARD - Update ${idx + 1}:`, {
          status: update.status,
          hasData: !!update.data,
          hasPrpData: !!update.data?.prp_data,
          dataKeys: update.data ? Object.keys(update.data) : []
        });
      });
    }

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

    if (plannerComplete && plannerData && !showPlanCard) {
      console.log('🎯 SETTING showPlanCard = true', {
        execution_plan: plannerData.data?.execution_plan
      });
      setShowPlanCard(true);
      if (!editedPlan && plannerData.data?.execution_plan) {
        setEditedPlan(plannerData.data.execution_plan);
      }
    }
    }, 500);
    
    return () => {
      if (updateDebounceRef.current) clearTimeout(updateDebounceRef.current);
    };
  }, [agentUpdates]);

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

              const promptRefinerDone = grouped['PROMPT_REFINER']?.some((u: any) => u.status === 'completed');
              const plannerDone = grouped['PLANNER']?.some((u: any) => u.status === 'completed');
              const executorDone = grouped['TASK_EXECUTOR']?.some((u: any) => u.status === 'completed');
              const reviewerDone = grouped['REVIEWER']?.some((u: any) => u.status === 'completed');

              console.log('🎯🎯🎯 CARD VISIBILITY CHECK:', {
                allAgents: Object.keys(grouped),
                promptRefinerDone,
                plannerDone,
                plannerUpdatesCount: grouped['PLANNER']?.length || 0,
                plannerShouldShow: promptRefinerDone || (grouped['PLANNER']?.length || 0) > 0
              });

              const filteredEntries = (Object.entries(grouped) as [string, any[]][]).filter(([agentType]) => {
                if (agentType === 'PROMPT_REFINER') return true;
                if (agentType === 'PLANNER') return promptRefinerDone || grouped['PLANNER']?.length > 0;
                if (agentType === 'TASK_EXECUTOR') return plannerDone || grouped['TASK_EXECUTOR']?.length > 0;
                if (agentType === 'REVIEWER') return executorDone || grouped['REVIEWER']?.length > 0;
                if (agentType === 'FORMATTER') return reviewerDone || grouped['FORMATTER']?.length > 0;
                return false;
              });

              return filteredEntries.map(([agentType, updates]) => {
                const agentName = agentMap[agentType] || agentType.replace(/_/g, ' ');
                const latestUpdate = updates[updates.length - 1];
                const allCompleted = latestUpdate?.status === 'completed';
                const hasStarted = updates.some(u => u.status === 'started' || u.status === 'processing');
                const isCollapsed = collapsedAgents.has(agentType);
                
                if (agentType === 'PROMPT_REFINER') {
                  console.log('🎯🎯🎯 RENDER LOGIC - PROMPT_REFINER:', {
                    updatesCount: updates.length,
                    latestStatus: latestUpdate?.status,
                    allCompleted,
                    hasStarted,
                    showPromptCard,
                    willRenderButton: allCompleted && showPromptCard
                  });
                }
                
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
                      {(() => {
                        if (agentType === 'PROMPT_REFINER') {
                          console.log('🎯🎯🎯 BUTTON CHECK - PROMPT_REFINER card:', {
                            showPromptCard,
                            allCompleted,
                            willRenderButton: showPromptCard && allCompleted
                          });
                        }
                        return null;
                      })()}
                      {agentType === 'PROMPT_REFINER' && showPromptCard && allCompleted && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowPromptModal(true);
                          }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg ${theme === 'dark' ? 'bg-gradient-to-r from-[#00F3FF] to-[#0099CC] text-black hover:shadow-[#00F3FF]/50' : 'bg-gradient-to-r from-blue-600 to-blue-400 text-white hover:shadow-blue-500/50'}`}
                        >
                          <FileText className="w-4 h-4" />
                          <span className="text-sm">Check Prompt</span>
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
                          <span className="text-sm">Check Plan</span>
                        </button>
                      )}
                      {agentType === 'TASK_EXECUTOR' && allCompleted && (() => {
                        const executorData = updates.find((u: any) => u.status === 'completed' && u.data?.execution_results);
                        return executorData ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowExecutionModal(true);
                          }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg ${theme === 'dark' ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-black hover:shadow-emerald-500/50' : 'bg-gradient-to-r from-green-600 to-green-400 text-white hover:shadow-green-500/50'}`}
                        >
                          <Code className="w-4 h-4" />
                          <span className="text-sm">Check Output</span>
                        </button>
                        ) : null;
                      })()}
                      {agentType === 'REVIEWER' && allCompleted && (() => {
                        const reviewerData = updates.find((u: any) => u.status === 'completed' && u.data?.quality_score !== undefined);
                        return reviewerData ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowReviewModal(true);
                          }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg ${theme === 'dark' ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white hover:shadow-purple-500/50' : 'bg-gradient-to-r from-purple-600 to-purple-400 text-white hover:shadow-purple-500/50'}`}
                        >
                          <BarChart3 className="w-4 h-4" />
                          <span className="text-sm">Check Review Score</span>
                        </button>
                        ) : null;
                      })()}
                      {agentType === 'FORMATTER' && allCompleted && (() => {
                        const formatterData = updates.find((u: any) => u.status === 'completed' && u.data?.formatted_output);
                        return formatterData ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowFormatterModal(true);
                          }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg ${theme === 'dark' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black hover:shadow-orange-500/50' : 'bg-gradient-to-r from-orange-600 to-orange-400 text-white hover:shadow-orange-500/50'}`}
                        >
                          <FileCheck className="w-4 h-4" />
                          <span className="text-sm">Formatted Output</span>
                        </button>
                        ) : null;
                      })()}
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

                            {(() => {
                              if (agentType !== 'TASK_EXECUTOR' || !allCompleted) return null;
                              const executorData = updates.find((u: any) => u.status === 'completed' && u.data?.execution_results);
                              if (!executorData?.data?.execution_results?.step_results) return null;
                              
                              const stepResults = executorData.data.execution_results.step_results;
                              
                              const getToolIcon = (toolName: string) => {
                                const lowerTool = toolName.toLowerCase();
                                if (lowerTool.includes('perplexity') || lowerTool.includes('sonar')) {
                                  return <img src="https://pplx-res.cloudinary.com/image/upload/v1687199952/favicon_lty4np.svg" alt="Perplexity" className="w-4 h-4" />;
                                }
                                if (lowerTool.includes('google')) {
                                  return <img src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png" alt="Google" className="w-4 h-4" />;
                                }
                                if (lowerTool.includes('code') || lowerTool.includes('python') || lowerTool.includes('execute')) {
                                  return <img src="https://www.python.org/static/favicon.ico" alt="Python" className="w-4 h-4" />;
                                }
                                if (lowerTool.includes('scraper') || lowerTool.includes('scrape') || lowerTool.includes('web')) {
                                  return <img src="https://www.google.com/chrome/static/images/chrome-logo-m100.svg" alt="Chrome" className="w-4 h-4" />;
                                }
                                if (lowerTool.includes('content') || lowerTool.includes('generation') || lowerTool.includes('openai')) {
                                  return <img src="https://openai.com/favicon.ico" alt="OpenAI" className="w-4 h-4" />;
                                }
                                return <Box className="w-4 h-4" />;
                              };
                              
                              const getToolDisplayName = (toolName: string, action: string) => {
                                const lowerTool = toolName.toLowerCase();
                                if (lowerTool.includes('perplexity') || lowerTool.includes('sonar')) return 'Search Perplexity';
                                if (lowerTool.includes('google')) return 'Google Search';
                                if (lowerTool.includes('scraper')) return 'Extract Webpage Text';
                                if (lowerTool.includes('code')) return 'Execute Code';
                                if (lowerTool.includes('content')) return 'Generate Content';
                                return action || toolName;
                              };
                              
                              return (
                                <div className={`mt-4 space-y-2`}>
                                  <div className={`flex items-center gap-2 mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <Zap className="w-4 h-4" />
                                    <h4 className="text-sm font-semibold">Tools Used</h4>
                                  </div>
                                  {stepResults.map((step: any, idx: number) => {
                                    const isExpanded = expandedTools.has(idx);
                                    const toolName = step.tool_name || 'Unknown Tool';
                                    const action = step.action || '';
                                    const displayName = getToolDisplayName(toolName, action);
                                    const isSuccess = step.success;
                                    
                                    return (
                                      <div
                                        key={idx}
                                        className={`rounded-lg border transition-all ${theme === 'dark' ? 'bg-black/20 border-gray-700/50 hover:border-[#00F3FF]/30' : 'bg-white border-gray-200 hover:border-blue-300'}`}
                                      >
                                        <button
                                          onClick={() => {
                                            const newExpanded = new Set(expandedTools);
                                            if (isExpanded) {
                                              newExpanded.delete(idx);
                                            } else {
                                              newExpanded.add(idx);
                                            }
                                            setExpandedTools(newExpanded);
                                          }}
                                          className="w-full px-4 py-3 flex items-center justify-between"
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-[#00F3FF]/10 text-[#00F3FF]' : 'bg-blue-50 text-blue-600'}`}>
                                              {getToolIcon(toolName)}
                                            </div>
                                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                                              {displayName}
                                            </span>
                                          </div>
                                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''} ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`} />
                                        </button>
                                        
                                        <AnimatePresence>
                                          {isExpanded && (
                                            <motion.div
                                              initial={{ height: 0, opacity: 0 }}
                                              animate={{ height: 'auto', opacity: 1 }}
                                              exit={{ height: 0, opacity: 0 }}
                                              transition={{ duration: 0.2 }}
                                              className="overflow-hidden"
                                            >
                                              <div className={`px-4 pb-4 space-y-3 border-t ${theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200'}`}>
                                                {step.parameters && Object.keys(step.parameters).length > 0 && (
                                                  <div className="pt-3">
                                                    <div className={`text-xs font-medium mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Query</div>
                                                    <div className={`text-sm p-3 rounded-md font-mono ${theme === 'dark' ? 'bg-black/40 text-gray-300' : 'bg-gray-50 text-gray-800'}`}>
                                                      {typeof step.parameters === 'string' 
                                                        ? step.parameters 
                                                        : step.parameters.query || step.parameters.prompt || step.parameters.code || JSON.stringify(step.parameters, null, 2)}
                                                    </div>
                                                  </div>
                                                )}
                                                
                                                {step.output && (
                                                  <div>
                                                    <div className={`text-xs font-medium mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Result</div>
                                                    <div className={`text-sm p-3 rounded-md max-h-64 overflow-y-auto ${theme === 'dark' ? 'bg-black/40 text-gray-300' : 'bg-gray-50 text-gray-800'}`}>
                                                      <pre className="whitespace-pre-wrap font-mono text-xs">
                                                        {typeof step.output === 'string' 
                                                          ? step.output.length > 500 
                                                            ? step.output.substring(0, 500) + '...' 
                                                            : step.output
                                                          : JSON.stringify(step.output, null, 2).substring(0, 500)
                                                        }
                                                      </pre>
                                                    </div>
                                                  </div>
                                                )}
                                                
                                                {step.duration && (
                                                  <div className={`text-xs flex items-center gap-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                                                    <Clock className="w-3 h-3" />
                                                    <span>Duration: {step.duration.toFixed(2)}s</span>
                                                  </div>
                                                )}
                                                
                                                {!isSuccess && step.error && (
                                                  <div className={`text-xs p-2 rounded-md ${theme === 'dark' ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                                    <span className="font-semibold">Error: </span>{step.error}
                                                  </div>
                                                )}
                                              </div>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}

                            {(() => {
                              if (agentType !== 'PLANNER' || !allCompleted) return null;
                              const planUpdateData = updates.find((u: any) => u.status === 'completed' && u.data?.execution_plan);
                              if (!planUpdateData?.data?.execution_plan) return null;
                              
                              return (
                                <div className={`mt-4 p-4 rounded-lg ${theme === 'dark' ? 'bg-black/40 border border-[#00F3FF]/20' : 'bg-white border border-blue-200'}`}>
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className={`text-sm font-semibold flex items-center gap-2 ${theme === 'dark' ? 'text-[#00F3FF]' : 'text-blue-600'}`}>
                                      <ClipboardList className="w-4 h-4" />
                                      Execution Plan
                                    </h4>
                                    {!editingPlan ? (
                                      <button
                                        onClick={() => {
                                          setEditingPlan(true);
                                          if (!editedPlan) {
                                            setEditedPlan(planUpdateData.data.execution_plan);
                                          }
                                        }}
                                        className={`p-1.5 rounded-md transition-colors ${theme === 'dark' ? 'hover:bg-[#00F3FF]/20 text-[#00F3FF]' : 'hover:bg-blue-100 text-blue-600'}`}
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                    ) : (
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => {
                                            setEditingPlan(false);
                                            setEditedPlan(planUpdateData.data.execution_plan);
                                          }}
                                          className={`p-1.5 rounded-md transition-colors ${theme === 'dark' ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-100 text-red-600'}`}
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={async () => {
                                            try {
                                              const response = await fetch(`${API_BASE_URL}/api/multi-agent/task/approve-plan`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                  task_id: taskId,
                                                  approved: true,
                                                  edited_plan: editedPlan
                                                })
                                              });
                                              if (response.ok) {
                                                setEditingPlan(false);
                                                console.log('✅ Plan updated and saved');
                                              }
                                            } catch (error) {
                                              console.error('Failed to save plan:', error);
                                            }
                                          }}
                                          className={`p-1.5 rounded-md transition-colors ${theme === 'dark' ? 'hover:bg-green-500/20 text-green-400' : 'hover:bg-green-100 text-green-600'}`}
                                        >
                                          <Save className="w-4 h-4" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  {editingPlan ? (
                                    <textarea
                                      value={typeof editedPlan === 'string' ? editedPlan : JSON.stringify(editedPlan, null, 2)}
                                      onChange={(e) => setEditedPlan(e.target.value)}
                                      className={`w-full h-64 p-3 rounded-md font-mono text-xs ${
                                        theme === 'dark' 
                                          ? 'bg-black/40 text-gray-300 border border-[#00F3FF]/30' 
                                          : 'bg-white text-gray-800 border border-blue-300'
                                      }`}
                                    />
                                  ) : (
                                    <div className={`text-xs space-y-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                      {typeof planUpdateData.data.execution_plan === 'string' ? (
                                        <pre className="whitespace-pre-wrap font-mono">{planUpdateData.data.execution_plan}</pre>
                                      ) : (
                                        <>
                                          {planUpdateData.data.execution_plan.steps?.map((step: any, idx: number) => (
                                            <div key={idx} className={`p-3 rounded-md ${theme === 'dark' ? 'bg-black/20' : 'bg-gray-50'}`}>
                                              <div className="flex items-start gap-2">
                                                <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                                  theme === 'dark' ? 'bg-[#00F3FF]/20 text-[#00F3FF]' : 'bg-blue-100 text-blue-600'
                                                }`}>
                                                  {idx + 1}
                                                </span>
                                                <div className="flex-1">
                                                  <p className="font-semibold mb-1">{step.action || step.description}</p>
                                                  {step.tool && (
                                                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                                                      Tool: {step.tool}
                                                    </p>
                                                  )}
                                                  {step.expected_output && (
                                                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                      {step.expected_output}
                                                    </p>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

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

      <ExecutionOutputModal
        show={showExecutionModal}
        onClose={() => setShowExecutionModal(false)}
        executionResults={(() => {
          const grouped = agentUpdates.reduce((acc, u) => {
            const t = u.agent_type || 'UNKNOWN';
            if (!acc[t]) acc[t] = [];
            acc[t].push(u);
            return acc;
          }, {} as { [key: string]: any[] });
          const d = grouped['TASK_EXECUTOR']?.find((u: any) => u.status === 'completed' && u.data?.execution_results);
          return d?.data?.execution_results || 'No output available';
        })()}
        theme={theme}
      />

      <ReviewScoreModal
        show={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        qualityScore={(() => {
          const grouped = agentUpdates.reduce((acc, u) => {
            const t = u.agent_type || 'UNKNOWN';
            if (!acc[t]) acc[t] = [];
            acc[t].push(u);
            return acc;
          }, {} as { [key: string]: any[] });
          const d = grouped['REVIEWER']?.find((u: any) => u.status === 'completed' && u.data?.quality_score !== undefined);
          return d?.data?.quality_score || 0;
        })()}
        reviewReport={(() => {
          const grouped = agentUpdates.reduce((acc, u) => {
            const t = u.agent_type || 'UNKNOWN';
            if (!acc[t]) acc[t] = [];
            acc[t].push(u);
            return acc;
          }, {} as { [key: string]: any[] });
          const d = grouped['REVIEWER']?.find((u: any) => u.status === 'completed' && u.data?.quality_score !== undefined);
          return d?.data?.review_report || 'No review data available';
        })()}
        theme={theme}
      />

      <FormattedOutputModal
        show={showFormatterModal}
        onClose={() => setShowFormatterModal(false)}
        formattedOutput={(() => {
          const grouped = agentUpdates.reduce((acc, u) => {
            const t = u.agent_type || 'UNKNOWN';
            if (!acc[t]) acc[t] = [];
            acc[t].push(u);
            return acc;
          }, {} as { [key: string]: any[] });
          const d = grouped['FORMATTER']?.find((u: any) => u.status === 'completed' && u.data?.formatted_output);
          return d?.data?.formatted_output || 'No formatted output available';
        })()}
        theme={theme}
      />
    </motion.div>
  );
};

export const EnhancedMultiAgentWorkflowCard = React.memo(
  EnhancedMultiAgentWorkflowCardComponent,
  (prevProps, nextProps) => {
    if (prevProps.taskId !== nextProps.taskId) return false;
    if (prevProps.workflowStage !== nextProps.workflowStage) return false;
    if (prevProps.theme !== nextProps.theme) return false;
    
    if (prevProps.agentUpdates.length !== nextProps.agentUpdates.length) return false;
    
    const prevLastUpdate = prevProps.agentUpdates[prevProps.agentUpdates.length - 1];
    const nextLastUpdate = nextProps.agentUpdates[nextProps.agentUpdates.length - 1];
    if (prevLastUpdate?.timestamp !== nextLastUpdate?.timestamp) return false;
    if (prevLastUpdate?.status !== nextLastUpdate?.status) return false;
    
    return true;
  }
);
