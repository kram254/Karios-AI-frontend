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

async function apiRequest<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${getApiUrl()}/api/qa${path}`;
  const res = await fetch(url, { ...options, headers: { ...getHeaders(), ...(options.headers as Record<string, string> || {}) } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || err.error || res.statusText);
  }
  return res.json();
}

export interface QASession {
  session_id: string;
  target_url: string;
  tier: string;
  status: string;
  baseline_health_score: number | null;
  final_health_score: number | null;
  health_delta: number | null;
  total_issues_found: number;
  fixes_applied: number;
  fixes_verified: number;
  fixes_reverted: number;
  fixes_deferred: number;
  wtf_likelihood_pct: number;
  fix_count: number;
  stopped_by_wtf: boolean;
  current_phase: number;
  phase_description: string | null;
  started_at: string | null;
  completed_at: string | null;
  report_data?: any;
}

export interface QAIssue {
  issue_id: string;
  severity: string;
  status: string;
  title: string;
  description: string | null;
  page_url: string | null;
  element_ref: string | null;
  selector: string | null;
  flow_name: string | null;
  step_description: string | null;
  has_screenshot_before: boolean;
  has_screenshot_after: boolean;
  created_at: string | null;
}

export interface QAHealthScore {
  phase: string;
  score: number;
  max_score: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  cosmetic_count: number;
  console_error_count: number;
  network_failure_count: number;
  broken_link_count: number;
  measured_at: string | null;
}

export interface QAFix {
  fix_id: string;
  issue_id_ref: string | null;
  classification: string;
  description: string | null;
  file_count: number;
  fix_order: number;
  wtf_penalty_applied: number;
  has_screenshot_before: boolean;
  has_screenshot_after: boolean;
  applied_at: string | null;
}

export interface QAReport {
  success: boolean;
  session_id: string;
  target_url: string;
  tier: string;
  baseline_health_score: number | null;
  final_health_score: number | null;
  health_delta: number | null;
  total_issues_found: number;
  severity_breakdown: Record<string, number>;
  fixes_applied: number;
  fixes_verified: number;
  fixes_reverted: number;
  fixes_deferred: number;
  wtf_likelihood: {
    pct: number;
    revert_count: number;
    large_fix_count: number;
    fix_count: number;
    should_stop: boolean;
    threshold: number;
    max_fixes: number;
  };
  stopped_by_wtf: boolean;
  issues: Array<{
    issue_id: string;
    severity: string;
    status: string;
    title: string;
    description: string | null;
    page_url: string | null;
    flow_name: string | null;
  }>;
  fixes: Array<{
    fix_id: string;
    classification: string;
    description: string | null;
    file_count: number;
    fix_order: number;
  }>;
  health_scores: Array<{
    phase: string;
    score: number;
    measured_at: string | null;
  }>;
}

export interface DaemonSession {
  session_id: string;
  is_running: boolean;
  started_at: number | null;
  idle_seconds: number;
  url: string | null;
  ref_count: number;
}

export const qaService = {
  createSession: (data: { target_url: string; tier?: string; task_id?: string; chat_id?: string; config?: Record<string, any> }) =>
    apiRequest<QASession>('/sessions', { method: 'POST', body: JSON.stringify(data) }),

  listSessions: (limit: number = 50) =>
    apiRequest<QASession[]>(`/sessions?limit=${limit}`),

  getSession: (sessionId: string) =>
    apiRequest<QASession>(`/sessions/${sessionId}`),

  getIssues: (sessionId: string) =>
    apiRequest<QAIssue[]>(`/sessions/${sessionId}/issues`),

  getHealthScores: (sessionId: string) =>
    apiRequest<QAHealthScore[]>(`/sessions/${sessionId}/health`),

  getFixes: (sessionId: string) =>
    apiRequest<QAFix[]>(`/sessions/${sessionId}/fixes`),

  getReport: (sessionId: string) =>
    apiRequest<QAReport>(`/sessions/${sessionId}/report`),

  getIssueScreenshot: (sessionId: string, issueId: string, phase: 'before' | 'after' = 'before') =>
    apiRequest<{ screenshot_b64: string | null; mime?: string }>(`/sessions/${sessionId}/issues/${issueId}/screenshot?phase=${phase}`),

  listDaemonSessions: () =>
    apiRequest<DaemonSession[]>('/daemon/sessions'),

  stopDaemonSession: (sessionId: string) =>
    apiRequest<{ success: boolean }>(`/daemon/sessions/${sessionId}`, { method: 'DELETE' }),
};

export default qaService;
