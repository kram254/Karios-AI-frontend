import { AgentRole } from '../types/agent';

/**
 * Comprehensive agent category definitions for the Agent Builder
 */
export interface AgentCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  agents: AgentRole[];
}

/**
 * Agent categories for organized display in the Agent Builder
 */
export const AGENT_CATEGORIES: AgentCategory[] = [
  {
    id: 'sales',
    name: 'Sales',
    icon: '💼',
    color: '#00E5FF',
    description: 'Automate lead qualification, outreach, and sales processes',
    agents: [
      AgentRole.SALES_LEAD_QUALIFIER,
      AgentRole.SALES_OUTREACH,
      AgentRole.SALES_DEMO_SCHEDULER,
      AgentRole.SALES_PROPOSAL_GENERATOR,
      AgentRole.SALES_COMPETITOR_INTEL
    ]
  },
  {
    id: 'support',
    name: 'Support',
    icon: '🎧',
    color: '#FF6B35',
    description: 'Handle customer queries and automate support workflows',
    agents: [
      AgentRole.SUPPORT_TICKET_TRIAGE,
      AgentRole.SUPPORT_FAQ_RESPONDER,
      AgentRole.SUPPORT_TECHNICAL,
      AgentRole.SUPPORT_SENTIMENT_MONITOR,
      AgentRole.SUPPORT_FEEDBACK_COLLECTOR
    ]
  },
  {
    id: 'research',
    name: 'Research',
    icon: '🔬',
    color: '#9C27B0',
    description: 'Gather and analyze information from multiple sources',
    agents: [
      AgentRole.DEEP_RESEARCH,
      AgentRole.RESEARCH_MARKET_INTEL,
      AgentRole.RESEARCH_ACADEMIC,
      AgentRole.RESEARCH_PATENT,
      AgentRole.RESEARCH_NEWS_MONITOR
    ]
  },
  {
    id: 'code',
    name: 'Code & Development',
    icon: '💻',
    color: '#4CAF50',
    description: 'Programming, debugging, and software development agents',
    agents: [
      AgentRole.CODE_GENERATOR,
      AgentRole.CODE_REVIEWER,
      AgentRole.CODE_DEBUGGER,
      AgentRole.CODE_DOCUMENTATION,
      AgentRole.CODE_TEST_GENERATOR,
      AgentRole.TESTING_QA
    ]
  },
  {
    id: 'data',
    name: 'Data',
    icon: '📊',
    color: '#FF9800',
    description: 'Process, analyze, and visualize data intelligently',
    agents: [
      AgentRole.DATA_ANALYSIS,
      AgentRole.DATA_ETL,
      AgentRole.DATA_QUALITY,
      AgentRole.DATA_VISUALIZATION,
      AgentRole.DATA_SQL_ASSISTANT
    ]
  },
  {
    id: 'content',
    name: 'Content',
    icon: '✍️',
    color: '#E91E63',
    description: 'Create and optimize content across channels',
    agents: [
      AgentRole.CONTENT_CREATION,
      AgentRole.CONTENT_SOCIAL_MEDIA,
      AgentRole.CONTENT_EMAIL_MARKETING,
      AgentRole.CONTENT_SEO,
      AgentRole.CONTENT_VIDEO_SCRIPT
    ]
  },
  {
    id: 'web',
    name: 'Web',
    icon: '🌐',
    color: '#2196F3',
    description: 'Automate browser tasks and web interactions',
    agents: [
      AgentRole.WEB_SCRAPING,
      AgentRole.WEB_AUTOMATION,
      AgentRole.WEB_MONITOR,
      AgentRole.WEB_TESTING,
      AgentRole.WEB_API_INTEGRATION
    ]
  },
  {
    id: 'workflow',
    name: 'Workflow',
    icon: '⚙️',
    color: '#00BCD4',
    description: 'Orchestrate and automate business processes',
    agents: [
      AgentRole.TASK_AUTOMATION,
      AgentRole.WORKFLOW_AUTOMATION,
      AgentRole.OPS_SCHEDULING
    ]
  },
  {
    id: 'communication',
    name: 'Communication',
    icon: '📧',
    color: '#795548',
    description: 'Manage emails, meetings, and personal tasks',
    agents: [
      AgentRole.EMAIL_AUTOMATION,
      AgentRole.MEETING_ASSISTANT,
      AgentRole.PERSONAL_ASSISTANT
    ]
  },
  {
    id: 'documents',
    name: 'Documents',
    icon: '📄',
    color: '#607D8B',
    description: 'Process documents, contracts, and legal content',
    agents: [
      AgentRole.DOCUMENT_PROCESSING,
      AgentRole.CONTRACT_REVIEW,
      AgentRole.LEGAL_RESEARCH
    ]
  }
];

/**
 * Role descriptions for the agent creation wizard
 * These provide user-friendly descriptions of each agent role
 */
export const AGENT_ROLE_DESCRIPTIONS: Record<AgentRole, {
  title: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  specialties: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  useCases: string[];
}> = {
  // Sales Agents
  [AgentRole.SALES_LEAD_QUALIFIER]: {
    title: 'Lead Qualifier',
    description: 'Automatically qualify leads based on criteria and engagement patterns',
    icon: '🎯',
    color: '#00E5FF',
    category: 'sales',
    specialties: ['Lead Scoring', 'Engagement Tracking', 'Qualification Automation', 'CRM Sync'],
    difficulty: 'intermediate',
    useCases: ['Inbound lead qualification', 'Outbound prospecting', 'Lead prioritization']
  },
  [AgentRole.SALES_OUTREACH]: {
    title: 'Outreach Agent',
    description: 'Personalized sales outreach automation with AI-crafted messages',
    icon: '📤',
    color: '#00E5FF',
    category: 'sales',
    specialties: ['Email Personalization', 'Multi-channel Outreach', 'Follow-up Automation', 'A/B Testing'],
    difficulty: 'beginner',
    useCases: ['Cold email campaigns', 'LinkedIn outreach', 'Follow-up sequences']
  },
  [AgentRole.SALES_DEMO_SCHEDULER]: {
    title: 'Demo Scheduler',
    description: 'Handles scheduling demos and meetings with prospects automatically',
    icon: '📅',
    color: '#00E5FF',
    category: 'sales',
    specialties: ['Calendar Integration', 'Time Zone Handling', 'Reminder Automation', 'Rescheduling'],
    difficulty: 'beginner',
    useCases: ['Demo bookings', 'Meeting scheduling', 'Appointment management']
  },
  [AgentRole.SALES_PROPOSAL_GENERATOR]: {
    title: 'Proposal Generator',
    description: 'Creates customized sales proposals based on customer requirements',
    icon: '📋',
    color: '#00E5FF',
    category: 'sales',
    specialties: ['Document Generation', 'Pricing Calculations', 'Template Management', 'PDF Export'],
    difficulty: 'intermediate',
    useCases: ['Custom proposals', 'Quote generation', 'Contract drafting']
  },
  [AgentRole.SALES_COMPETITOR_INTEL]: {
    title: 'Competitive Intelligence',
    description: 'Monitors competitors and provides battlecard updates',
    icon: '🔍',
    color: '#00E5FF',
    category: 'sales',
    specialties: ['Web Scraping', 'Competitor Tracking', 'Market Analysis', 'Alert Notifications'],
    difficulty: 'advanced',
    useCases: ['Competitor monitoring', 'Win/loss analysis', 'Market positioning']
  },

  // Support Agents
  [AgentRole.SUPPORT_TICKET_TRIAGE]: {
    title: 'Ticket Triage',
    description: 'Automatically categorize and route support tickets to the right team',
    icon: '🎫',
    color: '#FF6B35',
    category: 'support',
    specialties: ['Ticket Classification', 'Priority Assignment', 'Auto-routing', 'SLA Monitoring'],
    difficulty: 'intermediate',
    useCases: ['Help desk automation', 'Ticket routing', 'Priority management']
  },
  [AgentRole.SUPPORT_FAQ_RESPONDER]: {
    title: 'FAQ Responder',
    description: 'Handles common customer queries with intelligent responses',
    icon: '❓',
    color: '#FF6B35',
    category: 'support',
    specialties: ['Knowledge Base Search', 'Contextual Responses', 'Multi-language', 'Escalation Handling'],
    difficulty: 'beginner',
    useCases: ['First-line support', 'FAQs', '24/7 availability']
  },
  [AgentRole.SUPPORT_TECHNICAL]: {
    title: 'Technical Support',
    description: 'Provides technical troubleshooting and debugging assistance',
    icon: '🔧',
    color: '#FF6B35',
    category: 'support',
    specialties: ['Error Analysis', 'Log Parsing', 'Solution Recommendation', 'Documentation Search'],
    difficulty: 'advanced',
    useCases: ['Technical debugging', 'Error resolution', 'Setup assistance']
  },
  [AgentRole.SUPPORT_SENTIMENT_MONITOR]: {
    title: 'Sentiment Monitor',
    description: 'Analyzes customer sentiment and escalates urgent issues',
    icon: '💭',
    color: '#FF6B35',
    category: 'support',
    specialties: ['Sentiment Analysis', 'Escalation Triggers', 'Trend Detection', 'Report Generation'],
    difficulty: 'intermediate',
    useCases: ['Customer satisfaction monitoring', 'Churn prevention', 'VIP alerts']
  },
  [AgentRole.SUPPORT_FEEDBACK_COLLECTOR]: {
    title: 'Feedback Collector',
    description: 'Collects and synthesizes customer feedback across channels',
    icon: '📝',
    color: '#FF6B35',
    category: 'support',
    specialties: ['Survey Automation', 'Feedback Aggregation', 'Insight Generation', 'NPS Tracking'],
    difficulty: 'beginner',
    useCases: ['Customer surveys', 'Product feedback', 'Review management']
  },

  // Research Agents
  [AgentRole.DEEP_RESEARCH]: {
    title: 'Deep Research',
    description: 'Conducts comprehensive research on any topic with citations',
    icon: '🔍',
    color: '#9C27B0',
    category: 'research',
    specialties: ['Web Research', 'Source Validation', 'Report Generation', 'Citation Management'],
    difficulty: 'intermediate',
    useCases: ['Market research', 'Competitive analysis', 'Academic research']
  },
  [AgentRole.RESEARCH_MARKET_INTEL]: {
    title: 'Market Intelligence',
    description: 'Gathers and analyzes market trends and industry insights',
    icon: '📈',
    color: '#9C27B0',
    category: 'research',
    specialties: ['Trend Analysis', 'Industry Monitoring', 'Report Creation', 'Data Visualization'],
    difficulty: 'advanced',
    useCases: ['Market analysis', 'Industry trends', 'Investment research']
  },
  [AgentRole.RESEARCH_ACADEMIC]: {
    title: 'Academic Research',
    description: 'Searches and synthesizes academic papers and citations',
    icon: '📚',
    color: '#9C27B0',
    category: 'research',
    specialties: ['Paper Search', 'Citation Extraction', 'Summary Generation', 'Bibliography Management'],
    difficulty: 'intermediate',
    useCases: ['Literature review', 'Paper analysis', 'Citation finding']
  },
  [AgentRole.RESEARCH_PATENT]: {
    title: 'Patent Research',
    description: 'Searches and analyzes patent databases for innovation insights',
    icon: '💡',
    color: '#9C27B0',
    category: 'research',
    specialties: ['Patent Search', 'Prior Art Analysis', 'Claim Extraction', 'Competitor Patents'],
    difficulty: 'advanced',
    useCases: ['Patent research', 'IP analysis', 'Innovation tracking']
  },
  [AgentRole.RESEARCH_NEWS_MONITOR]: {
    title: 'News Monitor',
    description: 'Monitors news sources and provides relevant updates',
    icon: '📰',
    color: '#9C27B0',
    category: 'research',
    specialties: ['News Aggregation', 'Topic Filtering', 'Alert Generation', 'Summary Creation'],
    difficulty: 'beginner',
    useCases: ['Media monitoring', 'Brand tracking', 'Industry news']
  },

  // Code Agents
  [AgentRole.CODE_REVIEWER]: {
    title: 'Code Reviewer',
    description: 'Automatically reviews code for bugs, security, and best practices',
    icon: '🔎',
    color: '#4CAF50',
    category: 'code',
    specialties: ['Static Analysis', 'Security Scanning', 'Style Checking', 'PR Comments'],
    difficulty: 'intermediate',
    useCases: ['Code review automation', 'Security audits', 'Quality assurance']
  },
  [AgentRole.CODE_GENERATOR]: {
    title: 'Code Generator',
    description: 'Generates code from natural language descriptions',
    icon: '⚡',
    color: '#4CAF50',
    category: 'code',
    specialties: ['Code Generation', 'Multi-language Support', 'Refactoring', 'Documentation'],
    difficulty: 'intermediate',
    useCases: ['Feature development', 'Boilerplate generation', 'Code conversion']
  },
  [AgentRole.CODE_DEBUGGER]: {
    title: 'Debug Assistant',
    description: 'Helps identify and fix bugs in code with AI assistance',
    icon: '🐛',
    color: '#4CAF50',
    category: 'code',
    specialties: ['Error Analysis', 'Stack Trace Parsing', 'Fix Suggestions', 'Root Cause Analysis'],
    difficulty: 'advanced',
    useCases: ['Bug fixing', 'Error resolution', 'Performance debugging']
  },
  [AgentRole.CODE_DOCUMENTATION]: {
    title: 'Documentation Agent',
    description: 'Automatically generates and maintains code documentation',
    icon: '📖',
    color: '#4CAF50',
    category: 'code',
    specialties: ['Docstring Generation', 'README Creation', 'API Docs', 'Change Logs'],
    difficulty: 'beginner',
    useCases: ['Documentation', 'API reference', 'Onboarding docs']
  },
  [AgentRole.CODE_TEST_GENERATOR]: {
    title: 'Test Generator',
    description: 'Creates unit tests and integration tests automatically',
    icon: '🧪',
    color: '#4CAF50',
    category: 'code',
    specialties: ['Test Generation', 'Coverage Analysis', 'Mock Creation', 'Edge Case Detection'],
    difficulty: 'intermediate',
    useCases: ['Unit testing', 'Integration testing', 'TDD assistance']
  },
  [AgentRole.TESTING_QA]: {
    title: 'QA Automated Tester',
    description: 'End-to-end automated testing, API validation, and quality assurance across web and mobile workflows',
    icon: '✅',
    color: '#4CAF50',
    category: 'code',
    specialties: ['Playwright', 'Selenium', 'Cypress', 'Appium', 'API Testing', 'Performance Testing', 'Security Testing', 'Test Strategy', 'CI/CD Test Automation', 'Reporting & Analytics'],
    difficulty: 'advanced',
    useCases: ['E2E UI automation', 'Regression suites', 'API contract testing', 'Smoke testing in CI', 'Performance baselining', 'Security test planning']
  },

  // Data Agents
  [AgentRole.DATA_ANALYSIS]: {
    title: 'Data Analyst',
    description: 'Analyzes datasets and generates insights automatically',
    icon: '📊',
    color: '#FF9800',
    category: 'data',
    specialties: ['Data Analysis', 'Visualization', 'Pattern Detection', 'Report Generation'],
    difficulty: 'intermediate',
    useCases: ['Business intelligence', 'Data exploration', 'Trend analysis']
  },
  [AgentRole.DATA_ETL]: {
    title: 'ETL Pipeline',
    description: 'Automates data extraction, transformation, and loading',
    icon: '🔄',
    color: '#FF9800',
    category: 'data',
    specialties: ['Data Extraction', 'Schema Mapping', 'Data Cleaning', 'Pipeline Automation'],
    difficulty: 'advanced',
    useCases: ['Data integration', 'Data migration', 'Warehouse loading']
  },
  [AgentRole.DATA_QUALITY]: {
    title: 'Data Quality',
    description: 'Monitors and ensures data quality across systems',
    icon: '✓',
    color: '#FF9800',
    category: 'data',
    specialties: ['Quality Checks', 'Anomaly Detection', 'Validation Rules', 'Alert Generation'],
    difficulty: 'intermediate',
    useCases: ['Data validation', 'Quality assurance', 'Compliance monitoring']
  },
  [AgentRole.DATA_VISUALIZATION]: {
    title: 'Visualization',
    description: 'Creates charts and dashboards from data automatically',
    icon: '📈',
    color: '#FF9800',
    category: 'data',
    specialties: ['Chart Generation', 'Dashboard Creation', 'Interactive Visualizations', 'Export Options'],
    difficulty: 'beginner',
    useCases: ['Reporting', 'Dashboard building', 'Presentation graphics']
  },
  [AgentRole.DATA_SQL_ASSISTANT]: {
    title: 'SQL Assistant',
    description: 'Converts natural language to SQL and explains queries',
    icon: '💾',
    color: '#FF9800',
    category: 'data',
    specialties: ['NL to SQL', 'Query Optimization', 'Schema Understanding', 'Result Explanation'],
    difficulty: 'beginner',
    useCases: ['Database queries', 'Report generation', 'Data exploration']
  },

  // Content Agents
  [AgentRole.CONTENT_CREATION]: {
    title: 'Content Writer',
    description: 'Creates blog posts, articles, and marketing content',
    icon: '✍️',
    color: '#E91E63',
    category: 'content',
    specialties: ['Article Writing', 'SEO Optimization', 'Tone Adaptation', 'Multi-format'],
    difficulty: 'beginner',
    useCases: ['Blog posts', 'Articles', 'Marketing copy']
  },
  [AgentRole.CONTENT_SOCIAL_MEDIA]: {
    title: 'Social Media',
    description: 'Creates and schedules social media content automatically',
    icon: '📱',
    color: '#E91E63',
    category: 'content',
    specialties: ['Post Creation', 'Scheduling', 'Hashtag Optimization', 'Engagement Tracking'],
    difficulty: 'beginner',
    useCases: ['Social posts', 'Content calendar', 'Engagement']
  },
  [AgentRole.CONTENT_EMAIL_MARKETING]: {
    title: 'Email Marketing',
    description: 'Drafts personalized email campaigns and newsletters',
    icon: '📨',
    color: '#E91E63',
    category: 'content',
    specialties: ['Email Writing', 'Personalization', 'A/B Testing', 'Campaign Automation'],
    difficulty: 'intermediate',
    useCases: ['Newsletters', 'Drip campaigns', 'Promotional emails']
  },
  [AgentRole.CONTENT_SEO]: {
    title: 'SEO Agent',
    description: 'Optimizes content for search engines and tracks rankings',
    icon: '🔎',
    color: '#E91E63',
    category: 'content',
    specialties: ['Keyword Research', 'Content Optimization', 'Rank Tracking', 'Competitor Analysis'],
    difficulty: 'intermediate',
    useCases: ['SEO optimization', 'Content audits', 'SERP monitoring']
  },
  [AgentRole.CONTENT_VIDEO_SCRIPT]: {
    title: 'Video Script',
    description: 'Creates scripts for videos, podcasts, and presentations',
    icon: '🎬',
    color: '#E91E63',
    category: 'content',
    specialties: ['Script Writing', 'Storyboarding', 'Format Adaptation', 'Hook Creation'],
    difficulty: 'intermediate',
    useCases: ['YouTube scripts', 'Podcast outlines', 'Presentation scripts']
  },

  // Web Automation Agents
  [AgentRole.WEB_SCRAPING]: {
    title: 'Web Scraper',
    description: 'Extracts data from websites automatically',
    icon: '🕷️',
    color: '#2196F3',
    category: 'web',
    specialties: ['Data Extraction', 'Structured Output', 'Schedule Scraping', 'Anti-bot Handling'],
    difficulty: 'intermediate',
    useCases: ['Data collection', 'Price monitoring', 'Content aggregation']
  },
  [AgentRole.WEB_AUTOMATION]: {
    title: 'Web Automation',
    description: 'Automates browser-based tasks and workflows',
    icon: '🤖',
    color: '#2196F3',
    category: 'web',
    specialties: ['Form Filling', 'Navigation', 'Data Entry', 'Screenshot Capture'],
    difficulty: 'intermediate',
    useCases: ['Task automation', 'Testing', 'Data entry']
  },
  [AgentRole.WEB_MONITOR]: {
    title: 'Website Monitor',
    description: 'Monitors websites for changes and updates',
    icon: '👁️',
    color: '#2196F3',
    category: 'web',
    specialties: ['Change Detection', 'Screenshot Comparison', 'Alert Notifications', 'History Tracking'],
    difficulty: 'beginner',
    useCases: ['Competitor monitoring', 'Content updates', 'Price changes']
  },
  [AgentRole.WEB_TESTING]: {
    title: 'Web Testing',
    description: 'Automates website testing and quality assurance',
    icon: '🧪',
    color: '#2196F3',
    category: 'web',
    specialties: ['UI Testing', 'Accessibility Checks', 'Performance Testing', 'Cross-browser Testing'],
    difficulty: 'advanced',
    useCases: ['QA automation', 'Regression testing', 'Accessibility audits']
  },
  [AgentRole.WEB_API_INTEGRATION]: {
    title: 'API Integration',
    description: 'Connects and orchestrates multiple APIs',
    icon: '🔗',
    color: '#2196F3',
    category: 'web',
    specialties: ['API Calls', 'Data Transformation', 'Error Handling', 'Rate Limiting'],
    difficulty: 'intermediate',
    useCases: ['API integration', 'Data sync', 'Workflow automation']
  },

  // Task & Workflow Agents
  [AgentRole.TASK_AUTOMATION]: {
    title: 'Task Automation',
    description: 'Orchestrate complex multi-step tasks and processes',
    icon: '⚡',
    color: '#00BCD4',
    category: 'workflow',
    specialties: ['Process Orchestration', 'Task Scheduling', 'Workflow Management'],
    difficulty: 'intermediate',
    useCases: ['Process automation', 'Task management', 'Workflow optimization']
  },
  [AgentRole.WORKFLOW_AUTOMATION]: {
    title: 'Workflow Automation',
    description: 'Automates business processes and workflows',
    icon: '⚙️',
    color: '#00BCD4',
    category: 'workflow',
    specialties: ['Process Automation', 'Task Routing', 'Approval Workflows', 'Integration'],
    difficulty: 'intermediate',
    useCases: ['Process automation', 'Workflow optimization', 'Task management']
  },
  [AgentRole.OPS_SCHEDULING]: {
    title: 'Scheduling Agent',
    description: 'Optimizes resource and staff scheduling',
    icon: '📆',
    color: '#00BCD4',
    category: 'workflow',
    specialties: ['Schedule Optimization', 'Conflict Resolution', 'Coverage Planning', 'PTO Management'],
    difficulty: 'intermediate',
    useCases: ['Staff scheduling', 'Resource allocation', 'Shift management']
  },

  // Communication Agents
  [AgentRole.EMAIL_AUTOMATION]: {
    title: 'Email Automation',
    description: 'Manage and automate email communications efficiently',
    icon: '📧',
    color: '#795548',
    category: 'communication',
    specialties: ['Email Campaigns', 'Response Automation', 'SMTP Integration'],
    difficulty: 'beginner',
    useCases: ['Inbox management', 'Email organization', 'Response drafting']
  },
  [AgentRole.MEETING_ASSISTANT]: {
    title: 'Meeting Assistant',
    description: 'Prepares for and summarizes meetings automatically',
    icon: '📝',
    color: '#795548',
    category: 'communication',
    specialties: ['Agenda Creation', 'Note Taking', 'Action Items', 'Follow-up Tracking'],
    difficulty: 'intermediate',
    useCases: ['Meeting prep', 'Note taking', 'Action tracking']
  },
  [AgentRole.PERSONAL_ASSISTANT]: {
    title: 'Personal Assistant',
    description: 'Your AI-powered personal productivity assistant',
    icon: '🤖',
    color: '#795548',
    category: 'communication',
    specialties: ['Task Management', 'Calendar Coordination', 'Email Triage', 'Reminders'],
    difficulty: 'beginner',
    useCases: ['Personal productivity', 'Task tracking', 'Schedule management']
  },

  // Document Agents
  [AgentRole.DOCUMENT_PROCESSING]: {
    title: 'Document Processing',
    description: 'Analyze, extract, and transform document content',
    icon: '📄',
    color: '#607D8B',
    category: 'documents',
    specialties: ['PDF Extraction', 'OCR Processing', 'Document Classification'],
    difficulty: 'intermediate',
    useCases: ['Document analysis', 'Data extraction', 'Content processing']
  },
  [AgentRole.CONTRACT_REVIEW]: {
    title: 'Contract Review',
    description: 'Analyzes contracts and highlights key terms and risks',
    icon: '📑',
    color: '#607D8B',
    category: 'documents',
    specialties: ['Clause Extraction', 'Risk Identification', 'Comparison', 'Redlining Suggestions'],
    difficulty: 'advanced',
    useCases: ['Contract review', 'Risk assessment', 'Due diligence']
  },
  [AgentRole.LEGAL_RESEARCH]: {
    title: 'Legal Research',
    description: 'Researches case law and legal precedents',
    icon: '⚖️',
    color: '#607D8B',
    category: 'documents',
    specialties: ['Case Search', 'Citation Analysis', 'Jurisdiction Mapping', 'Summary Generation'],
    difficulty: 'advanced',
    useCases: ['Legal research', 'Case analysis', 'Brief preparation']
  },

  // Custom
  [AgentRole.CUSTOM]: {
    title: 'Custom Agent',
    description: 'Define your own specialized agent role',
    icon: '🔧',
    color: '#9E9E9E',
    category: 'custom',
    specialties: ['Flexible', 'Customizable', 'Specialized'],
    difficulty: 'intermediate',
    useCases: ['Custom workflows', 'Specialized tasks', 'Unique requirements']
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

/**
 * Get agents by category
 * 
 * @param categoryId The category ID
 * @returns Array of agent roles in the category
 */
export function getAgentsByCategory(categoryId: string): AgentRole[] {
  const category = AGENT_CATEGORIES.find(c => c.id === categoryId);
  return category ? category.agents : [];
}

/**
 * Get all agent roles for a given difficulty level
 * 
 * @param difficulty The difficulty level
 * @returns Array of agent roles matching the difficulty
 */
export function getAgentsByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): AgentRole[] {
  return Object.entries(AGENT_ROLE_DESCRIPTIONS)
    .filter(([_, desc]) => desc.difficulty === difficulty)
    .map(([role]) => role as AgentRole);
}

/**
 * Search agents by keyword
 * 
 * @param keyword Search keyword
 * @returns Array of matching agent roles
 */
export function searchAgents(keyword: string): AgentRole[] {
  const lowercaseKeyword = keyword.toLowerCase();
  return Object.entries(AGENT_ROLE_DESCRIPTIONS)
    .filter(([_, desc]) =>
      desc.title.toLowerCase().includes(lowercaseKeyword) ||
      desc.description.toLowerCase().includes(lowercaseKeyword) ||
      desc.specialties.some(s => s.toLowerCase().includes(lowercaseKeyword)) ||
      desc.useCases.some(u => u.toLowerCase().includes(lowercaseKeyword))
    )
    .map(([role]) => role as AgentRole);
}
