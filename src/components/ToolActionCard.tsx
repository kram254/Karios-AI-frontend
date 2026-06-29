import React, { useEffect, useMemo, useState } from 'react';
import { Globe, FileText, Code, Database, Zap, ChevronDown, ChevronUp, CheckCircle2, Loader, XCircle, Search, PauseCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface ToolActionCardProps {
  toolName: string;
  displayName?: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  subtitle?: string;
  details?: Record<string, any>;
  thought?: string;
  startedAt?: string;
  retryCount?: number;
  isBrowserTool?: boolean;
  defaultExpanded?: boolean;
}

const TOOL_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  perplexity_search: { label: 'Search the Internet', icon: <Globe className="w-4 h-4" />, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  perplexity_sonar: { label: 'Search the Internet', icon: <Globe className="w-4 h-4" />, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  search: { label: 'Search the Internet', icon: <Globe className="w-4 h-4" />, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  alternative_research: { label: 'Search the Internet', icon: <Globe className="w-4 h-4" />, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  brave_search: { label: 'Search the Internet', icon: <Search className="w-4 h-4" />, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  google_search: { label: 'Search the Internet', icon: <Search className="w-4 h-4" />, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  search_service: { label: 'Search the Internet', icon: <Globe className="w-4 h-4" />, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  web_search: { label: 'Search the Internet', icon: <Globe className="w-4 h-4" />, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  research_tools: { label: 'Research', icon: <Search className="w-4 h-4" />, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  web_scraping: { label: 'Extract webpage text', icon: <FileText className="w-4 h-4" />, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  web_scraper: { label: 'Extract webpage text', icon: <FileText className="w-4 h-4" />, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  extract: { label: 'Extract webpage text', icon: <FileText className="w-4 h-4" />, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  extract_webpage: { label: 'Extract webpage text', icon: <FileText className="w-4 h-4" />, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  web_automation: { label: 'Browser automation', icon: <Globe className="w-4 h-4" />, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  gemini_computer_use: { label: 'AI browser automation', icon: <Globe className="w-4 h-4" />, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  navigate: { label: 'Navigate to page', icon: <Globe className="w-4 h-4" />, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  content_generation: { label: 'Generate content', icon: <Code className="w-4 h-4" />, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  code_execution: { label: 'Execute code', icon: <Code className="w-4 h-4" />, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  generate: { label: 'Generate', icon: <Code className="w-4 h-4" />, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  query_context: { label: 'Query context', icon: <Database className="w-4 h-4" />, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  knowledge_base: { label: 'Query context', icon: <Database className="w-4 h-4" />, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
};

const DEFAULT_CONFIG = { label: '', icon: <Zap className="w-4 h-4" />, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };

function getToolConfig(toolName: string) {
  const key = toolName.toLowerCase().replace(/[\s-]/g, '_');
  return TOOL_CONFIG[key] || { ...DEFAULT_CONFIG, label: toolName };
}

function formatResultValue(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (typeof value === 'string') {
    const raw = value.trim();
    if ((raw.startsWith('{') && raw.endsWith('}')) || (raw.startsWith('[') && raw.endsWith(']'))) {
      try {
        const parsed = JSON.parse(raw);
        const pretty = JSON.stringify(parsed, null, 2);
        return pretty.length > 24000 ? `${pretty.slice(0, 24000).trimEnd()}\n...` : pretty;
      } catch {
        return value;
      }
    }
    return value;
  }

  if (typeof value === 'object') {
    try {
      const pretty = JSON.stringify(value, null, 2);
      return pretty.length > 24000 ? `${pretty.slice(0, 24000).trimEnd()}\n...` : pretty;
    } catch {
      return String(value);
    }
  }

  return String(value);
}

function formatElapsedDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getAccentClass(color: string): string {
  if (color.includes('emerald')) return 'border-l-emerald-400/80';
  if (color.includes('cyan')) return 'border-l-cyan-400/80';
  if (color.includes('blue')) return 'border-l-blue-400/80';
  if (color.includes('orange')) return 'border-l-orange-400/80';
  return 'border-l-purple-400/80';
}

function FaviconImg({ url }: { url: string }) {
  const [err, setErr] = useState(false);
  let hostname = '';
  try { hostname = new URL(url).hostname; } catch { return null; }
  if (err || !hostname) return null;
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=16`}
      width={16}
      height={16}
      alt=""
      onError={() => setErr(true)}
      className="rounded-sm flex-shrink-0"
    />
  );
}

export const ToolActionCard: React.FC<ToolActionCardProps> = ({
  toolName,
  displayName,
  status,
  subtitle,
  details,
  thought,
  startedAt,
  retryCount,
  isBrowserTool = false,
  defaultExpanded = false
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [statusDrivenExpansionEnabled, setStatusDrivenExpansionEnabled] = useState(true);
  const [nowMs, setNowMs] = useState(Date.now());
  const [completedAtMs, setCompletedAtMs] = useState<number | null>(null);
  const config = getToolConfig(toolName);
  const label = displayName || config.label || toolName;
  const accentClass = getAccentClass(config.color);

  const startedAtMs = useMemo(() => {
    if (!startedAt) return null;
    const parsed = new Date(startedAt).getTime();
    return Number.isNaN(parsed) ? null : parsed;
  }, [startedAt]);

  useEffect(() => {
    if ((status !== 'running' && status !== 'paused') || !startedAtMs) return;
    const interval = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [status, startedAtMs]);

  useEffect(() => {
    if (status === 'running') {
      setCompletedAtMs(null);
      return;
    }
    if (startedAtMs && completedAtMs === null) {
      setCompletedAtMs(Date.now());
    }
  }, [status, startedAtMs, completedAtMs]);

  const elapsed = startedAtMs
    ? formatElapsedDuration(((status === 'running' ? nowMs : completedAtMs ?? nowMs)) - startedAtMs)
    : null;

  const ceilingSecs = isBrowserTool ? 60 : 120;
  const elapsedSecs = startedAtMs ? Math.floor(((status === 'running' ? nowMs : completedAtMs ?? nowMs) - startedAtMs) / 1000) : 0;
  const nearTimeout = status === 'running' && elapsedSecs >= ceilingSecs - 10;

  useEffect(() => {
    if (!statusDrivenExpansionEnabled) {
      return;
    }
    if (status === 'running') {
      setExpanded(true);
      return;
    }
    if (status === 'completed' || status === 'failed') {
      setExpanded(false);
    }
  }, [status, statusDrivenExpansionEnabled]);

  useEffect(() => {
    if (status === 'running') {
      setStatusDrivenExpansionEnabled(true);
    }
  }, [status]);

  const elapsedLabel = elapsed
    ? status === 'running'
      ? nearTimeout ? `Timeout imminent — ${elapsed}` : `Running... ${elapsed}`
      : status === 'paused'
        ? `Paused — waiting for you ${elapsed}`
        : status === 'completed'
          ? `Completed in ${elapsed}`
          : `Failed in ${elapsed}`
    : status === 'running'
      ? nearTimeout ? 'Timeout imminent' : 'Running...'
      : status === 'paused'
        ? 'Paused — waiting for you'
        : status === 'completed'
          ? 'Completed'
          : 'Failed';

  const statusIcon = status === 'completed' ? (
    <motion.div
      initial={{ scale: 0.7, opacity: 0.7 }}
      animate={{ scale: [0.7, 1.2, 1], opacity: [0.7, 1, 1] }}
      transition={{ duration: 0.35 }}
    >
      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
    </motion.div>
  ) : status === 'failed' ? (
    <motion.div
      initial={{ x: 0 }}
      animate={{ x: [0, -2, 2, -1, 1, 0] }}
      transition={{ duration: 0.35 }}
    >
      <XCircle className="w-4 h-4 text-red-400" />
    </motion.div>
  ) : status === 'paused' ? (
    <motion.div
      animate={{ opacity: [1, 0.4, 1] }}
      transition={{ duration: 1.4, ease: 'easeInOut', repeat: Infinity }}
    >
      <PauseCircle className="w-4 h-4 text-orange-400" />
    </motion.div>
  ) : (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1.1, ease: 'linear', repeat: Infinity }}
    >
      <Loader className="w-4 h-4 text-gray-400" />
    </motion.div>
  );

  const hasExpandableContent = !!(thought || (details && Object.keys(details).length > 0));

  return (
    <div className={`rounded-xl border ${status === 'paused' ? 'border-orange-500/40' : 'border-[#232323]'} ${accentClass} border-l-2 bg-[#131313] overflow-hidden transition-all duration-200 hover:border-[#2e2e2e]`}>
      <button
        type="button"
        onClick={() => {
          if (!hasExpandableContent) return;
          setStatusDrivenExpansionEnabled(false);
          setExpanded(!expanded);
        }}
        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-[#181818] transition-colors"
      >
        <motion.div
          className={`w-6 h-6 rounded-lg border flex items-center justify-center flex-shrink-0 ${config.color}`}
          animate={status === 'running' ? { scale: [1, 1.07, 1] } : { scale: 1 }}
          transition={status === 'running' ? { duration: 1.1, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
        >
          {config.icon}
        </motion.div>
        {(toolName.includes('web_auto') || toolName.includes('scraper') || toolName.includes('navigate') || toolName.includes('gemini_computer')) && subtitle?.startsWith('http') && <FaviconImg url={subtitle} />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-white truncate">{label}</span>
              {retryCount && retryCount > 0 && status === 'running' && (
                <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">Retry {retryCount}/2</span>
              )}
            </span>
            {subtitle && (
              <div className="flex items-center gap-1 mt-0.5">
                {subtitle.startsWith('http') ? (
                  <a
                    href={subtitle}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="text-[11px] text-emerald-400/80 font-mono truncate max-w-[200px] hover:underline hover:text-emerald-300"
                  >
                    {subtitle}
                  </a>
                ) : (
                  <span className="text-[11px] text-gray-500 truncate max-w-[200px]">{subtitle}</span>
                )}
              </div>
            )}
          </div>
          <div className={`text-[11px] mt-0.5 ${status === 'completed' ? 'text-emerald-500/70' : status === 'failed' ? 'text-red-400/70' : status === 'paused' ? 'text-orange-400/80' : nearTimeout ? 'text-amber-400/90' : 'text-gray-600'}`}>
            {elapsedLabel}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {statusIcon}
          {hasExpandableContent && (
            <div className="text-gray-600">
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && hasExpandableContent && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="border-t border-[#1e1e1e] px-3.5 py-3 space-y-2.5 bg-[#0d0d0d]">
              {details && Object.keys(details).length > 0 && (
                Object.entries(details).map(([key, value]) => {
                  if (value === null || value === undefined || value === '') return null;
                  const displayKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
                  const isLongValue = typeof value === 'object' || (typeof value === 'string' && value.length > 120);
                  return (
                    <div key={key}>
                      <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1">{displayKey}</div>
                      {isLongValue ? (
                        (key === 'screenshot' || key === 'screenshot_base64') && typeof value === 'string' && (value.startsWith('data:image/') || (value.length > 200 && !/\s/.test(value.slice(0, 50)))) ? (
                          <img src={value.startsWith('data:') ? value : `data:image/png;base64,${value}`} alt="screenshot" className="w-full rounded-lg max-h-40 object-cover border border-white/10 mt-1" />
                        ) : (
                        <pre className="text-[11.5px] text-gray-300 bg-[#0A0A0A] rounded-lg p-2.5 overflow-x-auto max-h-56 overflow-y-auto whitespace-pre-wrap break-words font-mono leading-relaxed border border-[#1e1e1e]">
                          {formatResultValue(value)}
                        </pre>
                        )
                      ) : (
                        <div className="text-[12.5px] text-gray-300 bg-[#0A0A0A] rounded-lg px-3 py-1.5 border border-[#1e1e1e]">
                          {formatResultValue(value)}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              {thought && !details && (
                <div>
                  <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1">Result</div>
                  <pre className="text-[11.5px] text-gray-300 bg-[#0A0A0A] rounded-lg p-2.5 overflow-x-auto max-h-56 overflow-y-auto whitespace-pre-wrap break-words font-mono leading-relaxed border border-[#1e1e1e]">
                    {thought}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ToolActionCard;
