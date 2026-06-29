export type HyperAgentStatus = 'idle' | 'working' | 'learning' | 'deployed' | 'maintenance';

export type AutonomyLevel = 'assisted' | 'semi_autonomous' | 'full_autonomous';

export type DeploymentType = 'slack' | 'email' | 'telegram' | 'web_widget' | 'api_endpoint' | 'scheduled';

export type HyperAgentRole =
  | 'content_marketer'
  | 'market_researcher'
  | 'customer_email_responder'
  | 'sales_development_rep'
  | 'data_analyst'
  | 'code_reviewer'
  | 'product_manager'
  | 'customer_success_manager'
  | 'social_media_manager'
  | 'research_assistant'
  | 'executive_assistant'
  | 'custom';

export interface HyperAgentPersona {
  voice: string;
  communication_style: 'colloquial' | 'formal' | 'technical' | 'friendly';
  expertise: string[];
  values: string[];
  tone_examples: string[];
}

export interface TokenBudget {
  daily_limit: number;
  monthly_limit: number;
  alert_threshold: number;
  hard_stop: boolean;
  current_usage: number;
}

export interface PinnedSkill {
  skill_id: string;
  name: string;
  version: number;
  config: Record<string, any>;
  enabled: boolean;
  last_used?: string;
  performance_score: number;
}

export interface HyperAgentIdentity {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  owner_id: number;
  role: HyperAgentRole;
  status: HyperAgentStatus;
  autonomy_level: AutonomyLevel;
  persona?: HyperAgentPersona;
  skills: PinnedSkill[];
  token_budget?: TokenBudget;
  version: number;
  parent_agent_id?: string;
  fork_count: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface DeploymentConfig {
  alwaysOn?: boolean;
  respondToMentions?: boolean;
  respondToDMs?: boolean;
  autoChimeIn?: boolean;
  monitorInbox?: string;
  autoRespond?: boolean;
  draftOnly?: boolean;
  confidenceThreshold?: number;
  cron?: string;
  timezone?: string;
  checkInterval?: number;
  dataSources?: string[];
}

export interface AgentDeployment {
  id: number;
  agent_id: number;
  deployment_type: DeploymentType;
  status: 'configured' | 'deployed' | 'paused';
  config?: DeploymentConfig;
  created_at: string;
  updated_at: string;
  last_active_at?: string;
}

export type HyperSkillCategory =
  | 'general'
  | 'performance'
  | 'security'
  | 'ui'
  | 'api'
  | 'testing'
  | 'content'
  | 'research'
  | 'automation';

export interface ResearchPhase {
  sources: string[];
  researchSummary: string;
  createdAt: string;
  researchCost: number;
}

export interface SkillComponents {
  promptTemplate: string;
  toolDefinitions: string[];
  knowledgeBase?: string[];
  exampleConversations: Array<{ input: string; output: string }>;
  constraints: string[];
}

export interface SkillImprovement {
  id: number;
  skill_id: number;
  agent_id?: number;
  improvement_type: string;
  description: string;
  trigger_pattern?: string;
  before_state?: Record<string, any>;
  after_state?: Record<string, any>;
  expected_improvement: number;
  actual_improvement?: number;
  status: 'pending' | 'applied' | 'rejected' | 'testing';
  applied_at?: string;
  created_at: string;
}

export interface HyperSkill {
  id: number;
  uuid: string;
  name: string;
  description: string;
  category: HyperSkillCategory;
  research_phase?: ResearchPhase;
  components?: SkillComponents;
  version: number;
  improvements: SkillImprovement[];
  total_uses: number;
  avg_rubric_score: number;
  last_used?: string;
  pin_config?: {
    compatibleRoles: HyperAgentRole[];
    requiredTools: string[];
  };
  created_by: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export type RubricScoringMethod = 'llm_judge' | 'human' | 'hybrid';

export interface RubricDimension {
  name: string;
  description: string;
  weight: number;
  criteria: string[];
  example_good: string;
  example_bad: string;
}

export interface EvaluationRubric {
  id: number;
  uuid: string;
  name: string;
  description: string;
  agent_id?: number;
  skill_id?: number;
  dimensions: RubricDimension[];
  scoring_method: RubricScoringMethod;
  judge_model: string;
  auto_trigger: boolean;
  on_low_score_action: string;
  on_high_score_action: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface RubricScore {
  id: number;
  rubric_id: number;
  agent_id: number;
  overall_score: number;
  dimension_scores: Record<string, number>;
  feedback: string;
  evaluated_output_id: string;
  evaluated_output_type: string;
  cost: number;
  timestamp: string;
}

export interface AgentMemoryCluster {
  id: number;
  agent_id: number;
  theme: string;
  memories: string[];
  embedding?: number[];
  summary: string;
  formed_at: string;
  last_accessed: string;
  access_count: number;
}

export interface ThreadToAgentConversion {
  id: number;
  thread_id: string;
  research_extraction?: {
    discoveredIntent: string;
    discoveredTools: string[];
    discoveredKnowledge: string[];
    conversationPattern: string;
    successfulOutputs: Array<{ type: string; content: any }>;
  };
  generated_agent_id?: number;
  generated_agent_uuid?: string;
  deployment_schedule?: string;
  deployment_live_mode: boolean;
  deployment_triggers?: string[];
  status: 'extracting' | 'distilling' | 'creating' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
}

export interface CreateAgentRequest {
  name: string;
  description?: string;
  role: HyperAgentRole;
  autonomy_level: AutonomyLevel;
  persona_voice: string;
  persona_communication_style: 'colloquial' | 'formal' | 'technical' | 'friendly';
  persona_expertise: string[];
  persona_values: string[];
  daily_token_limit: number;
  monthly_token_limit: number;
}

export interface UpdateAgentRequest {
  name?: string;
  description?: string;
  role?: HyperAgentRole;
  autonomy_level?: AutonomyLevel;
  status?: HyperAgentStatus;
}

export interface CreateSkillRequest {
  name: string;
  description: string;
  category: HyperSkillCategory;
  research_sources: string[];
  prompt_template?: string;
  tools: string[];
  examples: Array<{ input: string; output: string }>;
}

export interface CreateRubricRequest {
  name: string;
  description: string;
  dimensions: RubricDimension[];
  agent_id?: number;
  skill_id?: number;
  scoring_method: RubricScoringMethod;
  judge_model: string;
  auto_trigger: boolean;
  on_low_score_action: string;
  on_high_score_action: string;
}

export interface RecordScoreRequest {
  overall_score: number;
  dimension_scores: Record<string, number>;
  feedback: string;
  output_id: string;
  output_type: string;
  cost: number;
}

export interface FleetStatus {
  total_agents: number;
  active_now: number;
  idle: number;
  learning: number;
  deployed: number;
  avg_rubric_score: number;
  total_token_usage_24h: number;
  estimated_human_hours_saved: number;
}

export interface RoleDistribution {
  role: HyperAgentRole;
  count: number;
  avg_performance: number;
  top_performer?: {
    agent_id: number;
    name: string;
    avg_performance: number;
  };
}

export interface AgentActivity {
  type: 'improvement_suggested' | 'evaluation_completed' | 'started_task' | 'completed_task' | 'deployed';
  agent_id: number;
  description: string;
  timestamp: string;
  score?: number;
}

export interface FleetOverview {
  summary: FleetStatus;
  role_distribution: Record<string, number>;
  autonomy_distribution: Record<string, number>;
  deployment_distribution: Record<string, number>;
  top_performers: Array<{
    agent_id: number;
    agent_uuid: string;
    name: string;
    role: string;
    avg_performance: number;
    skills_count: number;
  }>;
  recent_activity: AgentActivity[];
}

export interface ModelDowngradeSuggestion {
  current_model: string;
  suggested_model: string;
  avg_score: number;
  consecutive_runs: number;
  estimated_savings: string;
  recommendation: string;
}

export interface DeploymentHealth {
  total_deployments: number;
  healthy: number;
  stale: number;
  inactive: number;
  health_percentage: number;
}

export interface OptimizationSuggestion {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggested_action: string;
  affected_agents?: number[];
}
