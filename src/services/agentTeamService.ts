const getApiUrl = (): string => {
  const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:8000';
  return backendUrl.replace(/\/+$/, '');
};

const getHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const token = localStorage.getItem('token');
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch (_) {}
  return headers;
};

const API_BASE_URL = String((import.meta as any).env?.VITE_BACKEND_URL || '').replace(/\/$/, '');

const getAuthHeaders = () => {
  const headers: Record<string, string> = {};
  try {
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  } catch {}
  return headers;
};

async function apiRequest<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${getApiUrl()}/api/teams${path}`;
  const res = await fetch(url, { ...options, headers: { ...getHeaders(), ...(options.headers as Record<string, string> || {}) } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || err.error || res.statusText);
  }
  return res.json();
}

export interface Team {
  id: number;
  team_id: string;
  name: string;
  description: string | null;
  status: string;
  monthly_budget_cents: number | null;
  spent_monthly_cents: number;
  total_spent_cents: number;
  template_id: string | null;
  settings: any;
  created_at: string | null;
  updated_at: string | null;
}

export interface TeamMember {
  id: number;
  member_id: string;
  name: string;
  role: string;
  status: string;
  reports_to_id: number | null;
  llm_provider: string | null;
  llm_model: string | null;
  capabilities: string[] | null;
  heartbeat_interval_seconds: number;
  monthly_budget_cents: number | null;
  spent_monthly_cents: number;
  total_tokens_used: number;
  skills: string[] | null;
  tools_enabled: string[] | null;
  integrations: any;
  knowledge_base_ids: number[] | null;
  agent_config: any;
  is_full_agent: boolean;
  last_heartbeat_at: string | null;
  created_at: string | null;
}

export interface TeamGoal {
  id: number;
  goal_id: string;
  title: string;
  description: string | null;
  level: string;
  status: string;
  progress_pct: number;
  parent_goal_id: number | null;
  owner_member_id: number | null;
  target_date: string | null;
  success_criteria: string[] | null;
  created_at: string | null;
}

export interface TeamTask {
  id: number;
  task_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignee_id: number | null;
  goal_id: number | null;
  parent_task_id: number | null;
  checked_out_by: number | null;
  quality_score: number | null;
  labels: string[] | null;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  pipeline_task_id: string | null;
  created_at: string | null;
  completed_at: string | null;
}

export interface TeamApproval {
  id: number;
  approval_id: string;
  approval_type: string;
  status: string;
  requester_member_id: number | null;
  subject_member_id: number | null;
  payload: any;
  resolution_notes: string | null;
  resolved_at: string | null;
  created_at: string | null;
}

export interface TeamTemplate {
  template_id: string;
  name: string;
  description: string;
  member_count: number;
  roles: string[];
  monthly_budget_cents: number | null;
}

export interface OrgChartNode {
  id: number;
  member_id: string;
  name: string;
  role: string;
  status: string;
  children: OrgChartNode[];
}

export interface BudgetOverview {
  team_id: string;
  monthly_budget_cents: number;
  spent_monthly_cents: number;
  total_spent_cents: number;
  budget_utilization_pct: number;
  policies: any[];
  member_spend: any[];
}

export interface TeamSummary {
  id: number;
  team_id: string;
  name: string;
  description: string | null;
  status: string;
  member_count: number;
  active_members: number;
  task_count: number;
  tasks_in_progress: number;
  tasks_done: number;
  goal_count: number;
  pending_approvals: number;
  spent_monthly_cents: number;
  monthly_budget_cents: number | null;
  created_at: string | null;
}

export interface AgentRole {
  role: string;
  description: string;
  default_tools: string[];
  restricted_tools: string[];
  requires_approval_for: string[];
  max_budget_per_task: number;
  reports_to: string | null;
}

export interface AgentWorkspace {
  workspace_id: string;
  agent_id: string;
  agent_role: string;
  agent_name: string;
  parent_workspace_id: string | null;
  created_at: string;
  memory_keys: string[];
  tool_permissions: string[];
  budget_limit: number | null;
  budget_used: number;
  budget_remaining: number | null;
  active_tasks: string[];
  completed_tasks_count: number;
  is_terminated: boolean;
}

export interface AuditLogEntry {
  timestamp: string;
  type: string;
  details?: Record<string, any>;
  task_id?: string;
  workspace_id?: string;
  amount?: number;
  budget_after?: number;
}

export interface ToolPermissionCheck {
  tool: string;
  role_allowed: boolean;
  workspace_allowed: boolean;
  allowed: boolean;
}

export interface TeamIssue {
  id: number;
  issue_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignee_id: number | null;
  reporter_member_id: number | null;
  labels: string[] | null;
  due_date: string | null;
  parent_issue_id: number | null;
  goal_id: number | null;
  resolution: string | null;
  created_at: string | null;
  updated_at: string | null;
  closed_at: string | null;
}

export interface TeamSkill {
  id: number;
  skill_id: string;
  name: string;
  description: string | null;
  content: string | null;
  version: number;
  scope: string;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface TeamPlugin {
  id: number;
  plugin_id: string;
  name: string;
  description: string | null;
  plugin_type: string;
  config: any;
  is_active: boolean;
  version: string | null;
  tools_provided: string[] | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ExecutionWorkspace {
  id: number;
  workspace_id: string;
  member_id: number;
  task_id: number | null;
  status: string;
  tool_permissions: string[] | null;
  budget_limit_cents: number | null;
  spent_cents: number;
  audit_log: any[];
  created_at: string | null;
  finished_at: string | null;
}

export interface BudgetCheckResult {
  allowed: boolean;
  warning?: boolean;
  reason?: string;
  budget_id?: number;
  limit?: number;
  current?: number;
}

class AgentTeamServiceClass {
  async getRoleDefinitions(): Promise<AgentRole[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/teams/roles/definitions`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch role definitions');
      const data = await response.json();
      return data.roles || [];
    } catch (error) {
      console.error('Error fetching role definitions:', error);
      return [];
    }
  }

  async getMemberWorkspace(teamId: number, memberId: number): Promise<AgentWorkspace | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/members/${memberId}/workspace`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch workspace');
      const data = await response.json();
      return data.workspace || null;
    } catch (error) {
      console.error('Error fetching workspace:', error);
      return null;
    }
  }

  async getMemberAuditLog(teamId: number, memberId: number, limit: number = 100): Promise<AuditLogEntry[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/teams/${teamId}/members/${memberId}/audit-log?limit=${limit}`,
        { headers: getAuthHeaders() }
      );
      if (!response.ok) throw new Error('Failed to fetch audit log');
      const data = await response.json();
      return data.audit_log || [];
    } catch (error) {
      console.error('Error fetching audit log:', error);
      return [];
    }
  }

  async checkToolPermission(teamId: number, memberId: number, toolName: string): Promise<ToolPermissionCheck | null> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/teams/${teamId}/members/${memberId}/check-tool?tool_name=${encodeURIComponent(toolName)}`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
        }
      );
      if (!response.ok) throw new Error('Failed to check tool permission');
      return await response.json();
    } catch (error) {
      console.error('Error checking tool permission:', error);
      return null;
    }
  }

  getRoleColor(role: string): string {
    const colors: Record<string, string> = {
      ceo: '#f59e0b',
      cto: '#3b82f6',
      cmo: '#ec4899',
      cfo: '#10b981',
      engineer: '#8b5cf6',
      designer: '#f97316',
      pm: '#06b6d4',
      qa: '#ef4444',
      devops: '#6366f1',
      researcher: '#14b8a6',
      sales: '#84cc16',
      support: '#a855f7',
      general: '#6b7280',
    };
    return colors[role.toLowerCase()] || '#6b7280';
  }

  getRoleIcon(role: string): string {
    const icons: Record<string, string> = {
      ceo: 'crown',
      cto: 'cpu',
      cmo: 'megaphone',
      cfo: 'calculator',
      engineer: 'code',
      designer: 'palette',
      pm: 'clipboard',
      qa: 'check-circle',
      devops: 'server',
      researcher: 'search',
      sales: 'trending-up',
      support: 'headphones',
      general: 'user',
    };
    return icons[role.toLowerCase()] || 'user';
  }

  formatBudget(cents: number | null): string {
    if (cents === null || cents === undefined) return 'Unlimited';
    const dollars = cents / 100;
    return `$${dollars.toFixed(2)}`;
  }
}

const agentTeamServiceClass = new AgentTeamServiceClass();

export const agentTeamService = {
  async listTeams(userId?: number, orgId?: number): Promise<Team[]> {
    const params = new URLSearchParams();
    if (userId) params.set('user_id', String(userId));
    if (orgId) params.set('org_id', String(orgId));
    const qs = params.toString() ? `?${params}` : '';
    const data = await apiRequest<{ teams: Team[] }>(`${qs}`);
    return data.teams;
  },

  async createTeam(payload: { name: string; description?: string; template_id?: string; monthly_budget_cents?: number; settings?: any }): Promise<Team> {
    const data = await apiRequest<{ team: Team }>('', { method: 'POST', body: JSON.stringify(payload) });
    return data.team;
  },

  async getTeam(teamId: number): Promise<{ team: Team; summary: TeamSummary }> {
    return apiRequest(`/${teamId}`);
  },

  async updateTeam(teamId: number, payload: Partial<{ name: string; description: string; status: string; monthly_budget_cents: number }>): Promise<Team> {
    const data = await apiRequest<{ team: Team }>(`/${teamId}`, { method: 'PATCH', body: JSON.stringify(payload) });
    return data.team;
  },

  async deleteTeam(teamId: number): Promise<void> {
    await apiRequest(`/${teamId}`, { method: 'DELETE' });
  },

  async listTemplates(): Promise<TeamTemplate[]> {
    const data = await apiRequest<{ templates: TeamTemplate[] }>('/templates');
    return data.templates;
  },

  async createFromTemplate(templateId: string, name?: string, monthlyBudgetCents?: number): Promise<any> {
    return apiRequest('/from-template', { method: 'POST', body: JSON.stringify({ template_id: templateId, name, monthly_budget_cents: monthlyBudgetCents }) });
  },

  async listMembers(teamId: number): Promise<TeamMember[]> {
    const data = await apiRequest<{ members: TeamMember[] }>(`/${teamId}/members`);
    return data.members;
  },

  async hireMember(teamId: number, payload: { name: string; role?: string; reports_to_id?: number; system_prompt?: string; llm_provider?: string; llm_model?: string; llm_config?: any; capabilities?: string[]; monthly_budget_cents?: number }): Promise<TeamMember> {
    const data = await apiRequest<{ member: TeamMember }>(`/${teamId}/members`, { method: 'POST', body: JSON.stringify(payload) });
    return data.member;
  },

  async updateMember(teamId: number, memberId: number, payload: Partial<TeamMember>): Promise<TeamMember> {
    const data = await apiRequest<{ member: TeamMember }>(`/${teamId}/members/${memberId}`, { method: 'PATCH', body: JSON.stringify(payload) });
    return data.member;
  },

  async removeMember(teamId: number, memberId: number): Promise<void> {
    await apiRequest(`/${teamId}/members/${memberId}`, { method: 'DELETE' });
  },

  async listGoals(teamId: number): Promise<TeamGoal[]> {
    const data = await apiRequest<{ goals: TeamGoal[] }>(`/${teamId}/goals`);
    return data.goals;
  },

  async createGoal(teamId: number, payload: { title: string; description?: string; level?: string; parent_goal_id?: number; owner_member_id?: number; success_criteria?: string[] }): Promise<TeamGoal> {
    const data = await apiRequest<{ goal: TeamGoal }>(`/${teamId}/goals`, { method: 'POST', body: JSON.stringify(payload) });
    return data.goal;
  },

  async updateGoal(teamId: number, goalId: number, payload: Partial<TeamGoal>): Promise<TeamGoal> {
    const data = await apiRequest<{ goal: TeamGoal }>(`/${teamId}/goals/${goalId}`, { method: 'PATCH', body: JSON.stringify(payload) });
    return data.goal;
  },

  async listTasks(teamId: number, status?: string, assigneeId?: number): Promise<TeamTask[]> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (assigneeId) params.set('assignee_id', String(assigneeId));
    const qs = params.toString() ? `?${params}` : '';
    const data = await apiRequest<{ tasks: TeamTask[] }>(`/${teamId}/tasks${qs}`);
    return data.tasks;
  },

  async createTask(teamId: number, payload: { title: string; description?: string; priority?: string; assignee_id?: number; goal_id?: number; labels?: string[]; estimated_minutes?: number }): Promise<TeamTask> {
    const data = await apiRequest<{ task: TeamTask }>(`/${teamId}/tasks`, { method: 'POST', body: JSON.stringify(payload) });
    return data.task;
  },

  async updateTask(teamId: number, taskId: number, payload: Partial<TeamTask>): Promise<TeamTask> {
    const data = await apiRequest<{ task: TeamTask }>(`/${teamId}/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(payload) });
    return data.task;
  },

  async addTaskComment(teamId: number, taskId: number, content: string, authorName?: string): Promise<any> {
    return apiRequest(`/${teamId}/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify({ content, author_name: authorName }) });
  },

  async getBudgetOverview(teamId: number): Promise<BudgetOverview> {
    return apiRequest(`/${teamId}/budgets`);
  },

  async createBudget(teamId: number, payload: { limit_cents: number; scope?: string; threshold_type?: string; warning_pct?: number }): Promise<any> {
    return apiRequest(`/${teamId}/budgets`, { method: 'POST', body: JSON.stringify(payload) });
  },

  async listApprovals(teamId: number, status?: string): Promise<TeamApproval[]> {
    const qs = status ? `?status=${status}` : '';
    const data = await apiRequest<{ approvals: TeamApproval[] }>(`/${teamId}/approvals${qs}`);
    return data.approvals;
  },

  async resolveApproval(teamId: number, approvalId: number, approved: boolean, notes?: string): Promise<TeamApproval> {
    const data = await apiRequest<{ approval: TeamApproval }>(`/${teamId}/approvals/${approvalId}/resolve`, { method: 'POST', body: JSON.stringify({ approved, notes }) });
    return data.approval;
  },

  async getOrgChart(teamId: number): Promise<OrgChartNode[]> {
    const data = await apiRequest<{ org_chart: OrgChartNode[] }>(`/${teamId}/org-chart`);
    return data.org_chart;
  },

  async executeGoal(teamId: number, goalText: string, chatId?: string, context?: any): Promise<any> {
    return apiRequest(`/${teamId}/execute`, { method: 'POST', body: JSON.stringify({ goal_text: goalText, chat_id: chatId, context }) });
  },

  async runHeartbeat(teamId: number, memberId: number, invocationSource?: string, chatId?: string): Promise<any> {
    return apiRequest(`/${teamId}/members/${memberId}/heartbeat`, { method: 'POST', body: JSON.stringify({ invocation_source: invocationSource || 'on_demand', chat_id: chatId }) });
  },

  async listBudgetIncidents(teamId: number, resolved?: boolean): Promise<any[]> {
    const qs = resolved !== undefined ? `?resolved=${resolved}` : '';
    const data = await apiRequest<{ incidents: any[] }>(`/${teamId}/budget-incidents${qs}`);
    return data.incidents;
  },

  async getRoleDefinitions(): Promise<AgentRole[]> {
    return agentTeamServiceClass.getRoleDefinitions();
  },

  async getMemberWorkspace(teamId: number, memberId: number): Promise<AgentWorkspace | null> {
    return agentTeamServiceClass.getMemberWorkspace(teamId, memberId);
  },

  async getMemberAuditLog(teamId: number, memberId: number, limit: number = 100): Promise<AuditLogEntry[]> {
    return agentTeamServiceClass.getMemberAuditLog(teamId, memberId, limit);
  },

  async checkToolPermission(teamId: number, memberId: number, toolName: string): Promise<ToolPermissionCheck | null> {
    return agentTeamServiceClass.checkToolPermission(teamId, memberId, toolName);
  },

  getRoleColor(role: string): string {
    return agentTeamServiceClass.getRoleColor(role);
  },

  getRoleIcon(role: string): string {
    return agentTeamServiceClass.getRoleIcon(role);
  },

  formatBudget(cents: number | null): string {
    return agentTeamServiceClass.formatBudget(cents);
  },

  async listIssues(teamId: number, status?: string): Promise<TeamIssue[]> {
    const qs = status ? `?status=${status}` : '';
    const data = await apiRequest<{ issues: TeamIssue[] }>(`/${teamId}/issues${qs}`);
    return data.issues;
  },

  async createIssue(teamId: number, payload: { title: string; description?: string; priority?: string; assignee_id?: number; labels?: string[]; due_date?: string; goal_id?: number }): Promise<TeamIssue> {
    const data = await apiRequest<{ issue: TeamIssue }>(`/${teamId}/issues`, { method: 'POST', body: JSON.stringify(payload) });
    return data.issue;
  },

  async getIssue(teamId: number, issueId: number): Promise<TeamIssue> {
    const data = await apiRequest<{ issue: TeamIssue }>(`/${teamId}/issues/${issueId}`);
    return data.issue;
  },

  async updateIssue(teamId: number, issueId: number, payload: Partial<TeamIssue>): Promise<TeamIssue> {
    const data = await apiRequest<{ issue: TeamIssue }>(`/${teamId}/issues/${issueId}`, { method: 'PATCH', body: JSON.stringify(payload) });
    return data.issue;
  },

  async listSkills(teamId: number): Promise<TeamSkill[]> {
    const data = await apiRequest<{ skills: TeamSkill[] }>(`/${teamId}/skills`);
    return data.skills;
  },

  async createSkill(teamId: number, payload: { name: string; description?: string; content?: string; scope?: string }): Promise<TeamSkill> {
    const data = await apiRequest<{ skill: TeamSkill }>(`/${teamId}/skills`, { method: 'POST', body: JSON.stringify(payload) });
    return data.skill;
  },

  async updateSkill(teamId: number, skillId: number, payload: Partial<TeamSkill>): Promise<TeamSkill> {
    const data = await apiRequest<{ skill: TeamSkill }>(`/${teamId}/skills/${skillId}`, { method: 'PATCH', body: JSON.stringify(payload) });
    return data.skill;
  },

  async listPlugins(teamId: number): Promise<TeamPlugin[]> {
    const data = await apiRequest<{ plugins: TeamPlugin[] }>(`/${teamId}/plugins`);
    return data.plugins;
  },

  async createPlugin(teamId: number, payload: { name: string; description?: string; plugin_type?: string; config?: any; version?: string; tools_provided?: string[] }): Promise<TeamPlugin> {
    const data = await apiRequest<{ plugin: TeamPlugin }>(`/${teamId}/plugins`, { method: 'POST', body: JSON.stringify(payload) });
    return data.plugin;
  },

  async updatePlugin(teamId: number, pluginId: number, payload: Partial<TeamPlugin>): Promise<TeamPlugin> {
    const data = await apiRequest<{ plugin: TeamPlugin }>(`/${teamId}/plugins/${pluginId}`, { method: 'PATCH', body: JSON.stringify(payload) });
    return data.plugin;
  },

  async exportTeam(teamId: number): Promise<any> {
    return apiRequest(`/${teamId}/export`);
  },

  async importTeam(data: any, userId?: number, orgId?: number): Promise<any> {
    return apiRequest('/import', { method: 'POST', body: JSON.stringify({ data, user_id: userId, org_id: orgId }) });
  },

  async checkBudget(teamId: number, memberId?: number, amountCents?: number): Promise<BudgetCheckResult> {
    return apiRequest(`/${teamId}/check-budget`, { method: 'POST', body: JSON.stringify({ member_id: memberId, amount_cents: amountCents || 0 }) });
  },

  async recordCost(teamId: number, payload: { member_id?: number; cost_cents: number; tokens_used?: number; model_name?: string; operation?: string; task_id?: number }): Promise<void> {
    await apiRequest(`/${teamId}/cost-events`, { method: 'POST', body: JSON.stringify(payload) });
  },

  async listExecutionWorkspaces(teamId: number, memberId?: number): Promise<ExecutionWorkspace[]> {
    const qs = memberId ? `?member_id=${memberId}` : '';
    const data = await apiRequest<{ workspaces: ExecutionWorkspace[] }>(`/${teamId}/execution-workspaces${qs}`);
    return data.workspaces;
  },
};

export default agentTeamService;
