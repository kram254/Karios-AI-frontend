import { useMemo } from "react";

export interface ToolCardData {
  id: string;
  stepNum: number;
  toolName: string;
  status: 'running' | 'completed' | 'failed';
  description: string;
  resultContent: string;
  details?: Record<string, any>;
  retryCount?: number;
  isBrowserTool?: boolean;
  timestamp: string;
}

interface AgentThought {
  thought?: string;
  timestamp: string;
  metadata?: {
    step_number?: number;
    tool?: string;
    status?: string;
    success?: boolean;
    details?: any;
  };
}

interface StepProgress {
  step_number?: number;
  tool_name?: string;
  status?: string;
  description?: string;
  metadata?: any;
  timestamp: string;
}

export function useProgressiveToolCards(
  agentThoughts: AgentThought[],
  stepProgress: StepProgress[]
): ToolCardData[] {
  return useMemo(() => {
    const stepMap = new Map<number, {
      toolName: string;
      status: 'running' | 'completed' | 'failed';
      description: string;
      resultContent: string;
      details?: Record<string, any>;
      retryCount?: number;
      isBrowserTool?: boolean;
      timestamp: string;
    }>();

    const parseDetails = (raw: any): Record<string, any> | undefined => {
      if (!raw) return undefined;
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed as Record<string, any>;
          }
        } catch {}
        return undefined;
      }
      if (typeof raw === 'object' && !Array.isArray(raw)) {
        return raw as Record<string, any>;
      }
      return undefined;
    };

    for (const t of agentThoughts) {
      const stepNum = t.metadata?.step_number;
      const tool = t.metadata?.tool;
      if (!stepNum || !tool) continue;

      const isCompleted = t.metadata?.status === 'completed' || t.metadata?.success === true;
      const isFailed = t.metadata?.status === 'failed';
      const isSucceeded = typeof t.thought === 'string' && t.thought.startsWith('Step ') && t.thought.includes('succeeded');
      const detailsFromMeta = parseDetails(t.metadata?.details);

      if (isSucceeded && !isCompleted) continue;

      const existing = stepMap.get(stepNum);

      if (!existing) {
        const desc = (t.thought || '').replace(/^Starting step \d+\/\d+:\s*/i, '').trim();
        const resultMatch = (t.thought || '').match(/^[Γ£ôΓ£ù]?\s*Completed step \d+\/\d+:?\s*[^.]*\.\s*([\s\S]*)/);
        stepMap.set(stepNum, {
          toolName: tool,
          status: isCompleted ? 'completed' : isFailed ? 'failed' : 'running',
          description: desc,
          resultContent: isCompleted && resultMatch ? resultMatch[1].trim() : '',
          details: detailsFromMeta,
          isBrowserTool: ['gemini', 'browser', 'web_automation', 'stagehand', 'claude'].some(k => tool.toLowerCase().includes(k)),
          timestamp: t.timestamp
        });
      } else {
        if (detailsFromMeta) {
          existing.details = detailsFromMeta;
        }
        if (isCompleted) {
          existing.status = 'completed';
          const resultMatch = (t.thought || '').match(/^[Γ£ôΓ£ù]?\s*Completed step \d+\/\d+:?\s*[^.]*\.\s*([\s\S]*)/);
          if (resultMatch) existing.resultContent = resultMatch[1].trim();
        } else if (isFailed) {
          existing.status = 'failed';
        }
      }
    }

    for (const step of stepProgress) {
      const stepNum = step.step_number;
      if (!stepNum) continue;
      
      const existing = stepMap.get(stepNum);
      if (!existing && step.tool_name) {
        stepMap.set(stepNum, {
          toolName: step.tool_name,
          status: step.status === 'completed' ? 'completed' : step.status === 'failed' ? 'failed' : 'running',
          description: step.description || '',
          resultContent: '',
          details: step.metadata ? parseDetails(step.metadata) : undefined,
          retryCount: step.metadata?.retry_index ?? step.metadata?.retry_count ?? 0,
          isBrowserTool: ['gemini', 'browser', 'web_automation', 'stagehand', 'claude'].some(k => (step.tool_name || '').toLowerCase().includes(k)),
          timestamp: step.timestamp
        });
      } else if (existing) {
        if (step.status === 'completed') {
          existing.status = 'completed';
        } else if (step.status === 'failed') {
          existing.status = 'failed';
        }
        if (step.metadata) {
          const details = parseDetails(step.metadata);
          if (details) {
            existing.details = details;
          }
        }
      }
    }

    return Array.from(stepMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([stepNum, data]) => ({
        id: `tool-step-${stepNum}`,
        stepNum,
        toolName: data.toolName,
        status: data.status,
        description: data.description,
        resultContent: data.resultContent,
        details: data.details,
        retryCount: data.retryCount,
        isBrowserTool: data.isBrowserTool,
        timestamp: data.timestamp
      }));
  }, [agentThoughts, stepProgress]);
}
