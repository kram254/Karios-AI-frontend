import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Tabs, Tab, Typography, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Button, Checkbox, FormControlLabel, Chip, CircularProgress } from '@mui/material';
import { Paintbrush, Bot, Workflow, Wrench, Library, Puzzle, Plug, Settings, Zap, Clock } from 'lucide-react';
import { scheduledTasksService } from '../services/api/scheduled-tasks.service';
import AgentCreationWizard from '../components/agent/AgentCreationWizard';
import { AutomationWorkspace } from '../components/AutomationWorkspace';
import { WorkflowBuilder } from '../components/workflow/WorkflowBuilder';
import { StagehandAutomation } from '../components/StagehandAutomation';
import SkillLibrary from '../components/skills/SkillLibrary';
import ScheduledTasks from './ScheduledTasks';
import { Agent, AgentRole, AgentMode, SEND_MAIL, SEARCH_INTERNET, EXECUTE_CODE } from '../types/agent';
import type { Workflow as BuilderWorkflow } from '../types/workflow';
import { agentService } from '../services/api/agent.service';
import { skillService } from '../services/api/skill.service';
import { Skill } from '../types/skill';
import { agentSkillsService, AgentSkill } from '../services/agentSkillsService';
import { useAuth } from '../context/AuthContext';
import { SplineScene } from '../components/ui/splite';
import { Spotlight } from '../components/ui/aceternity-spotlight';
import toast from 'react-hot-toast';

 const API_BASE_URL = String((import.meta as any).env?.VITE_BACKEND_URL || '').replace(/\/$/, '');
 const apiUrl = (path: string) => (API_BASE_URL ? `${API_BASE_URL}${path}` : path);

 const getAuthHeaders = () => {
  const headers: Record<string, string> = {};
  try {
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch {}
  return headers;
 };

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

type WorkflowTemplateKey =
  | 'contentMarketing'
  | 'leadEnrichment'
  | 'customerOnboarding'
  | 'competitiveAnalysis'
  | 'codeReviewBot'
  | 'socialMediaManager'
  | 'parallelResearch'
  | 'contentApproval'
  | 'customerSupport'
  | 'dataPipeline';

type WorkflowDiscoverySummary = {
  requiredCredentials: string[];
  policyProfile: string;
  estimatedCostUsd: number;
  externalActionCount: number;
};

type WorkflowDiscoveryMetrics = WorkflowDiscoverySummary & {
  totalRuns: number;
  successRate: number | null;
  avgLatencyMs: number | null;
  lastStatus: string | null;
};

function makeLinearTemplate(
  id: string,
  name: string,
  description: string,
  category: string,
  tags: string[],
  agentLabel: string,
  agentPrompt: string
): BuilderWorkflow {
  const now = new Date().toISOString();
  return {
    id,
    name,
    description,
    category,
    tags,
    difficulty: 'Intermediate',
    estimatedTime: '5-15 minutes',
    nodes: [
      {
        id: 'start',
        type: 'custom',
        position: { x: 250, y: 60 },
        data: {
          label: 'Start',
          nodeType: 'start',
          config: {
            inputVariables: [],
          },
        },
      },
      {
        id: 'agent',
        type: 'custom',
        position: { x: 250, y: 220 },
        data: {
          label: agentLabel,
          nodeType: 'agent',
          config: {
            prompt: agentPrompt,
            model: 'gpt-4',
            temperature: 0.6,
            maxTokens: 1600,
            reasoningEffort: 'medium',
            outputFormat: 'text',
            verbosity: 'medium',
            includeChatHistory: true,
            writeConversationHistory: false,
            showReasoning: false,
          },
        },
      },
      {
        id: 'end',
        type: 'custom',
        position: { x: 250, y: 380 },
        data: {
          label: 'End',
          nodeType: 'end',
          config: {
            outputVariable: 'result',
          },
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'agent', type: 'smoothstep' },
      { id: 'e2', source: 'agent', target: 'end', type: 'smoothstep' },
    ],
    createdAt: now,
    updatedAt: now,
    isTemplate: true,
  };
}

const builderWorkflowTemplates: Record<WorkflowTemplateKey, BuilderWorkflow> = {
  contentMarketing: makeLinearTemplate(
    'template-content-marketing-pipeline',
    'Content Marketing Pipeline',
    'Research, write, and polish long-form marketing content for a given topic and audience.',
    'Marketing',
    ['marketing', 'content'],
    'Content Writer',
    'You are a content marketing specialist. Produce a detailed article or campaign asset based on the provided topic, audience, and tone. Focus on clarity, value, and actionable insights.'
  ),
  leadEnrichment: makeLinearTemplate(
    'template-lead-enrichment',
    'Lead Enrichment',
    'Enrich raw leads with company, role, and intent insights.',
    'Sales',
    ['sales', 'enrichment'],
    'Lead Enrichment Agent',
    'You are a B2B sales assistant. Given basic lead details, enrich them with company info, role, and buying signals to prepare for outreach.'
  ),
  customerOnboarding: makeLinearTemplate(
    'template-customer-onboarding',
    'Customer Onboarding',
    'Generate an onboarding plan and communication sequence for new customers.',
    'Support',
    ['onboarding', 'customer-success'],
    'Onboarding Planner',
    'You are a customer success specialist. Design a short onboarding plan and set of messages that guide a new customer to value quickly.'
  ),
  competitiveAnalysis: makeLinearTemplate(
    'template-competitive-analysis',
    'Competitive Analysis',
    'Summarize competitor offerings and strategic differences.',
    'Research',
    ['research', 'competitive'],
    'Competitive Analyst',
    'You are a market analyst. Compare our product against listed competitors, highlighting strengths, weaknesses, and strategic opportunities.'
  ),
  codeReviewBot: makeLinearTemplate(
    'template-code-review-bot',
    'Code Review Bot',
    'Analyze code changes and suggest improvements before merge.',
    'Development',
    ['code', 'review'],
    'Code Review Assistant',
    'You are a senior software engineer. Review the provided code diff for bugs, readability issues, and performance problems, suggesting concrete improvements.'
  ),
  socialMediaManager: makeLinearTemplate(
    'template-social-media-manager',
    'Social Media Manager',
    'Draft a set of social posts for multiple channels from a core message.',
    'Marketing',
    ['marketing', 'social'],
    'Social Media Strategist',
    'You are a social media strategist. Turn the core message and context into a short campaign plan and channel-specific posts.'
  ),
  parallelResearch: {
    id: 'template-parallel-research', name: 'Parallel Research Pipeline', description: 'Fan out research across three specialist agents, then synthesize findings.', category: 'Research', tags: ['research', 'parallel', 'multi-agent'], difficulty: 'Intermediate', estimatedTime: '10-20 minutes',
    nodes: [
      { id: 'start', type: 'custom' as const, position: { x: 350, y: 60 }, data: { label: 'Start', nodeType: 'start' as const, config: { inputVariables: [] } } },
      { id: 'fork', type: 'custom' as const, position: { x: 350, y: 200 }, data: { label: 'Fork', nodeType: 'fork' as const, config: {} } },
      { id: 'a1', type: 'custom' as const, position: { x: 100, y: 360 }, data: { label: 'Market Research', nodeType: 'agent' as const, config: { prompt: 'Analyze market size, growth trends, and key segments.', model: 'gpt-4', temperature: 0.5, maxTokens: 1200 } } },
      { id: 'a2', type: 'custom' as const, position: { x: 350, y: 360 }, data: { label: 'Competitor Analysis', nodeType: 'agent' as const, config: { prompt: 'Identify top competitors and compare positioning, pricing, strengths.', model: 'gpt-4', temperature: 0.5, maxTokens: 1200 } } },
      { id: 'a3', type: 'custom' as const, position: { x: 600, y: 360 }, data: { label: 'Customer Insights', nodeType: 'agent' as const, config: { prompt: 'Identify customer personas, pain points, and buying triggers.', model: 'gpt-4', temperature: 0.5, maxTokens: 1200 } } },
      { id: 'join', type: 'custom' as const, position: { x: 350, y: 520 }, data: { label: 'Join', nodeType: 'join' as const, config: {} } },
      { id: 'synth', type: 'custom' as const, position: { x: 350, y: 680 }, data: { label: 'Synthesis', nodeType: 'agent' as const, config: { prompt: 'Synthesize all research into a strategic brief with key findings and recommendations.', model: 'gpt-4', temperature: 0.6, maxTokens: 2000 } } },
      { id: 'end', type: 'custom' as const, position: { x: 350, y: 840 }, data: { label: 'End', nodeType: 'end' as const, config: { outputVariable: 'result' } } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'fork', type: 'smoothstep' as const }, { id: 'e2', source: 'fork', target: 'a1', type: 'smoothstep' as const }, { id: 'e3', source: 'fork', target: 'a2', type: 'smoothstep' as const }, { id: 'e4', source: 'fork', target: 'a3', type: 'smoothstep' as const },
      { id: 'e5', source: 'a1', target: 'join', type: 'smoothstep' as const }, { id: 'e6', source: 'a2', target: 'join', type: 'smoothstep' as const }, { id: 'e7', source: 'a3', target: 'join', type: 'smoothstep' as const },
      { id: 'e8', source: 'join', target: 'synth', type: 'smoothstep' as const }, { id: 'e9', source: 'synth', target: 'end', type: 'smoothstep' as const },
    ],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isTemplate: true,
  },
  contentApproval: {
    id: 'template-content-approval', name: 'Content with Approval Gate', description: 'Research, quality check, edit or revise, then human approval.', category: 'Marketing', tags: ['content', 'approval', 'conditional'], difficulty: 'Intermediate', estimatedTime: '10-20 minutes',
    nodes: [
      { id: 'start', type: 'custom' as const, position: { x: 350, y: 60 }, data: { label: 'Start', nodeType: 'start' as const, config: { inputVariables: [] } } },
      { id: 'research', type: 'custom' as const, position: { x: 350, y: 200 }, data: { label: 'Research Agent', nodeType: 'agent' as const, config: { prompt: 'Research the topic and produce structured notes.', model: 'gpt-4', temperature: 0.5, maxTokens: 1400 } } },
      { id: 'qc', type: 'custom' as const, position: { x: 350, y: 360 }, data: { label: 'Quality Check', nodeType: 'if-else' as const, config: { condition: 'output.qualityScore >= 7' } } },
      { id: 'editor', type: 'custom' as const, position: { x: 150, y: 520 }, data: { label: 'Editor', nodeType: 'agent' as const, config: { prompt: 'Polish the draft for clarity and flow.', model: 'gpt-4', temperature: 0.4, maxTokens: 1800 } } },
      { id: 'revision', type: 'custom' as const, position: { x: 560, y: 520 }, data: { label: 'Revision', nodeType: 'agent' as const, config: { prompt: 'Rewrite the draft to fix quality issues.', model: 'gpt-4', temperature: 0.6, maxTokens: 1600 } } },
      { id: 'approval', type: 'custom' as const, position: { x: 150, y: 680 }, data: { label: 'Approval', nodeType: 'approval' as const, config: { approvalMessage: 'Review and approve content.' } } },
      { id: 'end', type: 'custom' as const, position: { x: 150, y: 840 }, data: { label: 'End', nodeType: 'end' as const, config: { outputVariable: 'result' } } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'research', type: 'smoothstep' as const }, { id: 'e2', source: 'research', target: 'qc', type: 'smoothstep' as const },
      { id: 'e3', source: 'qc', target: 'editor', type: 'smoothstep' as const, sourceHandle: 'true' }, { id: 'e4', source: 'qc', target: 'revision', type: 'smoothstep' as const, sourceHandle: 'false' },
      { id: 'e5', source: 'revision', target: 'editor', type: 'smoothstep' as const }, { id: 'e6', source: 'editor', target: 'approval', type: 'smoothstep' as const }, { id: 'e7', source: 'approval', target: 'end', type: 'smoothstep' as const },
    ],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isTemplate: true,
  },
  customerSupport: {
    id: 'template-customer-support', name: 'Multi-Agent Support Router', description: 'Classify requests and route to technical or billing specialists.', category: 'Support', tags: ['support', 'routing', 'multi-agent'], difficulty: 'Intermediate', estimatedTime: '5-15 minutes',
    nodes: [
      { id: 'start', type: 'custom' as const, position: { x: 350, y: 60 }, data: { label: 'Start', nodeType: 'start' as const, config: { inputVariables: [] } } },
      { id: 'classify', type: 'custom' as const, position: { x: 350, y: 200 }, data: { label: 'Classify', nodeType: 'agent' as const, config: { prompt: 'Classify the request as technical or billing.', model: 'gpt-4', temperature: 0.2, maxTokens: 100 } } },
      { id: 'route', type: 'custom' as const, position: { x: 350, y: 360 }, data: { label: 'Route', nodeType: 'if-else' as const, config: { condition: 'output === "technical"' } } },
      { id: 'tech', type: 'custom' as const, position: { x: 150, y: 520 }, data: { label: 'Technical Agent', nodeType: 'agent' as const, config: { prompt: 'Diagnose and resolve the technical issue.', model: 'gpt-4', temperature: 0.3, maxTokens: 1600 } } },
      { id: 'billing', type: 'custom' as const, position: { x: 560, y: 520 }, data: { label: 'Billing Agent', nodeType: 'agent' as const, config: { prompt: 'Address the billing question with accuracy.', model: 'gpt-4', temperature: 0.3, maxTokens: 1200 } } },
      { id: 'end1', type: 'custom' as const, position: { x: 150, y: 680 }, data: { label: 'End', nodeType: 'end' as const, config: { outputVariable: 'result' } } },
      { id: 'end2', type: 'custom' as const, position: { x: 560, y: 680 }, data: { label: 'End', nodeType: 'end' as const, config: { outputVariable: 'result' } } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'classify', type: 'smoothstep' as const }, { id: 'e2', source: 'classify', target: 'route', type: 'smoothstep' as const },
      { id: 'e3', source: 'route', target: 'tech', type: 'smoothstep' as const, sourceHandle: 'true' }, { id: 'e4', source: 'route', target: 'billing', type: 'smoothstep' as const, sourceHandle: 'false' },
      { id: 'e5', source: 'tech', target: 'end1', type: 'smoothstep' as const }, { id: 'e6', source: 'billing', target: 'end2', type: 'smoothstep' as const },
    ],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isTemplate: true,
  },
  dataPipeline: {
    id: 'template-data-pipeline', name: 'Data Pipeline with Validation', description: 'Fetch, transform, validate, then analyze or handle errors.', category: 'Data', tags: ['data', 'pipeline', 'validation'], difficulty: 'Intermediate', estimatedTime: '10-20 minutes',
    nodes: [
      { id: 'start', type: 'custom' as const, position: { x: 350, y: 60 }, data: { label: 'Start', nodeType: 'start' as const, config: { inputVariables: [] } } },
      { id: 'fetch', type: 'custom' as const, position: { x: 350, y: 200 }, data: { label: 'Data Fetch', nodeType: 'agent' as const, config: { prompt: 'Fetch the requested dataset and return as JSON.', model: 'gpt-4', temperature: 0.1, maxTokens: 2000 } } },
      { id: 'transform', type: 'custom' as const, position: { x: 350, y: 360 }, data: { label: 'Transform', nodeType: 'transform' as const, config: { code: 'return { records: input.data, count: (input.data || []).length }' } } },
      { id: 'validate', type: 'custom' as const, position: { x: 350, y: 520 }, data: { label: 'Validate', nodeType: 'if-else' as const, config: { condition: 'output.count > 0' } } },
      { id: 'analyze', type: 'custom' as const, position: { x: 150, y: 680 }, data: { label: 'Analyze', nodeType: 'agent' as const, config: { prompt: 'Produce analytical summary with key insights.', model: 'gpt-4', temperature: 0.4, maxTokens: 1600 } } },
      { id: 'errh', type: 'custom' as const, position: { x: 560, y: 680 }, data: { label: 'Error Handler', nodeType: 'agent' as const, config: { prompt: 'Explain what went wrong with the data and suggest fixes.', model: 'gpt-4', temperature: 0.3, maxTokens: 800 } } },
      { id: 'end1', type: 'custom' as const, position: { x: 150, y: 840 }, data: { label: 'End', nodeType: 'end' as const, config: { outputVariable: 'result' } } },
      { id: 'end2', type: 'custom' as const, position: { x: 560, y: 840 }, data: { label: 'End', nodeType: 'end' as const, config: { outputVariable: 'errorReport' } } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'fetch', type: 'smoothstep' as const }, { id: 'e2', source: 'fetch', target: 'transform', type: 'smoothstep' as const }, { id: 'e3', source: 'transform', target: 'validate', type: 'smoothstep' as const },
      { id: 'e4', source: 'validate', target: 'analyze', type: 'smoothstep' as const, sourceHandle: 'true' }, { id: 'e5', source: 'validate', target: 'errh', type: 'smoothstep' as const, sourceHandle: 'false' },
      { id: 'e6', source: 'analyze', target: 'end1', type: 'smoothstep' as const }, { id: 'e7', source: 'errh', target: 'end2', type: 'smoothstep' as const },
    ],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isTemplate: true,
  },
};

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`builder-tabpanel-${index}`}
      aria-labelledby={`builder-tab-${index}`}
      {...other}
      style={{ height: value === index ? 'calc(100vh - 200px)' : 'auto' }}
    >
      {value === index && (
        <Box sx={{ p: 0, height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function BuilderStudio() {
  const [currentTab, setCurrentTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showAgentWizard, setShowAgentWizard] = useState(false);
  const [agentInitialData, setAgentInitialData] = useState<Partial<Agent> | undefined>(undefined);
  const [agentSkipDraftRestore, setAgentSkipDraftRestore] = useState(false);
  const [agentStartStep, setAgentStartStep] = useState<number | undefined>(undefined);
  const [initialWorkflow, setInitialWorkflow] = useState<BuilderWorkflow | undefined>(undefined);

   const { user } = useAuth();
   const userId = user?.id;
   const userIdKey = userId === undefined || userId === null ? '' : String(userId);

   const [myAgents, setMyAgents] = useState<Agent[]>([]);
   const [myAgentsLoading, setMyAgentsLoading] = useState(false);

   const [skillManagementOpen, setSkillManagementOpen] = useState(false);
   const [skillManagementAgent, setSkillManagementAgent] = useState<Agent | null>(null);
   const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
   const [installedSkills, setInstalledSkills] = useState<AgentSkill[]>([]);
   const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
   const [skillsLoading, setSkillsLoading] = useState(false);
   const [savingSkills, setSavingSkills] = useState(false);

   const [myWorkflows, setMyWorkflows] = useState<BuilderWorkflow[]>([]);
   const [myWorkflowsLoading, setMyWorkflowsLoading] = useState(false);
   const [workflowMetricsById, setWorkflowMetricsById] = useState<Record<string, WorkflowDiscoveryMetrics>>({});
   const [workflowMetricsLoading, setWorkflowMetricsLoading] = useState(false);

   const [myContentLoaded, setMyContentLoaded] = useState(false);

   const [agentDrafts, setAgentDrafts] = useState<{ storageKey: string; savedAt: number; title: string; raw: string }[]>([]);

   const [runAgentModal, setRunAgentModal] = useState<{ agent: Agent; open: boolean } | null>(null);
   const [runAgentObjective, setRunAgentObjective] = useState('');
   const [runAgentLoading, setRunAgentLoading] = useState(false);

   const [workflowDrafts, setWorkflowDrafts] = useState<{ storageKey: string; savedAt: number; title: string; raw: string; workflow: BuilderWorkflow }[]>([]);

   const agentsCacheKey = useMemo(() => `builder_my_agents_cache_v1_${userIdKey ? userIdKey : 'anon'}`,
     [userIdKey]
   );

   const loadAgentsFromCache = useCallback(() => {
     try {
       const raw = localStorage.getItem(agentsCacheKey);
       if (!raw) return;
       const parsed = JSON.parse(raw);
       const cachedAgents = Array.isArray(parsed?.agents) ? parsed.agents : [];
       if (Array.isArray(cachedAgents)) {
         setMyAgents(cachedAgents);
       }
     } catch {}
   }, [agentsCacheKey]);

   const refreshMyAgents = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setMyAgentsLoading(true);
    try {
      const resp = await agentService.getAgents();
      const agents = Array.isArray(resp?.data) ? resp.data : [];
      const uid = userIdKey;
      let owned: any[] = [];
      if (uid) {
        const matched = agents.filter((a: any) => {
          const oid = (a as any)?.owner_id ?? (a as any)?.ownerId ?? (a as any)?.ownerID;
          if (oid === undefined || oid === null) return false;
          return String(oid) === uid;
        });
        owned = matched;
      }
      if (owned.length > 0) {
        setMyAgents(owned as any);
      } else {
        setMyAgents(agents as any);
      }
      try {
        if (owned.length === 0) {
          localStorage.removeItem(agentsCacheKey);
        } else {
          localStorage.setItem(agentsCacheKey, JSON.stringify({ v: 1, savedAt: Date.now(), agents: owned }));
        }
      } catch {}
    } catch {
    } finally {
      if (!opts?.silent) setMyAgentsLoading(false);
    }
  }, [agentsCacheKey, userIdKey]);

  useEffect(() => {
    let wid: string | null = null;
    try {
      wid = sessionStorage.getItem('builder_open_workflow_id');
    } catch {}
    if (!wid) return;
    try { sessionStorage.removeItem('builder_open_workflow_id'); } catch {}
    setCurrentTab(1);
    const loadWorkflow = async () => {
      try {
        const res = await fetch(apiUrl(`/api/workflows/${wid}`), { headers: getAuthHeaders() });
        if (res.ok) {
          const wf = await res.json();
          setInitialWorkflow(wf as any);
        }
      } catch {}
    };
    loadWorkflow();
  }, []);

  const refreshMyWorkflows = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setMyWorkflowsLoading(true);
    try {
      const res = await fetch(apiUrl('/api/workflows/'), { headers: getAuthHeaders() });
      const data = res && (res as any).ok ? await (res as any).json() : null;
      const list = Array.isArray((data as any)?.workflows) ? ((data as any).workflows as BuilderWorkflow[]) : [];
      const uid = userIdKey;
      const visible = list.filter((wf: any) => {
        if (!wf) return false;
        if ((wf as any).isTemplate) return false;
        if (!uid) return true;
        const wid = (wf as any)?.userId ?? (wf as any)?.user_id ?? (wf as any)?.userID;
        return String(wid) === uid;
      });
      setMyWorkflows(visible as any);
    } catch {
    } finally {
      if (!opts?.silent) setMyWorkflowsLoading(false);
    }
  }, [userIdKey]);

  const buildWorkflowDiscoverySummary = useCallback((workflow: BuilderWorkflow): WorkflowDiscoverySummary => {
    const nodes = Array.isArray((workflow as any)?.nodes) ? (workflow as any).nodes : [];
    let externalActionCount = 0;
    let estimatedTokenBudget = 0;
    let approvalByDefault = true;
    let strictPolicy = false;
    let permissivePolicy = false;
    const requiredCredentials = new Set<string>();

    nodes.forEach((node: any) => {
      const nodeType = String(node?.data?.nodeType || node?.type || '');
      const cfg = (node?.data?.config || {}) as any;

      if (nodeType === 'agent') {
        const rawTokenBudget = Number(cfg.maxTokens ?? cfg.max_tokens);
        estimatedTokenBudget += Number.isFinite(rawTokenBudget) && rawTokenBudget > 0 ? rawTokenBudget : 1200;
      }

      if (nodeType === 'integration' || nodeType === 'mcp-tool' || nodeType === 'mcp' || nodeType === 'file-search') {
        externalActionCount += 1;

        if (cfg.approvalRequired === false) {
          approvalByDefault = false;
        }

        const policyMode = String(cfg.policyMode || cfg.policy_mode || '').toLowerCase();
        if (policyMode === 'strict' || policyMode === 'enforce') strictPolicy = true;
        if (policyMode === 'permissive' || policyMode === 'off') permissivePolicy = true;

        if (nodeType === 'integration') {
          const integrationName = String(cfg.integration || '').trim();
          if (integrationName) requiredCredentials.add(integrationName);
          const credentials = cfg.credentials;
          if (credentials && typeof credentials === 'object' && !Array.isArray(credentials)) {
            Object.keys(credentials).forEach((key) => {
              if (!key) return;
              requiredCredentials.add(integrationName ? `${integrationName}:${key}` : key);
            });
          }
        } else if (nodeType === 'mcp-tool' || nodeType === 'mcp') {
          const connector = String(cfg.mcpServer || '').trim();
          if (connector) requiredCredentials.add(`mcp:${connector}`);
        } else if (nodeType === 'file-search') {
          requiredCredentials.add('knowledge_base');
        }
      }
    });

    let policyProfile = 'standard';
    if (externalActionCount > 0) {
      if (strictPolicy) policyProfile = 'strict';
      else if (permissivePolicy) policyProfile = 'permissive';
      else policyProfile = approvalByDefault ? 'approval-default' : 'mixed-approval';
    }

    const estimatedCostUsd = Number(((estimatedTokenBudget / 1000) * 0.002 + externalActionCount * 0.0015).toFixed(4));

    return {
      requiredCredentials: Array.from(requiredCredentials),
      policyProfile,
      estimatedCostUsd,
      externalActionCount,
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const refreshWorkflowMetrics = async () => {
      if (myWorkflows.length === 0) {
        setWorkflowMetricsById({});
        setWorkflowMetricsLoading(false);
        return;
      }

      setWorkflowMetricsLoading(true);

      const entries = await Promise.all(
        myWorkflows.map(async (workflow) => {
          const workflowId = String((workflow as any)?.id || '');
          if (!workflowId) return null;

          const summary = buildWorkflowDiscoverySummary(workflow);
          let executions: any[] = [];

          try {
            const response = await fetch(apiUrl(`/api/workflows/${workflowId}/executions?limit=20`), { headers: getAuthHeaders() });
            if (response.ok) {
              const payload = await response.json();
              const raw = (payload as any)?.executions;
              executions = Array.isArray(raw) ? raw : [];
            }
          } catch {}

          const sortedExecutions = executions
            .slice()
            .sort((a: any, b: any) => {
              const aStarted = Date.parse(String(a?.startedAt || ''));
              const bStarted = Date.parse(String(b?.startedAt || ''));
              const safeA = Number.isFinite(aStarted) ? aStarted : 0;
              const safeB = Number.isFinite(bStarted) ? bStarted : 0;
              return safeB - safeA;
            });

          const totalRuns = sortedExecutions.length;
          const completedRuns = sortedExecutions.filter(
            (run: any) => String(run?.status || '').toLowerCase() === 'completed'
          ).length;

          const successRate =
            totalRuns > 0 ? Number(((completedRuns / totalRuns) * 100).toFixed(1)) : null;

          const durations = sortedExecutions
            .map((run: any) => {
              const started = Date.parse(String(run?.startedAt || ''));
              const completed = Date.parse(String(run?.completedAt || ''));
              if (!Number.isFinite(started) || !Number.isFinite(completed) || completed < started) return null;
              return completed - started;
            })
            .filter((value: any) => typeof value === 'number') as number[];

          const avgLatencyMs =
            durations.length > 0
              ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
              : null;

          const lastStatus =
            totalRuns > 0 ? String((sortedExecutions[0] as any)?.status || 'unknown').toLowerCase() : null;

          const metrics: WorkflowDiscoveryMetrics = {
            ...summary,
            totalRuns,
            successRate,
            avgLatencyMs,
            lastStatus,
          };

          return [workflowId, metrics] as const;
        })
      );

      if (cancelled) return;

      const next: Record<string, WorkflowDiscoveryMetrics> = {};
      entries.forEach((entry) => {
        if (!entry) return;
        next[entry[0]] = entry[1];
      });
      setWorkflowMetricsById(next);
      setWorkflowMetricsLoading(false);
    };

    refreshWorkflowMetrics().finally(() => {
      if (!cancelled) setWorkflowMetricsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [buildWorkflowDiscoverySummary, myWorkflows]);

  const loadSkillsForAgent = useCallback(async (agent: Agent) => {
    setSkillsLoading(true);
    try {
      const [libraryRes, installedRes] = await Promise.all([
        skillService.listSkills(true),
        agentSkillsService.getSkills(false)
      ]);
      const libraryData = (libraryRes as any)?.data;
      setAvailableSkills(Array.isArray(libraryData) ? libraryData : []);
      setInstalledSkills(Array.isArray(installedRes) ? installedRes : []);
      const agentSkillIds = (agent as any)?.skill_ids || (agent as any)?.skillIds || [];
      setSelectedSkillIds(Array.isArray(agentSkillIds) ? agentSkillIds.map((x: any) => String(x)) : []);
    } catch (e) {
      setAvailableSkills([]);
      setInstalledSkills([]);
      setSelectedSkillIds([]);
    } finally {
      setSkillsLoading(false);
    }
  }, []);

  const openSkillManagement = useCallback((agent: Agent) => {
    setSkillManagementAgent(agent);
    setSkillManagementOpen(true);
    loadSkillsForAgent(agent);
  }, [loadSkillsForAgent]);

  const closeSkillManagement = useCallback(() => {
    setSkillManagementOpen(false);
    setSkillManagementAgent(null);
    setSelectedSkillIds([]);
  }, []);

  const toggleSkillSelection = useCallback((skillId: string) => {
    setSelectedSkillIds(prev => {
      if (prev.includes(skillId)) {
        return prev.filter(id => id !== skillId);
      }
      return [...prev, skillId];
    });
  }, []);

  const saveAgentSkills = useCallback(async () => {
    if (!skillManagementAgent) return;
    setSavingSkills(true);
    try {
      const updatedAgent = {
        ...skillManagementAgent,
        skill_ids: selectedSkillIds
      };
      await agentService.updateAgent(String(skillManagementAgent.id), updatedAgent);
      toast.success('Skills updated successfully');
      closeSkillManagement();
      refreshMyAgents({ silent: true });
    } catch (e) {
      toast.error('Failed to update skills');
    } finally {
      setSavingSkills(false);
    }
  }, [skillManagementAgent, selectedSkillIds, closeSkillManagement, refreshMyAgents]);

  const snapshotCurrentDraft = useCallback(() => {
    const userPart = userIdKey ? userIdKey : 'anon';
    const now = Date.now();
    try {
      const rawCurrent = localStorage.getItem('agent_creation_wizard_draft_v1');
      if (rawCurrent) {
        localStorage.setItem(`agent_creation_wizard_draft_v1_${userPart}_current`, rawCurrent);
      }
    } catch {}
    try {
      const raw = localStorage.getItem('agent_creation_wizard_draft_v1');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const savedAt = typeof parsed?.savedAt === 'number' ? parsed.savedAt : 0;
      const currentStep = typeof parsed?.currentStep === 'number' ? parsed.currentStep : 1;
      const formData = parsed?.formData || {};
      const selectedKnowledgeIds = Array.isArray(parsed?.selectedKnowledgeIds) ? parsed.selectedKnowledgeIds : [];
      const selectedSkillIds = Array.isArray(parsed?.selectedSkillIds) ? parsed.selectedSkillIds : [];
      const actions = Array.isArray(formData?.actions) ? formData.actions : [];
      const name = typeof formData?.name === 'string' ? formData.name : '';
      const description = typeof formData?.description === 'string' ? formData.description : '';
      const hasMeaningful =
        currentStep > 1 ||
        Boolean(name && name.trim()) ||
        Boolean(description && description.trim()) ||
        selectedKnowledgeIds.length > 0 ||
        selectedSkillIds.length > 0 ||
        actions.length > 0;
      if (!hasMeaningful) return;
      const title = name && name.trim() ? name : 'Untitled Draft';
      const slug = title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 48);
      const storageKey = `agent_creation_wizard_draft_v1_${userPart}_${slug || 'untitled'}`;
      const payload = typeof parsed === 'object' && parsed ? { ...parsed, savedAt: now, user_id: typeof userId === 'number' ? userId : undefined } : parsed;
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {}
  }, [userId, userIdKey]);

   const loadDraftsFromStorage = useCallback(() => {
    const results: { storageKey: string; savedAt: number; title: string; raw: string }[] = [];
    try {
      const userPart = userIdKey ? userIdKey : 'anon';
      const scopedPrefix = `agent_creation_wizard_draft_v1_${userPart}_`;
      const keys: string[] = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k) continue;
          if (k.startsWith(scopedPrefix)) {
            keys.push(k);
          }
        }
      } catch {}

      try {
        const k = 'agent_creation_wizard_draft_v1';
        if (!keys.includes(k)) {
          const raw = localStorage.getItem(k);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              const savedAt = typeof parsed?.savedAt === 'number' ? parsed.savedAt : 0;
              const currentStep = typeof parsed?.currentStep === 'number' ? parsed.currentStep : 1;
              const formData = parsed?.formData || {};
              const selectedKnowledgeIds = Array.isArray(parsed?.selectedKnowledgeIds) ? parsed.selectedKnowledgeIds : [];
              const selectedSkillIds = Array.isArray(parsed?.selectedSkillIds) ? parsed.selectedSkillIds : [];
              const actions = Array.isArray(formData?.actions) ? formData.actions : [];
              const name = typeof formData?.name === 'string' ? formData.name : '';
              const description = typeof formData?.description === 'string' ? formData.description : '';
              const hasMeaningful =
                currentStep > 1 ||
                Boolean(name && name.trim()) ||
                Boolean(description && description.trim()) ||
                selectedKnowledgeIds.length > 0 ||
                selectedSkillIds.length > 0 ||
                actions.length > 0;
              if (savedAt && hasMeaningful) keys.push(k);
            } catch {}
          }
        }
      } catch {}

      const now = Date.now();
      const maxAgeMs = 1000 * 60 * 60 * 24 * 7;
      for (const k of keys) {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
          const savedAt = typeof parsed?.savedAt === 'number' ? parsed.savedAt : 0;
          if (!savedAt || (now - savedAt) > maxAgeMs) continue;
          const currentStep = typeof parsed?.currentStep === 'number' ? parsed.currentStep : 1;
          const formData = parsed?.formData || {};
          const selectedKnowledgeIds = Array.isArray(parsed?.selectedKnowledgeIds) ? parsed.selectedKnowledgeIds : [];
          const selectedSkillIds = Array.isArray(parsed?.selectedSkillIds) ? parsed.selectedSkillIds : [];
          const actions = Array.isArray(formData?.actions) ? formData.actions : [];
          const name = typeof formData?.name === 'string' ? formData.name : '';
          const description = typeof formData?.description === 'string' ? formData.description : '';
          const hasMeaningful =
            currentStep > 1 ||
            Boolean(name && name.trim()) ||
            Boolean(description && description.trim()) ||
            selectedKnowledgeIds.length > 0 ||
            selectedSkillIds.length > 0 ||
            actions.length > 0;
          if (!hasMeaningful && !String(k).endsWith('_current')) continue;
          const title = name && name.trim() ? name : 'Untitled Draft';
          results.push({ storageKey: k, savedAt, title, raw });
        } catch {}
      }
    } catch {}
    const byTitle = new Map<string, { storageKey: string; savedAt: number; title: string; raw: string }>();
    for (const r of results) {
      const t = (r.title || '').trim().toLowerCase();
      const k = t ? t : r.storageKey;
      const existing = byTitle.get(k);
      if (!existing || r.savedAt > existing.savedAt) byTitle.set(k, r);
    }
    const next = Array.from(byTitle.values());
    next.sort((a, b) => b.savedAt - a.savedAt);
    setAgentDrafts(next);
  }, [userIdKey]);

  const loadWorkflowDraftsFromStorage = useCallback(() => {
    const results: { storageKey: string; savedAt: number; title: string; raw: string; workflow: BuilderWorkflow }[] = [];
    try {
      const userPart = userIdKey ? userIdKey : 'anon';
      const scopedPrefix = `workflow_builder_draft_v1_${userPart}_`;
      const keys: string[] = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k) continue;
          if (k.startsWith(scopedPrefix)) {
            keys.push(k);
          }
        }
      } catch {}

      if (keys.length === 0) {
        try {
          const k = 'workflow_builder_draft_v1';
          const raw = localStorage.getItem(k);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              const savedAt = typeof parsed?.savedAt === 'number' ? parsed.savedAt : 0;
              const workflow = parsed?.workflow;
              const title = typeof parsed?.title === 'string' ? parsed.title : '';
              const hasMeaningful =
                Boolean(title && title.trim() && title.trim() !== 'Untitled Workflow') ||
                (Array.isArray(workflow?.nodes) && workflow.nodes.length > 0) ||
                (Array.isArray(workflow?.edges) && workflow.edges.length > 0);
              if (savedAt && hasMeaningful) keys.push(k);
            } catch {}
          }
        } catch {}
      }

      const now = Date.now();
      const maxAgeMs = 1000 * 60 * 60 * 24 * 7;
      for (const k of keys) {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
          const savedAt = typeof parsed?.savedAt === 'number' ? parsed.savedAt : 0;
          if (!savedAt || (now - savedAt) > maxAgeMs) continue;
          const workflow = parsed?.workflow;
          if (!workflow) continue;
          const wfId = (workflow as any)?.id;
          if (wfId !== undefined && wfId !== null && String(wfId).trim()) continue;
          const title = typeof parsed?.title === 'string' && parsed.title.trim() ? parsed.title : (workflow as any)?.name || 'Untitled Workflow';
          const hasMeaningful =
            Boolean(title && title.trim() && title.trim() !== 'Untitled Workflow') ||
            (Array.isArray((workflow as any)?.nodes) && (workflow as any).nodes.length > 0) ||
            (Array.isArray((workflow as any)?.edges) && (workflow as any).edges.length > 0);
          if (!hasMeaningful && !String(k).endsWith('_current')) continue;
          results.push({ storageKey: k, savedAt, title, raw, workflow });
        } catch {}
      }
    } catch {}
    results.sort((a, b) => b.savedAt - a.savedAt);
    setWorkflowDrafts(results);
  }, [userIdKey]);

  const ensureAgentDraftInitialized = useCallback((seed?: Partial<Agent>) => {
    const userPart = userIdKey ? userIdKey : 'anon';
    const scopedKey = `agent_creation_wizard_draft_v1_${userPart}_current`;
    try {
      const rawExisting = localStorage.getItem('agent_creation_wizard_draft_v1');
      if (rawExisting) {
        try {
          const parsed = JSON.parse(rawExisting);
          const savedAt = typeof parsed?.savedAt === 'number' ? parsed.savedAt : 0;
          const currentStep = typeof parsed?.currentStep === 'number' ? parsed.currentStep : 1;
          const formData = parsed?.formData || {};
          const selectedKnowledgeIds = Array.isArray(parsed?.selectedKnowledgeIds) ? parsed.selectedKnowledgeIds : [];
          const selectedSkillIds = Array.isArray(parsed?.selectedSkillIds) ? parsed.selectedSkillIds : [];
          const actions = Array.isArray(formData?.actions) ? formData.actions : [];
          const name = typeof formData?.name === 'string' ? formData.name : '';
          const description = typeof formData?.description === 'string' ? formData.description : '';
          const hasMeaningful =
            currentStep > 1 ||
            Boolean(name && name.trim()) ||
            Boolean(description && description.trim()) ||
            selectedKnowledgeIds.length > 0 ||
            selectedSkillIds.length > 0 ||
            actions.length > 0;
          const fresh = savedAt && (Date.now() - savedAt) < (1000 * 60 * 60 * 24 * 7);
          if (hasMeaningful && fresh) {
            const payload = typeof parsed === 'object' && parsed ? { ...parsed, savedAt: Date.now() } : parsed;
            const serialized = JSON.stringify(payload);
            try { localStorage.setItem('agent_creation_wizard_draft_v1', serialized); } catch {}
            try { localStorage.setItem(scopedKey, serialized); } catch {}
            try { localStorage.setItem('agent_creation_wizard_active_draft_key', scopedKey); } catch {}
            loadDraftsFromStorage();
            return;
          }
        } catch {}
      }
    } catch {}

    const payload = {
      v: 1,
      savedAt: Date.now(),
      currentStep: 1,
      formData: (seed && typeof seed === 'object')
        ? seed
        : {
            actions: [],
            ai_role: AgentRole.WEB_SCRAPING,
            language: 'en',
            mode: AgentMode.TEXT,
            response_style: 0.5,
            response_length: 150
          },
      selectedKnowledgeIds: [],
      selectedSkillIds: [],
      customRole: false,
      agentSearchQuery: '',
      selectedCategory: 'all',
      difficultyFilter: 'all',
      activeParameterTab: 'intelligence',
      selectedTemplate: null,
      advancedSettings: {
        frequency_penalty: 0,
        presence_penalty: 0,
        top_k: 40,
        stop_sequences: [],
        response_format: 'text'
      }
    };
    try { localStorage.setItem('agent_creation_wizard_draft_v1', JSON.stringify(payload)); } catch {}
    try { localStorage.setItem(scopedKey, JSON.stringify(payload)); } catch {}
    try { localStorage.setItem('agent_creation_wizard_active_draft_key', scopedKey); } catch {}
    loadDraftsFromStorage();
  }, [loadDraftsFromStorage, userIdKey]);

  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem('agent_creation_wizard_resume_from_knowledge_v1');
    } catch {}
    if (!raw) return;

    let step = 4;
    let fresh = true;
    try {
      const parsed = JSON.parse(raw);
      const savedAt = typeof parsed?.savedAt === 'number' ? parsed.savedAt : 0;
      fresh = !savedAt || (Date.now() - savedAt) < (1000 * 60 * 60 * 24);
      const candidate = typeof parsed?.step === 'number' ? parsed.step : Number(parsed?.step);
      if (Number.isFinite(candidate) && candidate > 0) {
        step = Math.min(Math.max(1, Math.round(candidate)), 6);
      }
    } catch {}

    try { sessionStorage.removeItem('agent_creation_wizard_resume_from_knowledge_v1'); } catch {}
    if (!fresh) return;

    ensureAgentDraftInitialized();
    setCurrentTab(0);
    setAgentInitialData(undefined);
    setAgentSkipDraftRestore(false);
    setAgentStartStep(step);
    setShowAgentWizard(true);
  }, [ensureAgentDraftInitialized]);

   const openAgentWizardForExistingAgent = useCallback((agent: Agent) => {
     const workflowId = (agent as any)?.workflow_id;
     if (workflowId) {
       try {
         sessionStorage.setItem('builder_open_workflow_id', workflowId);
       } catch {}
       setCurrentTab(1);
       const loadWorkflow = async () => {
         try {
           const res = await fetch(apiUrl(`/api/workflows/${workflowId}`), { headers: getAuthHeaders() });
           if (res.ok) {
             const wf = await res.json();
             setInitialWorkflow(wf as any);
           }
         } catch {}
       };
       loadWorkflow();
     } else {
       setAgentInitialData(agent as any);
       setAgentSkipDraftRestore(true);
       setAgentStartStep(1);
       setShowAgentWizard(true);
     }
   }, []);

const openAgentWizardFromDraft = useCallback((draft: { storageKey: string; raw: string }) => {
let step: number | undefined = undefined;
try {
  const parsed = JSON.parse(draft.raw);
  const sRaw = (parsed as any)?.currentStep;
  const s = typeof sRaw === 'number' ? sRaw : Number(sRaw);
  if (Number.isFinite(s) && s > 0) step = s;
  const payload = typeof parsed === 'object' && parsed ? { ...parsed, savedAt: Date.now(), currentStep: Number.isFinite(s) && s > 0 ? s : (parsed as any)?.currentStep } : parsed;
  try { localStorage.setItem('agent_creation_wizard_draft_v1', JSON.stringify(payload)); } catch {}
  try {
    const userPart = userIdKey ? userIdKey : 'anon';
    localStorage.setItem(`agent_creation_wizard_draft_v1_${userPart}_current`, JSON.stringify(payload));
  } catch {}
  try { localStorage.setItem('agent_creation_wizard_active_draft_key', draft.storageKey); } catch {}
} catch {
  try {
    if (draft.storageKey !== 'agent_creation_wizard_draft_v1') {
      localStorage.setItem('agent_creation_wizard_draft_v1', draft.raw);
    }
  } catch {}
}
setAgentInitialData(undefined);
setAgentSkipDraftRestore(false);
setAgentStartStep(step);
setShowAgentWizard(true);
}, [userIdKey]);

const openWorkflowFromDraft = useCallback((draft: { storageKey: string; raw: string; workflow: BuilderWorkflow }) => {
try {
  const userPart = userIdKey ? userIdKey : 'anon';
  localStorage.setItem('workflow_builder_draft_v1', draft.raw);
  localStorage.setItem(`workflow_builder_draft_v1_${userPart}_current`, draft.raw);
} catch {}
setInitialWorkflow(draft.workflow);
setCurrentTab(1);
}, [userIdKey]);

useEffect(() => {
setMyContentLoaded(false);
const run = async () => {
  try {
    await Promise.all([
      refreshMyAgents({ silent: true }),
      refreshMyWorkflows({ silent: true })
    ]);
  } finally {
    setMyContentLoaded(true);
  }
};
run();
}, [refreshMyAgents, refreshMyWorkflows, userIdKey]);

useEffect(() => {
if (!showAgentWizard) {
  loadDraftsFromStorage();
  loadWorkflowDraftsFromStorage();
}
}, [loadDraftsFromStorage, loadWorkflowDraftsFromStorage, showAgentWizard]);

useEffect(() => {
if (currentTab === 0) {
  loadDraftsFromStorage();
  loadWorkflowDraftsFromStorage();
}
}, [currentTab, loadDraftsFromStorage, loadWorkflowDraftsFromStorage]);

useEffect(() => {
const handler = () => {
  const run = () => {
    refreshMyAgents({ silent: true });
    refreshMyWorkflows({ silent: true });
    loadDraftsFromStorage();
    loadWorkflowDraftsFromStorage();
  };
  try {
    window.setTimeout(run, 400);
  } catch {
    run();
  }
};
try {
  window.addEventListener('builder:workflow-saved', handler as any);
  window.addEventListener('builder:agent-saved', handler as any);
} catch {}
return () => {
  try {
    window.removeEventListener('builder:workflow-saved', handler as any);
    window.removeEventListener('builder:agent-saved', handler as any);
  } catch {}
};
}, [loadDraftsFromStorage, loadWorkflowDraftsFromStorage, refreshMyAgents, refreshMyWorkflows]);

useEffect(() => {
  const timer = setTimeout(() => setIsLoading(false), 300);
  return () => clearTimeout(timer);
}, []);

const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
setCurrentTab(newValue);
};

const openAgentWizardWithTemplate = (
templateKey:
  | 'sales'
  | 'support'
  | 'research'
  | 'code'
  | 'lead_qualifier'
  | 'ticket_triage'
  | 'kb_curator'
  | 'email_triage'
  | 'meeting_notes'
  | 'doc_qa'
  | 'data_analyst'
  | 'code_reviewer'
) => {
setAgentSkipDraftRestore(true);
setAgentStartStep(1);
if (templateKey === 'sales') {
  setAgentInitialData({
    name: 'Sales Agent',
    description: 'Automate lead qualification, follow-ups, and pipeline nurturing.',
    ai_role: AgentRole.EMAIL_AUTOMATION,
    language: 'en',
    mode: AgentMode.TEXT,
    response_style: 0.7,
    response_length: 220,
    actions: [SEND_MAIL, SEARCH_INTERNET, EXECUTE_CODE],
    config: {
      language: 'en',
      mode: AgentMode.TEXT,
      response_style: 0.7,
      response_length: 220,
      model: 'gpt-4',
      temperature: 0.7,
      max_tokens: 1500,
      actions: [SEND_MAIL, SEARCH_INTERNET, EXECUTE_CODE]
    }
  });
} else if (templateKey === 'support') {
  setAgentInitialData({
    name: 'Support Agent',
    description: 'Handle customer questions, troubleshooting, and FAQs 24/7.',
    ai_role: AgentRole.TASK_AUTOMATION,
    language: 'en',
    mode: AgentMode.TEXT,
    response_style: 0.4,
    response_length: 180,
    actions: [SEARCH_INTERNET, EXECUTE_CODE],
    config: {
      language: 'en',
      mode: AgentMode.TEXT,
      response_style: 0.4,
      response_length: 180,
      model: 'gpt-4',
      temperature: 0.4,
      max_tokens: 1200,
      actions: [SEARCH_INTERNET, EXECUTE_CODE]
    }
  });
} else if (templateKey === 'research') {
  setAgentInitialData({
    name: 'Research Agent',
    description: 'Gather and synthesize market or product research across many sources.',
    ai_role: AgentRole.DEEP_RESEARCH,
    language: 'en',
    mode: AgentMode.TEXT,
    response_style: 0.3,
    response_length: 260,
    actions: [SEARCH_INTERNET, EXECUTE_CODE],
    config: {
      language: 'en',
      mode: AgentMode.TEXT,
      response_style: 0.3,
      response_length: 260,
      model: 'gpt-4',
      temperature: 0.6,
      max_tokens: 2000,
      actions: [SEARCH_INTERNET, EXECUTE_CODE]
    }
  });
} else if (templateKey === 'code') {
  setAgentInitialData({
    name: 'QA Automated Tester',
    description: 'Automate end-to-end UI and API testing with CI-ready workflows and actionable reporting.',
    ai_role: AgentRole.TESTING_QA,
    language: 'en',
    mode: AgentMode.TEXT,
    response_style: 0.5,
    response_length: 200,
    actions: [EXECUTE_CODE, SEARCH_INTERNET],
    config: {
      language: 'en',
      mode: AgentMode.TEXT,
      response_style: 0.5,
      response_length: 200,
      model: 'gpt-4',
      temperature: 0.3,
      max_tokens: 1600,
      actions: [EXECUTE_CODE, SEARCH_INTERNET]
    }
  });
} else if (templateKey === 'lead_qualifier') {
  setAgentInitialData({
    name: 'Lead Qualification Agent',
    description: 'Score and prioritize inbound leads for your sales team.',
    ai_role: AgentRole.SALES_LEAD_QUALIFIER,
    language: 'en',
    mode: AgentMode.TEXT,
    response_style: 0.6,
    response_length: 220,
    actions: [SEARCH_INTERNET, EXECUTE_CODE, SEND_MAIL],
    config: {
      language: 'en',
      mode: AgentMode.TEXT,
      response_style: 0.6,
      response_length: 220,
      model: 'gpt-4',
      temperature: 0.6,
      max_tokens: 1600,
      actions: [SEARCH_INTERNET, EXECUTE_CODE, SEND_MAIL]
    }
  });
} else if (templateKey === 'ticket_triage') {
  setAgentInitialData({
    name: 'Ticket Triage Agent',
    description: 'Classify, prioritize, and route incoming support tickets.',
    ai_role: AgentRole.SUPPORT_TICKET_TRIAGE,
    language: 'en',
    mode: AgentMode.TEXT,
    response_style: 0.3,
    response_length: 180,
    actions: [SEARCH_INTERNET, EXECUTE_CODE],
    config: {
      language: 'en',
      mode: AgentMode.TEXT,
      response_style: 0.3,
      response_length: 180,
      model: 'gpt-4',
      temperature: 0.4,
      max_tokens: 1400,
      actions: [SEARCH_INTERNET, EXECUTE_CODE]
    }
  });
} else if (templateKey === 'kb_curator') {
  setAgentInitialData({
    name: 'Knowledge Base Curator',
    description: 'Turn solved issues into polished help center articles.',
    ai_role: AgentRole.DOCUMENT_PROCESSING,
    language: 'en',
    mode: AgentMode.TEXT,
    response_style: 0.5,
    response_length: 220,
    actions: [SEARCH_INTERNET, EXECUTE_CODE],
    config: {
      language: 'en',
      mode: AgentMode.TEXT,
      response_style: 0.5,
      response_length: 220,
      model: 'gpt-4',
      temperature: 0.5,
      max_tokens: 2000,
      actions: [SEARCH_INTERNET, EXECUTE_CODE]
    }
  });
} else if (templateKey === 'email_triage') {
  setAgentInitialData({
    name: 'Email Triage Agent',
    description: 'Sort, summarize, and draft replies for your inbox.',
    ai_role: AgentRole.EMAIL_AUTOMATION,
    language: 'en',
    mode: AgentMode.TEXT,
    response_style: 0.6,
    response_length: 180,
    actions: [SEND_MAIL, SEARCH_INTERNET, EXECUTE_CODE],
    config: {
      language: 'en',
      mode: AgentMode.TEXT,
      response_style: 0.6,
      response_length: 180,
      model: 'gpt-4',
      temperature: 0.7,
      max_tokens: 1200,
      actions: [SEND_MAIL, SEARCH_INTERNET, EXECUTE_CODE]
    }
  });
} else if (templateKey === 'meeting_notes') {
      setAgentInitialData({
        name: 'Meeting Notes Agent',
        description: 'Summarize meetings into clear notes and action items.',
        ai_role: AgentRole.MEETING_ASSISTANT,
        language: 'en',
        mode: AgentMode.TEXT,
        response_style: 0.4,
        response_length: 260,
        actions: [SEARCH_INTERNET, EXECUTE_CODE],
        config: {
          language: 'en',
          mode: AgentMode.TEXT,
          response_style: 0.4,
          response_length: 260,
          model: 'gpt-4',
          temperature: 0.4,
          max_tokens: 2000,
          actions: [SEARCH_INTERNET, EXECUTE_CODE]
        }
      });
    } else if (templateKey === 'doc_qa') {
      setAgentInitialData({
        name: 'Document Q&A Agent',
        description: 'Answer questions over PDFs, specs, and contracts.',
        ai_role: AgentRole.DOCUMENT_PROCESSING,
        language: 'en',
        mode: AgentMode.TEXT,
        response_style: 0.3,
        response_length: 240,
        actions: [SEARCH_INTERNET, EXECUTE_CODE],
        config: {
          language: 'en',
          mode: AgentMode.TEXT,
          response_style: 0.3,
          response_length: 240,
          model: 'gpt-4',
          temperature: 0.3,
          max_tokens: 2200,
          actions: [SEARCH_INTERNET, EXECUTE_CODE]
        }
      });
    } else if (templateKey === 'data_analyst') {
      setAgentInitialData({
        name: 'Data Analyst Agent',
        description: 'Explore datasets and generate actionable insights.',
        ai_role: AgentRole.DATA_ANALYSIS,
        language: 'en',
        mode: AgentMode.TEXT,
        response_style: 0.5,
        response_length: 260,
        actions: [SEARCH_INTERNET, EXECUTE_CODE],
        config: {
          language: 'en',
          mode: AgentMode.TEXT,
          response_style: 0.5,
          response_length: 260,
          model: 'gpt-4',
          temperature: 0.4,
          max_tokens: 2200,
          actions: [SEARCH_INTERNET, EXECUTE_CODE]
        }
      });
    } else if (templateKey === 'code_reviewer') {
      setAgentInitialData({
        name: 'Code Review Agent',
        description: 'Review code changes and suggest improvements.',
        ai_role: AgentRole.CODE_REVIEWER,
        language: 'en',
        mode: AgentMode.TEXT,
        response_style: 0.4,
        response_length: 220,
        actions: [EXECUTE_CODE, SEARCH_INTERNET],
        config: {
          language: 'en',
          mode: AgentMode.TEXT,
          response_style: 0.4,
          response_length: 220,
          model: 'gpt-4',
          temperature: 0.3,
          max_tokens: 1800,
          actions: [EXECUTE_CODE, SEARCH_INTERNET]
        }
      });
    }
    setShowAgentWizard(true);
  };

  const openWorkflowFromTemplate = (templateKey: WorkflowTemplateKey) => {
    const template = builderWorkflowTemplates[templateKey];
    setInitialWorkflow(template);
    setCurrentTab(1);
  };

  return (
    <Box sx={{ height: '100vh', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', bgcolor: '#0A0A0A' }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-base z-50">
          <div className="w-8 h-8 rounded-full border-2 border-white/15 border-t-brand-cyan animate-spin" />
        </div>
      )}
      <Box sx={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
        <SplineScene
          scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
          className="w-full h-full"
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(10, 10, 10, 0.88) 0%, rgba(10, 10, 10, 0.96) 100%)',
          }}
        />
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />
      </Box>
      <Box sx={{ 
        bgcolor: 'rgba(10, 10, 10, 0.92)', 
        color: 'white', 
        p: { xs: 2, sm: 3 }, 
        borderBottom: '1px solid rgba(42, 42, 42, 0.9)',
        flexShrink: 0,
        position: 'relative',
        zIndex: 1,
        backdropFilter: 'blur(10px)',
        boxShadow: 'none'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ width: 48, height: 48, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 243, 255, 0.14)', border: '1px solid rgba(0, 243, 255, 0.2)' }}>
            <Paintbrush size={26} className="text-white" />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, fontWeight: 700, letterSpacing: '-0.02em' }}>
              Builder Studio
            </Typography>
            <Typography variant="body2" sx={{ color: '#888888', mt: 0.5, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              Create agents, workflows, and automations visually
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'rgba(42, 42, 42, 0.9)', 
        bgcolor: 'rgba(10, 10, 10, 0.94)',
        flexShrink: 0,
        overflowX: 'auto',
        position: 'relative',
        zIndex: 1,
        backdropFilter: 'blur(8px)'
      }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 'auto',
            px: 1,
            '& .MuiTab-root': { 
              color: '#888888',
              textTransform: 'none',
              fontSize: { xs: '0.8rem', sm: '0.95rem' },
              minHeight: { xs: '42px', sm: '48px' },
              px: { xs: 1.5, sm: 2 },
              borderRadius: '999px',
              mx: 0.5
            },
            '& .Mui-selected': { 
              color: '#FFFFFF !important',
              background: 'rgba(0, 243, 255, 0.12)'
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#00F3FF',
              height: 3,
              borderRadius: '999px'
            }
          }}
        >
          <Tab 
            icon={<Bot size={20} />} 
            iconPosition="start" 
            label="Agent Builder" 
          />
          <Tab 
            icon={<Workflow size={20} />} 
            iconPosition="start" 
            label="Workflow Canvas" 
          />
          <Tab
            icon={<Wrench size={20} />}
            iconPosition="start"
            label="Automation Studio"
            sx={{ display: 'none' }}
          />
          <Tab 
            icon={<Library size={20} />} 
            iconPosition="start" 
            label="Template Gallery" 
          />
          <Tab 
            icon={<Puzzle size={20} />} 
            iconPosition="start" 
            label="Skill Library" 
          />
          <Tab
            icon={<Clock size={20} />}
            iconPosition="start"
            label="Scheduler"
            sx={{ display: 'none' }}
          />
        </Tabs>
      </Box>

      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        bgcolor: 'rgba(10, 10, 10, 0.95)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 1
      }}>
        <TabPanel value={currentTab} index={0}>
          <Box sx={{ 
            p: { xs: 2, sm: 3, md: 4 }, 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: '1400px',
            mx: 'auto'
          }}>
            <Typography variant="h5" sx={{ color: 'white', mb: 2, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
              Agent Builder
            </Typography>
            <Typography sx={{ color: '#888', mb: 4, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              Create intelligent agents with custom personalities, knowledge bases, and capabilities
            </Typography>
            <button
              onClick={() => {
                snapshotCurrentDraft();
                ensureAgentDraftInitialized();
                setAgentInitialData(undefined);
                setAgentSkipDraftRestore(false);
                setAgentStartStep(undefined);
                setShowAgentWizard(true);
              }}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all"
            >
              Create New Agent
            </button>

            {(agentDrafts.length > 0 || workflowDrafts.length > 0 || myContentLoaded) && (
              <Box sx={{ mt: 6, width: '100%' }}>
                <Typography variant="h6" sx={{ color: 'white', mb: 1, fontSize: { xs: '1rem', sm: '1.15rem' } }}>
                  My Agents
                </Typography>
                <Typography sx={{ color: '#888', mb: 3, fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                  Your saved agents and drafts
                </Typography>

                {agentDrafts.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" sx={{ color: '#C7C7C7', mb: 2, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                    Draft Agents
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, width: '100%' }}>
                    {agentDrafts.map((draft) => (
                      <Paper
                        key={draft.storageKey}
                        sx={{
                          p: 0,
                          bgcolor: '#111218',
                          border: '1px solid #1e1e2e',
                          borderRadius: '14px',
                          cursor: 'pointer',
                          transition: 'all 0.22s ease',
                          flex: '1 1 220px',
                          minWidth: '200px',
                          maxWidth: '300px',
                          minHeight: '190px',
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden',
                          '&:hover': {
                            borderColor: '#00F3FF',
                            transform: 'translateY(-3px)',
                            boxShadow: '0 8px 28px rgba(0,243,255,0.14)'
                          }
                        }}
                      >
                        <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                            <Box sx={{ width: 36, height: 36, borderRadius: '9px', bgcolor: 'rgba(0,243,255,0.1)', border: '1px solid rgba(0,243,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                              📝
                            </Box>
                            <Box sx={{ px: 1.2, py: 0.3, bgcolor: 'rgba(0,243,255,0.1)', border: '1px solid rgba(0,243,255,0.25)', borderRadius: '6px', fontSize: '0.62rem', fontWeight: 700, color: '#00F3FF', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                              Draft
                            </Box>
                          </Box>
                          <Typography variant="h6" sx={{ color: '#00F3FF', fontSize: { xs: '0.88rem', sm: '0.92rem' }, fontWeight: 700, lineHeight: 1.3, mb: 0.6 }}>
                            {draft.title}
                          </Typography>
                          <Typography sx={{ color: '#9CA3AF', fontSize: '0.68rem', letterSpacing: '0.02em', mb: 0.8 }}>
                            ★★★★★
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#7A8494', fontSize: { xs: '0.74rem', sm: '0.78rem' }, lineHeight: 1.5, flex: 1, mb: 2 }}>
                            Continue where you left off
                          </Typography>
                          <Box
                            onClick={() => openAgentWizardFromDraft(draft)}
                            sx={{ display: 'inline-flex', alignItems: 'center', px: 1.8, py: 0.6, bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700, color: '#D1D5DB', cursor: 'pointer', transition: 'all 0.18s', alignSelf: 'flex-start', '&:hover': { bgcolor: 'rgba(0,243,255,0.15)', borderColor: 'rgba(0,243,255,0.5)', color: '#00F3FF' } }}
                          >
                            Show Details
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                </Box>
              )}

              {(myContentLoaded || myAgents.length > 0) && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="subtitle1" sx={{ color: '#C7C7C7', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      Saved Agents
                    </Typography>
                    <button
                      onClick={() => refreshMyAgents()}
                      className="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg text-sm hover:bg-cyan-500/20 transition-all"
                      disabled={myAgentsLoading}
                    >
                      {myAgentsLoading ? 'Refreshing…' : 'Refresh'}
                    </button>
                  </Box>
                  <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 3, width: '100%' }}>
                    {myAgents.map((agent) => {
                      const palette = [
                        { border: 'rgba(163, 230, 53, 0.5)', glow: 'rgba(163, 230, 53, 0.22)', text: '#BEF264', badge: 'rgba(163, 230, 53, 0.18)' },
                        { border: 'rgba(96, 165, 250, 0.5)', glow: 'rgba(96, 165, 250, 0.2)', text: '#93C5FD', badge: 'rgba(96, 165, 250, 0.18)' },
                        { border: 'rgba(196, 181, 253, 0.52)', glow: 'rgba(196, 181, 253, 0.2)', text: '#DDD6FE', badge: 'rgba(196, 181, 253, 0.2)' },
                        { border: 'rgba(251, 113, 133, 0.5)', glow: 'rgba(251, 113, 133, 0.2)', text: '#FDA4AF', badge: 'rgba(251, 113, 133, 0.2)' },
                        { border: 'rgba(249, 115, 22, 0.52)', glow: 'rgba(249, 115, 22, 0.2)', text: '#FDBA74', badge: 'rgba(249, 115, 22, 0.2)' },
                      ];
                      const idx = Math.abs(Number((agent as any)?.id || 0)) % palette.length;
                      const tone = palette[idx];
                      const skillCount = Array.isArray((agent as any)?.skill_ids)
                        ? (agent as any).skill_ids.length
                        : Array.isArray((agent as any)?.skillIds)
                          ? (agent as any).skillIds.length
                          : 0;
                      const knowledgeCount = Array.isArray((agent as any)?.config?.knowledge_item_ids)
                        ? (agent as any).config.knowledge_item_ids.length
                        : Array.isArray((agent as any)?.knowledge_items)
                          ? (agent as any).knowledge_items.length
                          : 0;
                      const hasWorkflow = Boolean((agent as any)?.workflow_id);
                      return (
                        <Paper
                          key={agent.id}
                          sx={{
                            p: 2.25,
                            background: 'linear-gradient(160deg, rgba(17, 19, 27, 0.98) 0%, rgba(10, 12, 18, 0.98) 100%)',
                            border: `1px solid ${tone.border}`,
                            borderRadius: '12px',
                            transition: 'all 0.25s ease',
                            flex: '1 1 280px',
                            minWidth: '250px',
                            maxWidth: '350px',
                            minHeight: '210px',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: `0 10px 35px ${tone.glow}`,
                            '&:hover': {
                              borderColor: tone.text,
                              transform: 'translateY(-4px)',
                              boxShadow: `0 16px 40px ${tone.glow}`
                            }
                          }}
                        >
                          <Box
                            onClick={() => openAgentWizardForExistingAgent(agent)}
                            sx={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', flex: 1 }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.3 }}>
                              <Box
                                sx={{
                                  width: 30,
                                  height: 30,
                                  borderRadius: '8px',
                                  border: `1px solid ${tone.border}`,
                                  bgcolor: 'rgba(255, 255, 255, 0.03)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <Bot size={15} color={tone.text} />
                              </Box>
                              <Chip
                                label={hasWorkflow ? 'Workflow' : 'Agent'}
                                size="small"
                                sx={{
                                  height: 22,
                                  bgcolor: tone.badge,
                                  border: `1px solid ${tone.border}`,
                                  color: tone.text,
                                  fontSize: '0.64rem',
                                  fontWeight: 700,
                                  letterSpacing: '0.04em'
                                }}
                              />
                            </Box>

                            <Typography variant="h6" sx={{ color: tone.text, mb: 0.6, fontSize: { xs: '0.95rem', sm: '1.03rem' }, lineHeight: 1.25 }}>
                              {agent.name}
                            </Typography>

                            <Typography sx={{ color: '#F3F4F6', fontSize: '0.72rem', letterSpacing: '0.03em', mb: 0.8 }}>
                              ★★★★★ ({Math.max(1, skillCount)})
                            </Typography>

                            <Typography
                              variant="body2"
                              sx={{
                                color: '#A8B0C0',
                                fontSize: { xs: '0.75rem', sm: '0.79rem' },
                                lineHeight: 1.45,
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                minHeight: 52
                              }}
                            >
                              {agent.description || 'Open agent'}
                            </Typography>

                            <Typography sx={{ color: '#E5E7EB', fontSize: '0.74rem', fontWeight: 700, mt: 1.4 }}>
                              {knowledgeCount > 0 ? `${knowledgeCount} knowledge sources` : 'No knowledge sources'}
                            </Typography>
                          </Box>

                          <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
                            <Button
                              size="small"
                              onClick={(e) => { e.stopPropagation(); openAgentWizardForExistingAgent(agent); }}
                              sx={{
                                minWidth: 'auto',
                                px: 1.4,
                                py: 0.45,
                                color: '#E5E7EB',
                                border: '1px solid rgba(229, 231, 235, 0.25)',
                                bgcolor: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '8px',
                                fontSize: '0.69rem',
                                fontWeight: 700,
                                textTransform: 'none',
                                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.12)' }
                              }}
                            >
                              Show Details
                            </Button>

                            <Button
                              size="small"
                              onClick={(e) => { e.stopPropagation(); openSkillManagement(agent); }}
                              startIcon={<Plug size={13} />}
                              sx={{
                                color: '#A0A7B5',
                                fontSize: '0.7rem',
                                textTransform: 'none',
                                minWidth: 'auto',
                                '& .MuiButton-startIcon': { mr: 0.6 },
                                '&:hover': { color: tone.text, bgcolor: 'rgba(255, 255, 255, 0.06)' }
                              }}
                            >
                              {skillCount > 0 ? `${skillCount} Skills` : 'Manage Skills'}
                            </Button>

                            <Button
                              size="small"
                              onClick={(e) => { e.stopPropagation(); setRunAgentObjective(''); setRunAgentModal({ agent, open: true }); }}
                              startIcon={<Zap size={13} />}
                              sx={{
                                color: '#00F3FF',
                                fontSize: '0.7rem',
                                textTransform: 'none',
                                minWidth: 'auto',
                                border: '1px solid rgba(0,243,255,0.3)',
                                borderRadius: '8px',
                                px: 1,
                                '& .MuiButton-startIcon': { mr: 0.6 },
                                '&:hover': { bgcolor: 'rgba(0,243,255,0.08)' }
                              }}
                            >
                              Run Now
                            </Button>
                          </Box>
                        </Paper>
                      );
                    })}
                    {myContentLoaded && myAgents.length === 0 && (
                      <Paper
                        sx={{
                          p: 3,
                          bgcolor: '#1A1A1A',
                          border: '1px dashed #2A2A2A',
                          flex: '1 1 280px',
                          minWidth: '250px',
                          maxWidth: '350px'
                        }}
                      >
                        <Typography variant="h6" sx={{ color: '#C7C7C7', mb: 1, fontSize: { xs: '1rem', sm: '1.15rem' } }}>
                          No Saved Agents Yet
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#888', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                          Finish an agent in the wizard and it will appear here and in chat agent selection.
                        </Typography>
                      </Paper>
                    )}
                </Box>
              </Box>
              )}

              {(workflowDrafts.length > 0 || myWorkflows.length > 0) && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="subtitle1" sx={{ color: '#C7C7C7', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      Saved Workflows
                    </Typography>
                    <button
                      onClick={() => {
                        refreshMyWorkflows();
                        loadWorkflowDraftsFromStorage();
                      }}
                      className="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg text-sm hover:bg-cyan-500/20 transition-all"
                      disabled={myWorkflowsLoading}
                    >
                      {myWorkflowsLoading ? 'Refreshing…' : 'Refresh'}
                    </button>
                  </Box>
                  {workflowMetricsLoading && myWorkflows.length > 0 && (
                    <Typography sx={{ color: '#6B7280', mt: 1, fontSize: '0.75rem' }}>
                      Updating workflow metrics…
                    </Typography>
                  )}

                  {workflowDrafts.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" sx={{ color: '#9CA3AF', fontSize: { xs: '0.8rem', sm: '0.85rem' }, mb: 1.5 }}>
                        Draft Workflows
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, width: '100%' }}>
                        {workflowDrafts.map((draft) => (
                          <Paper
                            key={draft.storageKey}
                            sx={{
                              p: 0,
                              bgcolor: '#111218',
                              border: '1px solid #1e1e2e',
                              borderRadius: '14px',
                              cursor: 'pointer',
                              transition: 'all 0.22s ease',
                              flex: '1 1 220px',
                              minWidth: '200px',
                              maxWidth: '300px',
                              minHeight: '190px',
                              display: 'flex',
                              flexDirection: 'column',
                              overflow: 'hidden',
                              '&:hover': {
                                borderColor: '#22d3ee',
                                transform: 'translateY(-3px)',
                                boxShadow: '0 8px 28px rgba(34,211,238,0.14)'
                              }
                            }}
                          >
                            <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                                <Box sx={{ width: 36, height: 36, borderRadius: '9px', bgcolor: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                                  🔀
                                </Box>
                                <Box sx={{ px: 1.2, py: 0.3, bgcolor: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)', borderRadius: '6px', fontSize: '0.62rem', fontWeight: 700, color: '#22d3ee', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                  Draft
                                </Box>
                              </Box>
                              <Typography variant="h6" sx={{ color: '#22d3ee', fontSize: { xs: '0.88rem', sm: '0.92rem' }, fontWeight: 700, lineHeight: 1.3, mb: 0.6 }}>
                                {draft.title}
                              </Typography>
                              <Typography sx={{ color: '#9CA3AF', fontSize: '0.68rem', letterSpacing: '0.02em', mb: 0.8 }}>
                                ★★★★★
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#7A8494', fontSize: { xs: '0.74rem', sm: '0.78rem' }, lineHeight: 1.5, flex: 1, mb: 2 }}>
                                Open workflow draft
                              </Typography>
                              <Box
                                onClick={() => openWorkflowFromDraft(draft)}
                                sx={{ display: 'inline-flex', alignItems: 'center', px: 1.8, py: 0.6, bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700, color: '#D1D5DB', cursor: 'pointer', transition: 'all 0.18s', alignSelf: 'flex-start', '&:hover': { bgcolor: 'rgba(34,211,238,0.15)', borderColor: 'rgba(34,211,238,0.5)', color: '#22d3ee' } }}
                              >
                                Show Details
                              </Box>
                            </Box>
                          </Paper>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {myWorkflows.length > 0 && (
                    <Box sx={{ mt: workflowDrafts.length > 0 ? 3 : 2 }}>
                      <Typography variant="subtitle2" sx={{ color: '#9CA3AF', fontSize: { xs: '0.8rem', sm: '0.85rem' }, mb: 1.5 }}>
                        Published Workflows
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, width: '100%' }}>
                        {myWorkflows.map((workflow) => {
                          const workflowId = String((workflow as any)?.id || '');
                          const metrics = workflowMetricsById[workflowId];
                          const lastStatus = String(metrics?.lastStatus || 'no-runs');
                          const successRateLabel =
                            metrics?.successRate === null || metrics?.successRate === undefined
                              ? '—'
                              : `${metrics.successRate}%`;
                          const avgLatencyLabel =
                            metrics?.avgLatencyMs === null || metrics?.avgLatencyMs === undefined
                              ? '—'
                              : `${metrics.avgLatencyMs} ms`;
                          const credentialsLabel =
                            metrics && metrics.requiredCredentials.length > 0
                              ? metrics.requiredCredentials.slice(0, 2).join(', ') + (metrics.requiredCredentials.length > 2 ? ` +${metrics.requiredCredentials.length - 2}` : '')
                              : 'None';
                          const statusBg =
                            lastStatus === 'completed'
                              ? 'rgba(34, 197, 94, 0.22)'
                              : lastStatus === 'failed'
                                ? 'rgba(239, 68, 68, 0.22)'
                                : lastStatus === 'running'
                                  ? 'rgba(14, 165, 233, 0.22)'
                                  : lastStatus === 'paused'
                                    ? 'rgba(245, 158, 11, 0.22)'
                                    : 'rgba(148, 163, 184, 0.22)';
                          const statusColor =
                            lastStatus === 'completed'
                              ? '#22C55E'
                              : lastStatus === 'failed'
                                ? '#F87171'
                                : lastStatus === 'running'
                                  ? '#38BDF8'
                                  : lastStatus === 'paused'
                                    ? '#F59E0B'
                                    : '#94A3B8';

                          return (
                            <Paper
                              key={workflowId || workflow.name}
                              onClick={() => {
                                if (workflowId) {
                                  try {
                                    sessionStorage.setItem('builder_open_workflow_id', workflowId);
                                  } catch {}
                                }
                                setInitialWorkflow(workflow);
                                setCurrentTab(1);
                              }}
                              sx={{
                                p: 3,
                                bgcolor: '#1A1A1A',
                                border: '1px solid #2A2A2A',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                flex: '1 1 320px',
                                minWidth: '290px',
                                maxWidth: '420px',
                                '&:hover': {
                                  borderColor: '#00F3FF',
                                  transform: 'translateY(-4px)'
                                }
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1 }}>
                                <Typography variant="h6" sx={{ color: 'white', fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                                  {workflow.name}
                                </Typography>
                                <Chip
                                  label={lastStatus}
                                  size="small"
                                  sx={{
                                    bgcolor: statusBg,
                                    color: statusColor,
                                    fontSize: '0.68rem',
                                    textTransform: 'uppercase',
                                    fontWeight: 600,
                                  }}
                                />
                              </Box>

                              <Typography variant="body2" sx={{ color: '#888', minHeight: 36, fontSize: { xs: '0.8rem', sm: '0.85rem' } }}>
                                {(workflow as any)?.description || 'Open workflow'}
                              </Typography>

                              <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25 }}>
                                <Box>
                                  <Typography sx={{ color: '#6B7280', fontSize: '0.68rem' }}>Success rate</Typography>
                                  <Typography sx={{ color: '#E5E7EB', fontSize: '0.82rem', fontWeight: 600 }}>{successRateLabel}</Typography>
                                </Box>
                                <Box>
                                  <Typography sx={{ color: '#6B7280', fontSize: '0.68rem' }}>Avg latency</Typography>
                                  <Typography sx={{ color: '#E5E7EB', fontSize: '0.82rem', fontWeight: 600 }}>{avgLatencyLabel}</Typography>
                                </Box>
                                <Box>
                                  <Typography sx={{ color: '#6B7280', fontSize: '0.68rem' }}>Policy profile</Typography>
                                  <Typography sx={{ color: '#E5E7EB', fontSize: '0.82rem', fontWeight: 600 }}>{metrics?.policyProfile || 'standard'}</Typography>
                                </Box>
                                <Box>
                                  <Typography sx={{ color: '#6B7280', fontSize: '0.68rem' }}>Est. cost/run</Typography>
                                  <Typography sx={{ color: '#E5E7EB', fontSize: '0.82rem', fontWeight: 600 }}>${(metrics?.estimatedCostUsd ?? 0).toFixed(4)}</Typography>
                                </Box>
                              </Box>

                              <Box sx={{ mt: 1.5 }}>
                                <Typography sx={{ color: '#6B7280', fontSize: '0.68rem' }}>Required credentials</Typography>
                                <Typography sx={{ color: '#C7C7C7', fontSize: '0.78rem' }}>{credentialsLabel}</Typography>
                              </Box>

                              {(workflow as any)?.updatedAt && (
                                <Typography sx={{ color: '#6B7280', fontSize: '0.68rem', mt: 1.5 }}>
                                  Updated {new Date((workflow as any).updatedAt).toLocaleString()}
                                </Typography>
                              )}
                            </Paper>
                          );
                        })}
                      </Box>
                    </Box>
                  )}
                
              </Box>
              )}
            </Box>
            )}
            
            <Box sx={{ 
              mt: 6, 
              display: 'flex',
              flexWrap: 'wrap',
              gap: 3,
              width: '100%',
              justifyContent: 'center'
            }}>
              {[
                { key: 'sales' as const, title: 'Sales Agent', desc: 'Automate lead qualification and follow-ups', color: '#10b981', category: 'Sales', icon: '💼' },
                { key: 'lead_qualifier' as const, title: 'Lead Qualification Agent', desc: 'Score and prioritize inbound leads automatically', color: '#34d399', category: 'Sales', icon: '🎯' },
                { key: 'support' as const, title: 'Support Agent', desc: 'Handle customer queries 24/7', color: '#3b82f6', category: 'Support', icon: '🛟' },
                { key: 'ticket_triage' as const, title: 'Ticket Triage Agent', desc: 'Classify and route support tickets to the right owners', color: '#60a5fa', category: 'Support', icon: '🎫' },
                { key: 'kb_curator' as const, title: 'Knowledge Base Curator', desc: 'Turn solved issues into searchable help articles', color: '#22c55e', category: 'Knowledge', icon: '📚' },
                { key: 'research' as const, title: 'Research Agent', desc: 'Gather and analyze market intelligence', color: '#8b5cf6', category: 'Research', icon: '🔬' },
                { key: 'data_analyst' as const, title: 'Data Analyst Agent', desc: 'Explore data and surface insights for your team', color: '#a855f7', category: 'Analytics', icon: '📊' },
                { key: 'doc_qa' as const, title: 'Document Q&A Agent', desc: 'Answer questions over PDFs, specs, and contracts', color: '#6366f1', category: 'Documents', icon: '📄' },
                { key: 'email_triage' as const, title: 'Email Triage Agent', desc: 'Group, summarize, and draft replies for your inbox', color: '#0ea5e9', category: 'Email', icon: '✉️' },
                { key: 'meeting_notes' as const, title: 'Meeting Notes Agent', desc: 'Create summaries and action items from calls', color: '#22d3ee', category: 'Productivity', icon: '🎙️' },
                { key: 'code' as const, title: 'Code Agent', desc: 'Generate, review, and debug code', color: '#f59e0b', category: 'Development', icon: '⚡' },
                { key: 'code_reviewer' as const, title: 'Code Review Agent', desc: 'Analyze diffs and suggest code improvements', color: '#fb923c', category: 'Development', icon: '🔍' }
              ].map((template, idx) => (
                <Paper
                  key={idx}
                  sx={{
                    p: 0,
                    bgcolor: '#111218',
                    border: '1px solid #1e1e2e',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.22s ease',
                    flex: '1 1 240px',
                    minWidth: '220px',
                    maxWidth: '320px',
                    minHeight: '200px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    '&:hover': {
                      borderColor: template.color,
                      transform: 'translateY(-3px)',
                      boxShadow: `0 8px 28px ${template.color}28`
                    }
                  }}
                >
                  <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                      <Box
                        sx={{
                          width: 38,
                          height: 38,
                          borderRadius: '10px',
                          bgcolor: `${template.color}18`,
                          border: `1px solid ${template.color}40`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.1rem',
                          flexShrink: 0
                        }}
                      >
                        {template.icon}
                      </Box>
                      <Box
                        sx={{
                          px: 1.2,
                          py: 0.3,
                          bgcolor: `${template.color}15`,
                          border: `1px solid ${template.color}35`,
                          borderRadius: '6px',
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          color: template.color,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {template.category}
                      </Box>
                    </Box>

                    <Typography
                      variant="h6"
                      sx={{
                        color: template.color,
                        fontSize: { xs: '0.88rem', sm: '0.95rem' },
                        fontWeight: 700,
                        lineHeight: 1.3,
                        mb: 0.6
                      }}
                    >
                      {template.title}
                    </Typography>

                    <Typography sx={{ color: '#9CA3AF', fontSize: '0.68rem', letterSpacing: '0.02em', mb: 0.8 }}>
                      ★★★★★
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        color: '#7A8494',
                        fontSize: { xs: '0.74rem', sm: '0.78rem' },
                        lineHeight: 1.5,
                        flex: 1,
                        mb: 2
                      }}
                    >
                      {template.desc}
                    </Typography>

                    <Box
                      onClick={() => openAgentWizardWithTemplate(template.key)}
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        px: 1.8,
                        py: 0.6,
                        bgcolor: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.14)',
                        borderRadius: '8px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#D1D5DB',
                        cursor: 'pointer',
                        transition: 'all 0.18s',
                        alignSelf: 'flex-start',
                        '&:hover': {
                          bgcolor: `${template.color}20`,
                          borderColor: `${template.color}60`,
                          color: template.color
                        }
                      }}
                    >
                      Show Details
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <Box sx={{ height: '100%', bgcolor: '#0A0A0A', overflow: 'hidden' }}>
            <WorkflowBuilder initialWorkflow={initialWorkflow} />
          </Box>
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <Box sx={{ height: '100%', bgcolor: '#0A0A0A', overflow: 'hidden' }}>
            <StagehandAutomation />
          </Box>
        </TabPanel>

        <TabPanel value={currentTab} index={3}>
          <Box sx={{ 
            p: { xs: 2, sm: 3, md: 4 },
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            maxWidth: '1400px',
            mx: 'auto'
          }}>
            <Typography variant="h5" sx={{ color: 'white', mb: 2, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
              Template Gallery
            </Typography>
            <Typography sx={{ color: '#888', mb: 4, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              Browse and use pre-built templates for common tasks
            </Typography>
            
            <Box sx={{ 
              display: 'flex',
              flexWrap: 'wrap',
              gap: 3,
              width: '100%'
            }}>
              {[
                { key: 'contentMarketing' as WorkflowTemplateKey, name: 'Content Marketing Pipeline', category: 'Marketing', desc: 'Research → Write → Edit → Publish workflow', color: '#f472b6', icon: '✍️' },
                { key: 'leadEnrichment' as WorkflowTemplateKey, name: 'Lead Enrichment', category: 'Sales', desc: 'Enrich leads with company data and contact info', color: '#34d399', icon: '🎯' },
                { key: 'customerOnboarding' as WorkflowTemplateKey, name: 'Customer Onboarding', category: 'Support', desc: 'Automated welcome sequence with docs and training', color: '#60a5fa', icon: '🚀' },
                { key: 'competitiveAnalysis' as WorkflowTemplateKey, name: 'Competitive Analysis', category: 'Research', desc: 'Monitor competitors and analyze strategies', color: '#a78bfa', icon: '🔬' },
                { key: 'codeReviewBot' as WorkflowTemplateKey, name: 'Code Review Bot', category: 'Development', desc: 'Automated PR reviews with suggestions', color: '#fb923c', icon: '🤖' },
                { key: 'socialMediaManager' as WorkflowTemplateKey, name: 'Social Media Manager', category: 'Marketing', desc: 'Schedule and post across platforms', color: '#f59e0b', icon: '📢' },
                { key: 'parallelResearch' as WorkflowTemplateKey, name: 'Parallel Research Pipeline', category: 'Research', desc: 'Fork → 3 parallel agents → Join → Synthesis', color: '#8b5cf6', icon: '🔀' },
                { key: 'contentApproval' as WorkflowTemplateKey, name: 'Content with Approval', category: 'Marketing', desc: 'Quality gate → Edit or Revise → Human approval', color: '#06b6d4', icon: '✅' },
                { key: 'customerSupport' as WorkflowTemplateKey, name: 'Multi-Agent Support', category: 'Support', desc: 'Classify → Route to Technical or Billing specialist', color: '#10b981', icon: '🎧' },
                { key: 'dataPipeline' as WorkflowTemplateKey, name: 'Data Pipeline', category: 'Data', desc: 'Fetch → Transform → Validate → Analyze or Error Handle', color: '#ef4444', icon: '📊' }
              ].map((template, idx) => (
                <Paper
                  key={idx}
                  sx={{
                    p: 0,
                    bgcolor: '#111218',
                    border: '1px solid #1e1e2e',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.22s ease',
                    flex: '1 1 240px',
                    minWidth: '220px',
                    maxWidth: '320px',
                    minHeight: '200px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    '&:hover': {
                      borderColor: template.color,
                      transform: 'translateY(-3px)',
                      boxShadow: `0 8px 28px ${template.color}28`
                    }
                  }}
                >
                  <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                      <Box sx={{ width: 38, height: 38, borderRadius: '10px', bgcolor: `${template.color}18`, border: `1px solid ${template.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                        {template.icon}
                      </Box>
                      <Box sx={{ px: 1.2, py: 0.3, bgcolor: `${template.color}15`, border: `1px solid ${template.color}35`, borderRadius: '6px', fontSize: '0.62rem', fontWeight: 700, color: template.color, letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        {template.category}
                      </Box>
                    </Box>
                    <Typography variant="h6" sx={{ color: template.color, fontSize: { xs: '0.88rem', sm: '0.95rem' }, fontWeight: 700, lineHeight: 1.3, mb: 0.6 }}>
                      {template.name}
                    </Typography>
                    <Typography sx={{ color: '#9CA3AF', fontSize: '0.68rem', letterSpacing: '0.02em', mb: 0.8 }}>
                      ★★★★★
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#7A8494', fontSize: { xs: '0.74rem', sm: '0.78rem' }, lineHeight: 1.5, flex: 1, mb: 2 }}>
                      {template.desc}
                    </Typography>
                    <Box
                      onClick={() => openWorkflowFromTemplate(template.key)}
                      sx={{ display: 'inline-flex', alignItems: 'center', px: 1.8, py: 0.6, bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700, color: '#D1D5DB', cursor: 'pointer', transition: 'all 0.18s', alignSelf: 'flex-start', '&:hover': { bgcolor: `${template.color}20`, borderColor: `${template.color}60`, color: template.color } }}
                    >
                      Show Details
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={currentTab} index={4}>
          <SkillLibrary />
        </TabPanel>

        <TabPanel value={currentTab} index={5}>
          <ScheduledTasks />
        </TabPanel>
      </Box>

      <AgentCreationWizard
        open={showAgentWizard}
        onClose={() => {
          snapshotCurrentDraft();
          setShowAgentWizard(false);
          setAgentInitialData(undefined);
          setAgentSkipDraftRestore(false);
          setAgentStartStep(undefined);
        }}
        onDataChange={(data) => console.log('Agent data:', data)}
        onKnowledgeSelect={(ids) => console.log('Knowledge selected:', ids)}
        onSubmit={async (data) => {
          console.log('Agent created:', data);
          try {
            const existingId = (agentInitialData as any)?.id ?? (agentInitialData as any)?.agent_id ?? (agentInitialData as any)?.agentId;
            let savedAgentResponse: any = null;
            if (existingId !== undefined && existingId !== null && String(existingId).trim()) {
              savedAgentResponse = await agentService.updateAgent(String(existingId), data as any);
              toast.success('Agent updated successfully');
            } else {
              savedAgentResponse = await agentService.createAgent(data as any);
              toast.success('Agent created successfully');
            }
            try { localStorage.removeItem('agent_creation_wizard_draft_v1'); } catch {}
            try {
              const userPart = userIdKey ? userIdKey : 'anon';
              const nm = typeof (data as any)?.name === 'string' ? String((data as any).name) : '';
              const title = nm && nm.trim() ? nm : 'Untitled Draft';
              const slug = title
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '')
                .slice(0, 48);
              const stableKey = `agent_creation_wizard_draft_v1_${userPart}_${slug || 'untitled'}`;
              try { localStorage.removeItem(stableKey); } catch {}
              try { localStorage.removeItem(`agent_creation_wizard_draft_v1_${userPart}_current`); } catch {}
              try {
                const activeDraftKey = localStorage.getItem('agent_creation_wizard_active_draft_key');
                if (activeDraftKey) {
                  try { localStorage.removeItem(activeDraftKey); } catch {}
                }
              } catch {}
              try { localStorage.removeItem('agent_creation_wizard_active_draft_key'); } catch {}
              try {
                for (let i = 0; i < localStorage.length; i++) {
                  const k = localStorage.key(i);
                  if (!k) continue;
                  if (k.startsWith(`${stableKey}_`)) {
                    try { localStorage.removeItem(k); } catch {}
                  }
                }
              } catch {}
            } catch {}
            try {
              const savedAgent = (savedAgentResponse as any)?.data || (savedAgentResponse as any);
              window.dispatchEvent(new CustomEvent('builder:agent-saved', { detail: { agentId: (savedAgent as any)?.id } }));
            } catch {}
            setShowAgentWizard(false);
            setAgentInitialData(undefined);
            setAgentSkipDraftRestore(false);
            setAgentStartStep(undefined);
            await refreshMyAgents({ silent: true });
            loadDraftsFromStorage();
          } catch (err) {
            console.error('Failed to create agent:', err);
            toast.error('Failed to create agent');
          }
        }}
        initialData={agentInitialData}
        skipDraftRestore={agentSkipDraftRestore}
        startStep={agentStartStep}
      />

      <Dialog
        open={skillManagementOpen}
        onClose={closeSkillManagement}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            backdropFilter: 'blur(20px)',
            color: '#FFFFFF',
            borderRadius: '20px',
            boxShadow: '0 20px 70px rgba(0, 0, 0, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }
        }}
      >
        <DialogTitle sx={{ color: '#FFFFFF', fontWeight: 600, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Plug size={20} />
            <span>Manage Skills for {skillManagementAgent?.name}</span>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {skillsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#00F3FF' }} />
            </Box>
          ) : (
            <Box>
              <Typography sx={{ color: '#888', mb: 2, fontSize: 14 }}>
                Select skills to attach to this agent. Skills enhance the agent's capabilities with specialized prompts, policies, and tool configurations.
              </Typography>
              
              {availableSkills.length === 0 && installedSkills.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, color: '#888' }}>
                  <Typography>No skills available. Create skills in the Skill Library first.</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: '400px', overflow: 'auto' }}>
                  {availableSkills.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography sx={{ color: '#C7C7C7', fontSize: 13, mb: 1, fontWeight: 600 }}>Library Skills</Typography>
                      {availableSkills.map((skill) => (
                        <Box
                          key={`lib-${skill.id}`}
                          onClick={() => toggleSkillSelection(String(skill.id))}
                          sx={{
                            p: 1.5,
                            mb: 1,
                            borderRadius: 1.5,
                            cursor: 'pointer',
                            border: selectedSkillIds.includes(String(skill.id)) ? '1px solid rgba(0, 243, 255, 0.7)' : '1px solid rgba(255,255,255,0.08)',
                            bgcolor: selectedSkillIds.includes(String(skill.id)) ? 'rgba(0, 243, 255, 0.1)' : 'rgba(0,0,0,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            '&:hover': { borderColor: 'rgba(0, 243, 255, 0.5)' }
                          }}
                        >
                          <Checkbox 
                            checked={selectedSkillIds.includes(String(skill.id))} 
                            sx={{ color: '#888', '&.Mui-checked': { color: '#00F3FF' }, p: 0 }} 
                          />
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>{skill.name}</Typography>
                            {skill.description && <Typography sx={{ color: '#888', fontSize: 12 }}>{skill.description}</Typography>}
                          </Box>
                          {selectedSkillIds.includes(String(skill.id)) && (
                            <Chip label="Active" size="small" sx={{ bgcolor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E', fontSize: 10 }} />
                          )}
                        </Box>
                      ))}
                    </Box>
                  )}
                  
                  {installedSkills.length > 0 && (
                    <Box>
                      <Typography sx={{ color: '#C7C7C7', fontSize: 13, mb: 1, fontWeight: 600 }}>Installed Skills</Typography>
                      {installedSkills.filter(s => s.enabled).map((skill) => (
                        <Box
                          key={`inst-${skill.id}`}
                          onClick={() => toggleSkillSelection(`installed-${skill.id}`)}
                          sx={{
                            p: 1.5,
                            mb: 1,
                            borderRadius: 1.5,
                            cursor: 'pointer',
                            border: selectedSkillIds.includes(`installed-${skill.id}`) ? '1px solid rgba(34, 197, 94, 0.7)' : '1px solid rgba(255,255,255,0.08)',
                            bgcolor: selectedSkillIds.includes(`installed-${skill.id}`) ? 'rgba(34, 197, 94, 0.1)' : 'rgba(0,0,0,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            '&:hover': { borderColor: 'rgba(34, 197, 94, 0.5)' }
                          }}
                        >
                          <Checkbox 
                            checked={selectedSkillIds.includes(`installed-${skill.id}`)} 
                            sx={{ color: '#888', '&.Mui-checked': { color: '#22C55E' }, p: 0 }} 
                          />
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography sx={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>{skill.name}</Typography>
                              <Chip label={skill.category || 'general'} size="small" sx={{ bgcolor: 'rgba(107,114,128,0.3)', color: '#fff', fontSize: 10, height: 18 }} />
                            </Box>
                            {skill.description && <Typography sx={{ color: '#888', fontSize: 12 }}>{skill.description}</Typography>}
                          </Box>
                          {selectedSkillIds.includes(`installed-${skill.id}`) && (
                            <Chip label="Active" size="small" sx={{ bgcolor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E', fontSize: 10 }} />
                          )}
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
              
              <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 2 }}>
                <Typography sx={{ color: '#C7C7C7', fontSize: 13, fontWeight: 600, mb: 1 }}>Selected Skills: {selectedSkillIds.length}</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selectedSkillIds.map(id => {
                    const libSkill = availableSkills.find(s => String(s.id) === id);
                    const instSkill = installedSkills.find(s => `installed-${s.id}` === id);
                    const skillName = libSkill?.name || instSkill?.name || id;
                    return (
                      <Chip 
                        key={id} 
                        label={skillName} 
                        size="small" 
                        onDelete={() => toggleSkillSelection(id)}
                        sx={{ bgcolor: 'rgba(0, 243, 255, 0.2)', color: '#00F3FF', fontSize: 11 }} 
                      />
                    );
                  })}
                  {selectedSkillIds.length === 0 && <Typography sx={{ color: '#666', fontSize: 12 }}>No skills selected</Typography>}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <Button onClick={closeSkillManagement} variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.25)', color: '#FFFFFF', borderRadius: '12px' }}>Cancel</Button>
          <Button 
            onClick={saveAgentSkills} 
            variant="contained" 
            disabled={savingSkills}
            startIcon={savingSkills ? <CircularProgress size={16} /> : <Plug size={16} />}
            sx={{ bgcolor: '#00F3FF', color: '#000', borderRadius: '12px', '&:hover': { bgcolor: '#00D1DD' } }}
          >
            {savingSkills ? 'Saving...' : 'Save Skills'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!runAgentModal?.open}
        onClose={() => setRunAgentModal(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#111218', border: '1px solid #1e1e2e', borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ color: '#fff', fontWeight: 700, pb: 1 }}>
          Run Agent Now
          {runAgentModal?.agent && (
            <Typography sx={{ color: '#6B7280', fontSize: 13, fontWeight: 400, mt: 0.5 }}>
              {runAgentModal.agent.name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#9CA3AF', fontSize: 13, mb: 2 }}>
            Enter a one-time goal for this agent. It will run immediately.
          </Typography>
          <textarea
            value={runAgentObjective}
            onChange={e => setRunAgentObjective(e.target.value)}
            placeholder="Describe what you want the agent to do..."
            rows={4}
            style={{
              width: '100%',
              background: '#0a0a0f',
              border: '1px solid #2a2a3e',
              borderRadius: '8px',
              padding: '10px 12px',
              color: '#fff',
              fontSize: '14px',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Button onClick={() => setRunAgentModal(null)} variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.25)', color: '#fff', borderRadius: '12px' }}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (!runAgentModal?.agent || !runAgentObjective.trim()) {
                toast.error('Please enter an objective');
                return;
              }
              setRunAgentLoading(true);
              try {
                await scheduledTasksService.createScheduledTask({
                  name: `Run: ${runAgentModal.agent.name}`,
                  objective: runAgentObjective.trim(),
                  agent_id: runAgentModal.agent.id,
                  trigger_type: 'once',
                  run_at: new Date(Date.now() + 5000).toISOString(),
                  max_runs: 1,
                  memory_enabled: false,
                });
                toast.success('Agent task queued successfully!');
                setRunAgentModal(null);
                setRunAgentObjective('');
              } catch {
                toast.error('Failed to queue agent task');
              } finally {
                setRunAgentLoading(false);
              }
            }}
            variant="contained"
            disabled={runAgentLoading || !runAgentObjective.trim()}
            startIcon={<Zap size={15} />}
            sx={{ bgcolor: '#00F3FF', color: '#000', borderRadius: '12px', fontWeight: 700, '&:hover': { bgcolor: '#00D1DD' }, '&:disabled': { opacity: 0.5 } }}
          >
            {runAgentLoading ? 'Queuing...' : 'Run Agent'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
