import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Loader,
  FileText,
  Terminal,
  Search,
  Bot,
  Brain,
  Zap,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Pencil,
  FolderTree,
  Square,
  Globe,
  Wrench,
} from 'lucide-react';

export interface ActivityStep {
  id: string;
  status: 'loading' | 'complete' | 'error';
  title: string;
  details?: string;
  timestamp?: string;
}

interface ActivityKindInfo {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
}

const TOOL_KIND_MAP: Record<string, ActivityKindInfo> = {
  Write: { icon: FileText, label: 'Writing file', color: 'text-blue-300' },
  Edit: { icon: Pencil, label: 'Editing file', color: 'text-blue-300' },
  MultiEdit: { icon: Pencil, label: 'Editing file', color: 'text-blue-300' },
  Read: { icon: FileText, label: 'Reading file', color: 'text-cyan-300' },
  Bash: { icon: Terminal, label: 'Running command', color: 'text-purple-300' },
  Grep: { icon: Search, label: 'Searching', color: 'text-amber-300' },
  Glob: { icon: FolderTree, label: 'Listing files', color: 'text-amber-300' },
  LS: { icon: FolderTree, label: 'Listing files', color: 'text-amber-300' },
  Agent: { icon: Bot, label: 'Agent', color: 'text-violet-300' },
  Task: { icon: Bot, label: 'Agent', color: 'text-violet-300' },
  WebFetch: { icon: Globe, label: 'Fetching URL', color: 'text-cyan-300' },
  WebSearch: { icon: Search, label: 'Web search', color: 'text-amber-300' },
};

function inferKind(step: ActivityStep): ActivityKindInfo {
  const tool = (step.details || '').trim();
  if (tool && TOOL_KIND_MAP[tool]) return TOOL_KIND_MAP[tool];

  const t = String(step.title || '').toLowerCase();
  if (t.includes('writ')) return TOOL_KIND_MAP.Write;
  if (t.includes('edit')) return TOOL_KIND_MAP.Edit;
  if (t.includes('command') || t.includes('shell') || t.includes('bash') || t.includes('execute')) return TOOL_KIND_MAP.Bash;
  if (t.includes('search') || t.includes('grep')) return TOOL_KIND_MAP.Grep;
  if (t.includes('navigat') || t.includes('http') || t.includes('fetch') || t.includes('url')) return TOOL_KIND_MAP.WebFetch;
  if (t.includes('extract') || t.includes('scrap')) return { icon: Terminal, label: 'Extracting', color: 'text-purple-300' };
  if (t.includes('reason') || t.includes('think') || t.includes('analyz') || t.includes('plan')) {
    return { icon: Brain, label: 'Reasoned', color: 'text-emerald-300' };
  }
  if (t.includes('agent') || t.includes('dispatch') || t.includes('subagent')) return TOOL_KIND_MAP.Agent;
  if (t.includes('tool')) return { icon: Wrench, label: 'Tool', color: 'text-violet-300' };
  return { icon: Zap, label: 'Step', color: 'text-purple-300' };
}

function tryExtractFilename(title: string): { name?: string; rest?: string } {
  const match = String(title || '').match(/([\w./\-]+\.[a-zA-Z0-9]{1,8})/);
  if (match) {
    return { name: match[1], rest: title.replace(match[1], '').trim() };
  }
  return {};
}

interface ActivityPillProps {
  step: ActivityStep;
  defaultExpanded?: boolean;
}

export const ActivityPill: React.FC<ActivityPillProps> = ({ step, defaultExpanded = false }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const kind = inferKind(step);
  const Icon = kind.icon;
  const isLoading = step.status === 'loading';
  const isError = step.status === 'error';

  const description = String(step.title || '').trim();
  const filename = tryExtractFilename(description);
  const showFilename = !!filename.name;
  const displayDescription = showFilename ? filename.name! : description;
  const truncationLimit = 90;
  const truncated = displayDescription.length > truncationLimit ? displayDescription.slice(0, truncationLimit) + '...' : displayDescription;
  const expandable = displayDescription.length > truncationLimit || (filename.rest && filename.rest.length > 0);

  return (
    <button
      type="button"
      onClick={() => expandable && setExpanded(!expanded)}
      className={`group flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md border transition-colors text-left ${
        isError
          ? 'border-red-500/20 bg-red-500/5 hover:bg-red-500/10'
          : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1]'
      }`}
    >
      <span className="flex-shrink-0">
        {isLoading ? (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.1, ease: 'linear', repeat: Infinity }}>
            <Loader className="w-3.5 h-3.5 text-gray-500" />
          </motion.div>
        ) : isError ? (
          <XCircle className="w-3.5 h-3.5 text-red-400" />
        ) : (
          <Icon className={`w-3.5 h-3.5 ${kind.color}`} />
        )}
      </span>
      <span className={`text-[12.5px] font-medium tracking-tight ${isLoading ? 'text-gray-400' : 'text-gray-200'}`}>
        {isLoading ? `${kind.label}...` : kind.label}
      </span>
      {!isLoading && displayDescription && (
        <>
          <span className="text-gray-600 text-[12.5px]">·</span>
          <span className={`text-[12.5px] truncate min-w-0 ${showFilename ? 'text-gray-300 font-mono' : 'text-gray-400'}`}>
            {expanded ? displayDescription : truncated}
          </span>
        </>
      )}
      {expanded && filename.rest && (
        <span className="text-[11.5px] text-gray-500 truncate flex-1 min-w-0 ml-1">{filename.rest}</span>
      )}
      {expandable && (
        <span className="ml-auto flex-shrink-0 text-gray-600 group-hover:text-gray-400 transition-colors">
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </span>
      )}
    </button>
  );
};

interface TaskActivityFeedProps {
  steps: ActivityStep[];
  isWorking?: boolean;
  workingLabel?: string;
  elapsed?: string | null;
  onStop?: () => void;
  sectionLabel?: string;
}

export const TaskActivityFeed: React.FC<TaskActivityFeedProps> = ({
  steps,
  isWorking = false,
  workingLabel = 'Working...',
  elapsed,
  onStop,
  sectionLabel,
}) => {
  const filtered = useMemo(
    () => steps.filter(s => !String(s.title || '').startsWith('[Trace]')),
    [steps]
  );

  if (filtered.length === 0 && !isWorking) return null;

  return (
    <div className="space-y-1.5 w-full">
      {sectionLabel && (
        <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-2 mt-1">{sectionLabel}</div>
      )}
      {filtered.map(step => (
        <ActivityPill key={String(step.id)} step={step} />
      ))}
      {isWorking && (
        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/[0.04]">
          <div className="flex items-center gap-2 text-[12px] text-gray-500">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.1, ease: 'linear', repeat: Infinity }}>
              <Loader className="w-3 h-3" />
            </motion.div>
            <span>{workingLabel}</span>
            {elapsed && <span className="tabular-nums text-gray-600">· {elapsed}</span>}
          </div>
          {onStop && (
            <button
              type="button"
              onClick={onStop}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-gray-400 bg-white/[0.02] border border-white/[0.06] rounded hover:bg-white/[0.05] hover:text-gray-300 transition-colors"
            >
              <Square className="w-2.5 h-2.5" fill="currentColor" />
              Stop
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskActivityFeed;
