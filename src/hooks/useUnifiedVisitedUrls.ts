import { useMemo } from "react";

export interface VisitedUrl {
  url: string;
  title: string;
  status: 'visiting' | 'extracting' | 'complete' | 'error';
  timestamp?: string;
}

interface AccessedWebsite {
  url?: string;
  title?: string;
}

interface StepProgress {
  status?: string;
  description?: string;
  metadata?: any;
  timestamp: string;
}

interface ToolCard {
  details?: Record<string, any>;
  status: 'running' | 'completed' | 'failed';
  toolName: string;
  description: string;
  timestamp: string;
}

interface AgentThought {
  thought?: string;
  timestamp: string;
  metadata?: any;
}

interface AutomationLog {
  message?: string;
  type?: string;
  timestamp?: string;
}

export function useUnifiedVisitedUrls(
  accessedWebsites: AccessedWebsite[],
  stepProgress: StepProgress[],
  progressiveToolCards: ToolCard[],
  agentThoughts: AgentThought[],
  automationWsLogs: AutomationLog[],
  automationStreamUrl: string
): VisitedUrl[] {
  return useMemo(() => {
    const out: VisitedUrl[] = [];
    const indexByUrl = new Map<string, number>();

    const normalizeUrl = (u: string) => {
      try {
        const urlObj = new URL(u);
        urlObj.hash = '';
        return urlObj.toString();
      } catch {
        return u;
      }
    };

    const addUrl = (u: string, title: string, status: 'visiting' | 'extracting' | 'complete' | 'error', timestamp?: string) => {
      const nu = normalizeUrl(u);
      const idx = indexByUrl.get(nu);
      if (idx === undefined) {
        indexByUrl.set(nu, out.length);
        out.push({ url: nu, title: title || nu, status, timestamp });
      } else {
        const prev = out[idx];
        out[idx] = {
          url: nu,
          title: title || prev.title,
          status,
          timestamp: timestamp || prev.timestamp
        };
      }
    };

    if (Array.isArray(accessedWebsites) && accessedWebsites.length > 0) {
      for (const site of accessedWebsites.slice(-20)) {
        const url = String((site as any)?.url || '').trim();
        if (!url) continue;
        addUrl(url, String((site as any)?.title || '').trim(), 'complete');
      }
    }

    if (Array.isArray(stepProgress) && stepProgress.length > 0) {
      for (const step of stepProgress.slice(-20)) {
        const metadata = ((step as any)?.metadata && typeof (step as any).metadata === 'object') ? (step as any).metadata : {};
        const urls: string[] = [];
        if (Array.isArray(metadata.urls)) {
          metadata.urls.forEach((u: any) => {
            const normalized = String(u || '').trim();
            if (normalized) {
              urls.push(normalized);
            }
          });
        }
        if (urls.length === 0) {
          const primary = String(metadata.primary_url || '').trim();
          if (primary) {
            urls.push(primary);
          }
        }
        if (urls.length === 0) {
          continue;
        }
        const stepStatus = String((step as any)?.status || '').toLowerCase();
        const status: 'visiting' | 'extracting' | 'complete' | 'error' =
          stepStatus === 'failed' ? 'error' :
          stepStatus === 'completed' ? 'complete' :
          (String((step as any)?.description || '').toLowerCase().includes('extract') ? 'extracting' : 'visiting');
        const title = String((step as any)?.description || '').trim();
        const timestamp = String((step as any)?.timestamp || '').trim() || undefined;
        urls.forEach((url: string) => addUrl(url, title, status, timestamp));
      }
    }

    for (const card of progressiveToolCards) {
      if (!card.details || typeof card.details !== 'object') continue;
      const extractUrlsFromObj = (obj: any, depth = 0): string[] => {
        if (depth > 3) return [];
        const found: string[] = [];
        if (typeof obj === 'string') {
          if (/^https?:\/\//i.test(obj)) found.push(obj);
          return found;
        }
        if (Array.isArray(obj)) {
          for (const item of obj.slice(0, 20)) {
            found.push(...extractUrlsFromObj(item, depth + 1));
          }
          return found;
        }
        if (typeof obj === 'object' && obj !== null) {
          for (const [key, val] of Object.entries(obj)) {
            const lowerKey = String(key).toLowerCase();
            if (lowerKey.includes('url') || lowerKey.includes('link') || lowerKey.includes('href') || lowerKey === 'source' || lowerKey === 'domain') {
              found.push(...extractUrlsFromObj(val, depth + 1));
            } else if (lowerKey === 'results' || lowerKey === 'sources' || lowerKey === 'items' || lowerKey === 'data') {
              found.push(...extractUrlsFromObj(val, depth + 1));
            }
          }
        }
        return found;
      };
      const cardUrls = extractUrlsFromObj(card.details);
      const cardStatus: 'visiting' | 'extracting' | 'complete' | 'error' = 
        card.status === 'failed' ? 'error' : 
        card.status === 'completed' ? 'complete' : 
        (card.toolName.toLowerCase().includes('scrap') || card.toolName.toLowerCase().includes('extract') ? 'extracting' : 'visiting');
      for (const url of cardUrls.slice(0, 10)) {
        addUrl(url, card.description, cardStatus, card.timestamp);
      }
    }

    for (const thought of agentThoughts.slice(-30)) {
      if (!thought.metadata || typeof thought.metadata !== 'object') continue;
      const metaUrls: string[] = [];
      if (typeof thought.metadata.url === 'string' && /^https?:\/\//i.test(thought.metadata.url)) {
        metaUrls.push(thought.metadata.url);
      }
      if (Array.isArray(thought.metadata.urls)) {
        for (const u of thought.metadata.urls.slice(0, 5)) {
          if (typeof u === 'string' && /^https?:\/\//i.test(u)) {
            metaUrls.push(u);
          }
        }
      }
      for (const url of metaUrls) {
        addUrl(url, String(thought.thought || '').slice(0, 100), 'visiting', thought.timestamp);
      }
    }

    const urlRegex = /(https?:\/\/[^\s)\]}>,"']+)/g;
    if (Array.isArray(automationWsLogs) && automationWsLogs.length > 0) {
      for (const l of automationWsLogs.slice(-40)) {
        const msg = String(l.message || '');
        const matches = msg.match(urlRegex) || [];
        const status: 'visiting' | 'extracting' | 'complete' | 'error' =
          l.type === 'error' ? 'error' :
          l.type === 'success' ? 'complete' :
          (msg.toLowerCase().includes('extract') ? 'extracting' : 'visiting');
        for (const m of matches) {
          addUrl(m, '', status, l.timestamp);
        }
      }
    }

    if (typeof automationStreamUrl === 'string' && automationStreamUrl.trim()) {
      const status: 'visiting' | 'extracting' | 'complete' | 'error' = 'visiting';
      addUrl(automationStreamUrl.trim(), '', status);
    }

    return out.slice(-15).reverse();
  }, [accessedWebsites, automationStreamUrl, automationWsLogs, stepProgress, progressiveToolCards, agentThoughts]);
}
