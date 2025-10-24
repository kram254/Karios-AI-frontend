import { AgentRole } from '../types/agent';

/**
 * Role descriptions for the agent creation wizard
 * These provide user-friendly descriptions of each agent role
 */
export const AGENT_ROLE_DESCRIPTIONS: Record<AgentRole, {
  title: string;
  description: string;
  icon: string;
  specialties: string[];
}> = {
  [AgentRole.WEB_SCRAPING]: {
    title: 'Web Scraping',
    description: 'Extract and structure data from websites with intelligent parsing',
    icon: '🕷️',
    specialties: ['Data Extraction', 'Content Parsing', 'API Integration']
  },
  [AgentRole.WEB_AUTOMATION]: {
    title: 'Web Automation',
    description: 'Automate browser interactions and workflows with precision',
    icon: '🤖',
    specialties: ['Browser Control', 'Form Filling', 'Workflow Execution']
  },
  [AgentRole.TASK_AUTOMATION]: {
    title: 'Task Automation',
    description: 'Orchestrate complex multi-step tasks and processes',
    icon: '⚡',
    specialties: ['Process Orchestration', 'Task Scheduling', 'Workflow Management']
  },
  [AgentRole.DEEP_RESEARCH]: {
    title: 'Deep Research',
    description: 'Comprehensive information gathering and analysis across sources',
    icon: '🔍',
    specialties: ['Information Synthesis', 'Source Verification', 'Competitive Analysis']
  },
  [AgentRole.CONTENT_CREATION]: {
    title: 'Content Creation',
    description: 'Generate high-quality content tailored to your needs',
    icon: '✍️',
    specialties: ['Article Writing', 'Documentation', 'Creative Copywriting']
  },
  [AgentRole.DATA_ANALYSIS]: {
    title: 'Data Analysis',
    description: 'Process and analyze data to extract actionable insights',
    icon: '📊',
    specialties: ['Data Processing', 'Pattern Recognition', 'Report Generation']
  },
  [AgentRole.EMAIL_AUTOMATION]: {
    title: 'Email Automation',
    description: 'Manage and automate email communications efficiently',
    icon: '📧',
    specialties: ['Email Campaigns', 'Response Automation', 'SMTP Integration']
  },
  [AgentRole.DOCUMENT_PROCESSING]: {
    title: 'Document Processing',
    description: 'Analyze, extract, and transform document content',
    icon: '📄',
    specialties: ['PDF Extraction', 'OCR Processing', 'Document Classification']
  },
  [AgentRole.TESTING_QA]: {
    title: 'Testing & QA',
    description: 'Automated testing and quality assurance for web applications',
    icon: '✅',
    specialties: ['Automated Testing', 'Bug Detection', 'Performance Monitoring']
  },
  [AgentRole.CUSTOM]: {
    title: 'Custom Role',
    description: 'Define your own specialized agent role',
    icon: '⚙️',
    specialties: ['Flexible', 'Customizable', 'Specialized']
  }
};

/**
 * Get the role description for a specific agent role
 * 
 * @param role The agent role
 * @returns The role description object
 */
export function getRoleDescription(role: AgentRole) {
  return AGENT_ROLE_DESCRIPTIONS[role];
}
