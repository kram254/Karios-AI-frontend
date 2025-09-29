import React, { useState, useEffect, useMemo } from 'react';
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
import CopyableCard from './multi-agent/CopyableCard';

interface AgentStatusData {
  type: string;
  agent_type: string;
  status: 'started' | 'completed' | 'failed' | 'processing';
  message: string;
  data?: any;
  timestamp?: string;
  step_id?: string;
}

interface ClarificationData {
  type: string;
  task_id: string;
  clarification_request: string;
  message: string;
  timestamp?: string;
}

interface ExecutionItem {
  title: string;
  status?: string;
  detail?: string;
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

  console.log('🔥 DEBUG CARD - MultiAgentWorkflowCard rendering:', {
    taskId,
    workflowStage,
    agentUpdatesCount: agentUpdates.length,
    agentUpdatesSummary: agentUpdates.map(u => ({
      agent_type: u.agent_type,
      status: u.status,
      step_id: u.step_id,
      hasData: !!u.data
    })),
    hasClarificationRequest: !!clarificationRequest,
    clarificationRequestDetails: clarificationRequest ? {
      type: clarificationRequest.type,
      task_id: clarificationRequest.task_id,
      clarification_request: clarificationRequest.clarification_request,
      message: clarificationRequest.message,
      timestamp: clarificationRequest.timestamp
    } : null
  });

  const updatesDesc = [...agentUpdates].reverse();
  const plannerUpdate = updatesDesc.find(update => update.agent_type === 'PLANNER' && update.status === 'completed');
  console.log('🔍 DEBUG - Planner update found:', {
    found: !!plannerUpdate,
    step_id: plannerUpdate?.step_id,
    hasData: !!plannerUpdate?.data
  });
  const plannerData = (() => {
    const payload = plannerUpdate?.data || {};
    if (payload.execution_plan && payload.execution_plan.execution_steps) {
      return payload.execution_plan;
    }
    if (payload.plan_data && payload.plan_data.execution_steps) {
      return payload.plan_data;
    }
    if (payload.execution_steps) {
      return payload;
    }
    return null;
  })();
  const planSteps = Array.isArray(plannerData?.execution_steps) ? plannerData.execution_steps : [];
  console.log('🔍 DEBUG - Plan steps extracted:', {
    stepsCount: planSteps.length,
    steps: planSteps.map((step: any, i: number) => ({
      index: i,
      action: step.action || step.description,
      tool_name: step.tool_name,
      step_number: step.step_number
    }))
  });

  const executorUpdate = updatesDesc.find(update => update.agent_type === 'TASK_EXECUTOR' && update.status === 'completed');
  console.log('🔍 DEBUG - Executor update found:', {
    found: !!executorUpdate,
    step_id: executorUpdate?.step_id,
    hasData: !!executorUpdate?.data
  });
  const normalizeExecutionItems = (source: unknown): ExecutionItem[] => {
    if (!source) {
      return [] as ExecutionItem[];
    }
    const sourceRecord = source as { steps?: unknown; execution_steps?: unknown };
    const listCandidate: any[] = Array.isArray(source)
      ? source
      : Array.isArray(sourceRecord.steps)
        ? sourceRecord.steps
        : Array.isArray(sourceRecord.execution_steps)
          ? sourceRecord.execution_steps
          : [];
    return listCandidate.map((item: any, index: number): ExecutionItem => ({
      title: item.action || item.title || item.step || `Step ${item.step_number || index + 1}`,
      status: item.status || item.outcome,
      detail: item.output || item.result || item.details || item.summary
    }));
  };
  const executionItems = normalizeExecutionItems(executorUpdate?.data?.execution_results || executorUpdate?.data);
  console.log('🔍 DEBUG - Execution items extracted:', {
    itemsCount: executionItems.length,
    items: executionItems.map((item, i) => ({
      index: i,
      title: item.title,
      status: item.status,
      hasDetail: !!item.detail
    }))
  });

  const reviewerUpdate = updatesDesc.find(update => update.agent_type === 'REVIEWER' && update.status === 'completed');
  console.log('🔍 DEBUG - Reviewer update found:', {
    found: !!reviewerUpdate,
    step_id: reviewerUpdate?.step_id,
    hasData: !!reviewerUpdate?.data
  });
  const reviewData = reviewerUpdate ? reviewerUpdate.data?.review_data || reviewerUpdate.data : null;
  const reviewScore = typeof reviewData?.overall_score === 'number'
    ? reviewData.overall_score
    : typeof reviewData?.quality_score === 'number'
      ? reviewData.quality_score
      : typeof reviewData?.score === 'number'
        ? reviewData.score
        : null;
  const reviewSummary = reviewData?.summary || reviewData?.analysis || reviewData?.feedback;
  const reviewStrengths = Array.isArray(reviewData?.strengths) ? reviewData.strengths.slice(0, 5) : [];
  const reviewImprovements = Array.isArray(reviewData?.improvement_suggestions) ? reviewData.improvement_suggestions.slice(0, 5) : [];

  const planCopy = useMemo(() => {
    if (!planSteps.length) {
      return '';
    }
    const lines = planSteps.map((step: any, index: number) => {
      const action = step.action || step.description || `Step ${step.step_number || index + 1}`;
      const tool = step.tool_name ? `Tool: ${step.tool_name}` : '';
      const expected = step.expected_output ? `Expected: ${step.expected_output}` : '';
      return [action, tool, expected].filter(Boolean).join(' | ');
    });
    return lines.join('\n');
  }, [planSteps]);

  const executionCopy = useMemo(() => {
    if (!executionItems.length) {
      return '';
    }
    const lines = executionItems.map((item, index) => {
      const status = item.status ? `Status: ${item.status}` : '';
      const detail = item.detail ? `Detail: ${item.detail}` : '';
      return [`Step ${index + 1}: ${item.title}`, status, detail].filter(Boolean).join(' | ');
    });
    return lines.join('\n');
  }, [executionItems]);

  const reviewCopy = useMemo(() => {
    if (!reviewData) {
      return '';
    }
    const segments = [] as string[];
    const scoreLabel = reviewScore !== null ? `Score: ${Math.round(reviewScore)}%` : 'Score: Pending';
    segments.push(scoreLabel);
    if (reviewSummary) {
      segments.push(`Summary: ${reviewSummary}`);
    }
    if (reviewStrengths.length) {
      segments.push(`Strengths: ${reviewStrengths.join(', ')}`);
    }
    if (reviewImprovements.length) {
      segments.push(`Improvements: ${reviewImprovements.join(', ')}`);
    }
    return segments.join('\n');
  }, [reviewData, reviewScore, reviewSummary, reviewStrengths, reviewImprovements]);

  const buildAgentCopy = (update: AgentStatusData) => {
    const pieces = [] as string[];
    pieces.push(`${update.agent_type} - ${update.status}`);
    if (update.message) {
      pieces.push(update.message);
    }
    if (update.timestamp) {
      pieces.push(new Date(update.timestamp).toLocaleString());
    }
    if (update.data && Object.keys(update.data).length > 0) {
      pieces.push(JSON.stringify(update.data, null, 2));
    }
    return pieces.join('\n');
  };

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
        {(() => {
          console.log('🔥 DEBUG CARD RENDER - Clarification request conditional check:', {
            hasClarificationRequest: !!clarificationRequest,
            clarificationRequestFull: clarificationRequest,
            willRender: !!clarificationRequest
          });
          return clarificationRequest;
        })() && (
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
                <p className="text-white text-sm mb-3">{clarificationRequest?.clarification_request}</p>
                
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

      {planSteps.length > 0 && (
        <CopyableCard
          title="Execution Plan"
          subtitle="Structured steps generated by the planner"
          meta="Planner"
          copyContent={planCopy}
          accentColor="from-[#10192B] to-[#0C1422]"
        >
          <ol className="space-y-3 list-decimal list-inside text-sm text-gray-300">
            {planSteps.map((step: any, index: number) => (
              <li key={`plan-step-${step.step_number || index}`}
                  className="rounded-xl border border-[#1E2A44] bg-[#121D32] p-3">
                <div className="text-white font-medium text-sm">{step.action || step.description || `Step ${step.step_number || index + 1}`}</div>
                <div className="text-xs text-gray-400">Tool: {step.tool_name || 'Unassigned'}</div>
                {step.expected_output && (
                  <div className="text-xs text-gray-400 mt-1">Expected: {step.expected_output}</div>
                )}
                {Array.isArray(step.parameters) ? step.parameters.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">Parameters: {step.parameters.join(', ')}</div>
                ) : step.parameters && (
                  <div className="text-xs text-gray-500 mt-1">Parameters: {JSON.stringify(step.parameters)}</div>
                )}
              </li>
            ))}
          </ol>
        </CopyableCard>
      )}

      {executionItems.length > 0 && (
        <CopyableCard
          title="Execution Progress"
          subtitle="Outputs from tool executions"
          meta="Task Executor"
          copyContent={executionCopy}
          accentColor="from-[#10192B] to-[#0C1422]"
        >
          <ul className="space-y-3 text-sm text-gray-300">
            {executionItems.map((item, index) => (
              <li key={`execution-item-${index}`} className="rounded-xl border border-[#1E2A44] bg-[#121D32] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium text-sm">{item.title}</span>
                  {item.status && (
                    <span className="text-xs text-blue-300 uppercase tracking-wide">{item.status}</span>
                  )}
                </div>
                {item.detail && (
                  <div className="text-xs text-gray-400 mt-2 leading-relaxed">{item.detail}</div>
                )}
              </li>
            ))}
          </ul>
        </CopyableCard>
      )}

      {reviewData && (
        <CopyableCard
          title="Quality Review"
          subtitle="Insights from the reviewer agent"
          meta="Reviewer"
          copyContent={reviewCopy}
          accentColor="from-[#0F1A2E] to-[#0A1524]"
        >
          <div className="space-y-3 text-sm text-gray-300">
            <div className="text-sm text-white">Score: {reviewScore !== null ? `${Math.round(reviewScore)}%` : 'Pending'}</div>
            {reviewSummary && (
              <div className="text-sm text-gray-300 leading-relaxed">{reviewSummary}</div>
            )}
            {reviewStrengths.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-green-300 uppercase tracking-wide">Strengths</div>
                <ul className="space-y-1 text-xs text-gray-300">
                  {reviewStrengths.map((item: string, index: number) => (
                    <li key={`review-strength-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            )}
            {reviewImprovements.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-yellow-300 uppercase tracking-wide">Improvements</div>
                <ul className="space-y-1 text-xs text-gray-300">
                  {reviewImprovements.map((item: string, index: number) => (
                    <li key={`review-improvement-${index}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CopyableCard>
      )}

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
                transition={{ delay: index * 0.08 }}
              >
                <CopyableCard
                  title={update.agent_type.replace('_', ' ')}
                  subtitle={update.message}
                  meta={update.status.toUpperCase()}
                  copyContent={buildAgentCopy(update)}
                  accentColor="from-[#111B2E] to-[#0D1726]"
                >
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-2 ${getStatusColor(update.status)}`}>
                      {getAgentIcon(update.agent_type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      {update.step_id && (
                        <div className="text-xs text-gray-400">Step: {update.step_id}</div>
                      )}
                      {update.timestamp && (
                        <div className="text-xs text-gray-500">{new Date(update.timestamp).toLocaleTimeString()}</div>
                      )}
                    </div>
                  </div>
                  {update.data && Object.keys(update.data).length > 0 && (
                    <details className="rounded-xl bg-black/20 p-3 text-xs text-gray-300">
                      <summary className="cursor-pointer text-gray-400">View Details</summary>
                      <pre className="mt-2 overflow-x-auto text-slate-200">
                        {JSON.stringify(update.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </CopyableCard>
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
