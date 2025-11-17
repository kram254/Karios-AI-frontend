import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography, Paper } from '@mui/material';
import { Paintbrush, Bot, Workflow, Wrench, Library } from 'lucide-react';
import AgentCreationWizard from '../components/agent/AgentCreationWizard';
import { AutomationWorkspace } from '../components/AutomationWorkspace';
import { WorkflowBuilder } from '../components/workflow/WorkflowBuilder';
import { StagehandAutomation } from '../components/StagehandAutomation';
import { Agent, AgentRole, AgentMode, SEND_MAIL, SEARCH_INTERNET } from '../types/agent';
import type { Workflow as BuilderWorkflow } from '../types/workflow';

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
  | 'socialMediaManager';

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
  const [showAgentWizard, setShowAgentWizard] = useState(false);
  const [agentInitialData, setAgentInitialData] = useState<Partial<Agent> | undefined>(undefined);
  const [initialWorkflow, setInitialWorkflow] = useState<BuilderWorkflow | undefined>(undefined);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const openAgentWizardWithTemplate = (templateKey: 'sales' | 'support' | 'research' | 'code') => {
    if (templateKey === 'sales') {
      setAgentInitialData({
        name: 'Sales Agent',
        description: 'Automate lead qualification, follow-ups, and pipeline nurturing.',
        ai_role: AgentRole.EMAIL_AUTOMATION,
        language: 'en',
        mode: AgentMode.TEXT,
        response_style: 0.7,
        response_length: 220,
        actions: [SEND_MAIL, SEARCH_INTERNET],
        config: {
          language: 'en',
          mode: AgentMode.TEXT,
          response_style: 0.7,
          response_length: 220,
          model: 'gpt-4',
          temperature: 0.7,
          max_tokens: 1500,
          actions: [SEND_MAIL, SEARCH_INTERNET]
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
        actions: [SEARCH_INTERNET],
        config: {
          language: 'en',
          mode: AgentMode.TEXT,
          response_style: 0.4,
          response_length: 180,
          model: 'gpt-4',
          temperature: 0.4,
          max_tokens: 1200,
          actions: [SEARCH_INTERNET]
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
        actions: [SEARCH_INTERNET],
        config: {
          language: 'en',
          mode: AgentMode.TEXT,
          response_style: 0.3,
          response_length: 260,
          model: 'gpt-4',
          temperature: 0.6,
          max_tokens: 2000,
          actions: [SEARCH_INTERNET]
        }
      });
    } else if (templateKey === 'code') {
      setAgentInitialData({
        name: 'Code Agent',
        description: 'Generate, review, and debug code with testing-focused workflows.',
        ai_role: AgentRole.TESTING_QA,
        language: 'en',
        mode: AgentMode.TEXT,
        response_style: 0.5,
        response_length: 200,
        actions: [],
        config: {
          language: 'en',
          mode: AgentMode.TEXT,
          response_style: 0.5,
          response_length: 200,
          model: 'gpt-4',
          temperature: 0.3,
          max_tokens: 1600
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
    <Box sx={{ height: '100vh', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ 
        bgcolor: '#0A0A0A', 
        color: 'white', 
        p: { xs: 2, sm: 3 }, 
        borderBottom: '1px solid #2A2A2A',
        flexShrink: 0
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Paintbrush size={32} className="text-cyan-400" />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              Builder Studio
            </Typography>
            <Typography variant="body2" sx={{ color: '#888', mt: 0.5, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              Create agents, workflows, and automations visually
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ 
        borderBottom: 1, 
        borderColor: '#2A2A2A', 
        bgcolor: '#0A0A0A',
        flexShrink: 0,
        overflowX: 'auto'
      }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 'auto',
            '& .MuiTab-root': { 
              color: '#888',
              textTransform: 'none',
              fontSize: { xs: '0.8rem', sm: '0.95rem' },
              minHeight: { xs: '42px', sm: '48px' },
              px: { xs: 1.5, sm: 2 }
            },
            '& .Mui-selected': { 
              color: '#00F3FF !important'
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#00F3FF'
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
          />
          <Tab 
            icon={<Library size={20} />} 
            iconPosition="start" 
            label="Template Gallery" 
          />
        </Tabs>
      </Box>

      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        bgcolor: '#0A0A0A',
        display: 'flex',
        flexDirection: 'column'
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
            <Typography sx={{ color: '#888', mb: 4, textAlign: 'center', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              Create intelligent agents with custom personalities, knowledge bases, and capabilities
            </Typography>
            <button
              onClick={() => setShowAgentWizard(true)}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all"
            >
              Create New Agent
            </button>
            
            <Box sx={{ 
              mt: 6, 
              display: 'flex',
              flexWrap: 'wrap',
              gap: 3,
              width: '100%',
              justifyContent: 'center'
            }}>
              {[
                { key: 'sales' as const, title: 'Sales Agent', desc: 'Automate lead qualification and follow-ups', color: '#10b981' },
                { key: 'support' as const, title: 'Support Agent', desc: 'Handle customer queries 24/7', color: '#3b82f6' },
                { key: 'research' as const, title: 'Research Agent', desc: 'Gather and analyze market intelligence', color: '#8b5cf6' },
                { key: 'code' as const, title: 'Code Agent', desc: 'Generate, review, and debug code', color: '#f59e0b' }
              ].map((template, idx) => (
                <Paper 
                  key={idx}
                  onClick={() => openAgentWizardWithTemplate(template.key)}
                  sx={{ 
                    p: 3, 
                    bgcolor: '#1A1A1A', 
                    border: '1px solid #2A2A2A',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    flex: '1 1 280px',
                    minWidth: '250px',
                    maxWidth: '350px',
                    '&:hover': {
                      borderColor: template.color,
                      transform: 'translateY(-4px)'
                    }
                  }}
                >
                  <Typography variant="h6" sx={{ color: template.color, mb: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    {template.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#888', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    {template.desc}
                  </Typography>
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
                { key: 'contentMarketing' as WorkflowTemplateKey, name: 'Content Marketing Pipeline', category: 'Marketing', desc: 'Research → Write → Edit → Publish workflow' },
                { key: 'leadEnrichment' as WorkflowTemplateKey, name: 'Lead Enrichment', category: 'Sales', desc: 'Enrich leads with company data and contact info' },
                { key: 'customerOnboarding' as WorkflowTemplateKey, name: 'Customer Onboarding', category: 'Support', desc: 'Automated welcome sequence with docs and training' },
                { key: 'competitiveAnalysis' as WorkflowTemplateKey, name: 'Competitive Analysis', category: 'Research', desc: 'Monitor competitors and analyze strategies' },
                { key: 'codeReviewBot' as WorkflowTemplateKey, name: 'Code Review Bot', category: 'Development', desc: 'Automated PR reviews with suggestions' },
                { key: 'socialMediaManager' as WorkflowTemplateKey, name: 'Social Media Manager', category: 'Marketing', desc: 'Schedule and post across platforms' }
              ].map((template, idx) => (
                <Paper 
                  key={idx}
                  onClick={() => openWorkflowFromTemplate(template.key)}
                  sx={{ 
                    p: 3, 
                    bgcolor: '#1A1A1A', 
                    border: '1px solid #2A2A2A',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    flex: '1 1 300px',
                    minWidth: '280px',
                    maxWidth: '400px',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      borderColor: '#00F3FF',
                      transform: 'translateY(-4px)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2, gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="h6" sx={{ color: 'white', flex: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                      {template.name}
                    </Typography>
                    <Box sx={{ 
                      px: 2, 
                      py: 0.5, 
                      bgcolor: '#2A2A2A', 
                      borderRadius: '12px',
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      color: '#00F3FF',
                      whiteSpace: 'nowrap'
                    }}>
                      {template.category}
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#888', mb: 2, flex: 1, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    {template.desc}
                  </Typography>
                  <button className="px-4 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg text-sm hover:bg-cyan-500/20 transition-all w-full">
                    Use Template
                  </button>
                </Paper>
              ))}
            </Box>
          </Box>
        </TabPanel>
      </Box>

      <AgentCreationWizard
        open={showAgentWizard}
        onClose={() => {
          setShowAgentWizard(false);
          setAgentInitialData(undefined);
        }}
        onDataChange={(data) => console.log('Agent data:', data)}
        onKnowledgeSelect={(ids) => console.log('Knowledge selected:', ids)}
        onSubmit={(data) => {
          console.log('Agent created:', data);
          setShowAgentWizard(false);
          setAgentInitialData(undefined);
        }}
        initialData={agentInitialData}
      />
    </Box>
  );
}
