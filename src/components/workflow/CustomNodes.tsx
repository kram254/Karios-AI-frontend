import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  Bot,
  BrainCircuit,
  PlugZap,
  Code2,
  GitBranch,
  Repeat,
  CheckCircle,
  Square,
  StopCircle,
  XCircle,
  StickyNote,
  ShieldCheck,
  DatabaseZap,
  SearchCode,
  Webhook,
  CalendarClock,
  Blocks,
  Play,
  Snowflake,
  Circle,
} from 'lucide-react';
import type { WorkflowNode } from '../../types/workflow';

// Node icon mapping
const nodeIcons: Record<string, any> = {
  start: Play,
  agent: BrainCircuit,
  'mcp-tool': PlugZap,
  transform: Code2,
  'if-else': GitBranch,
  while: Repeat,
  loop: Repeat,
  condition: GitBranch,
  approval: CheckCircle,
  end: StopCircle,
  note: StickyNote,
  guardrail: ShieldCheck,
  guardrails: ShieldCheck,
  'set-state': DatabaseZap,
  'file-search': SearchCode,
  'webhook-trigger': Webhook,
  'schedule-trigger': CalendarClock,
  'integration': Blocks,
  'fork': GitBranch,
  'join': CheckCircle,
  'error-handler': ShieldCheck,
  'loop-advanced': Repeat,
  'skill': BrainCircuit,
};

const nodeImageIcons: Record<string, string> = {
  start: new URL('../../../3d_icons/start_icon.webp', import.meta.url).href,
  end: new URL('../../../3d_icons/bot.webp', import.meta.url).href,
  agent: new URL('../../../3d_icons/Agent.webp', import.meta.url).href,
  'mcp-tool': new URL('../../../3d_icons/robot mcp tools.webp', import.meta.url).href,
  transform: new URL('../../../3d_icons/AI.webp', import.meta.url).href,
  'if-else': new URL('../../../3d_icons/AI avatar.webp', import.meta.url).href,
  condition: new URL('../../../3d_icons/AI avatar.webp', import.meta.url).href,
  while: new URL('../../../3d_icons/bitbot.webp', import.meta.url).href,
  loop: new URL('../../../3d_icons/bitbot.webp', import.meta.url).href,
  approval: new URL('../../../3d_icons/AI avatar.webp', import.meta.url).href,
  note: new URL('../../../3d_icons/bot.webp', import.meta.url).href,
  guardrail: new URL('../../../3d_icons/bug.webp', import.meta.url).href,
  guardrails: new URL('../../../3d_icons/bug.webp', import.meta.url).href,
  'set-state': new URL('../../../3d_icons/AI.webp', import.meta.url).href,
  'file-search': new URL('../../../3d_icons/bitbot.webp', import.meta.url).href,
  'webhook-trigger': new URL('../../../3d_icons/AI.webp', import.meta.url).href,
  'schedule-trigger': new URL('../../../3d_icons/AI.webp', import.meta.url).href,
  integration: new URL('../../../3d_icons/AI avatar.webp', import.meta.url).href,
};

// Node color mapping
const nodeColors: Record<string, string> = {
  start: 'border-green-400/40',
  agent: 'border-blue-400/40',
  'mcp-tool': 'border-purple-400/40',
  transform: 'border-orange-400/40',
  'if-else': 'border-yellow-400/40',
  while: 'border-pink-400/40',
  approval: 'border-cyan-400/40',
  end: 'border-red-400/40',
  note: 'border-white/15',
  guardrail: 'border-indigo-400/40',
  'set-state': 'border-teal-400/40',
  'file-search': 'border-violet-400/40',
  'webhook-trigger': 'border-blue-400/40',
  'schedule-trigger': 'border-amber-400/40',
  'integration': 'border-emerald-400/40',
};

const nodeSizePresets: Record<string, { minW: number; minH: number; defaultW: number; defaultH: number; iconBox: number; iconSize: number }> = {
  start: { minW: 72, minH: 72, defaultW: 84, defaultH: 84, iconBox: 36, iconSize: 20 },
  end: { minW: 72, minH: 72, defaultW: 84, defaultH: 84, iconBox: 36, iconSize: 20 },
  agent: { minW: 260, minH: 140, defaultW: 320, defaultH: 180, iconBox: 32, iconSize: 16 },
  'mcp-tool': { minW: 180, minH: 140, defaultW: 240, defaultH: 180, iconBox: 32, iconSize: 16 },
  transform: { minW: 220, minH: 72, defaultW: 280, defaultH: 84, iconBox: 30, iconSize: 15 },
  'if-else': { minW: 220, minH: 72, defaultW: 280, defaultH: 84, iconBox: 30, iconSize: 15 },
  condition: { minW: 220, minH: 72, defaultW: 280, defaultH: 84, iconBox: 30, iconSize: 15 },
  while: { minW: 220, minH: 72, defaultW: 280, defaultH: 84, iconBox: 30, iconSize: 15 },
  loop: { minW: 220, minH: 72, defaultW: 280, defaultH: 84, iconBox: 30, iconSize: 15 },
  approval: { minW: 220, minH: 72, defaultW: 280, defaultH: 84, iconBox: 30, iconSize: 15 },
  note: { minW: 240, minH: 84, defaultW: 300, defaultH: 100, iconBox: 30, iconSize: 15 },
  guardrail: { minW: 220, minH: 72, defaultW: 280, defaultH: 84, iconBox: 30, iconSize: 15 },
  guardrails: { minW: 220, minH: 72, defaultW: 280, defaultH: 84, iconBox: 30, iconSize: 15 },
  'set-state': { minW: 220, minH: 72, defaultW: 280, defaultH: 84, iconBox: 30, iconSize: 15 },
  'file-search': { minW: 220, minH: 72, defaultW: 280, defaultH: 84, iconBox: 30, iconSize: 15 },
  'webhook-trigger': { minW: 180, minH: 60, defaultW: 240, defaultH: 68, iconBox: 28, iconSize: 14 },
  'schedule-trigger': { minW: 180, minH: 60, defaultW: 240, defaultH: 68, iconBox: 28, iconSize: 14 },
  integration: { minW: 200, minH: 60, defaultW: 260, defaultH: 68, iconBox: 28, iconSize: 14 },
};

// Custom node component
function CustomNode({ data, selected }: NodeProps<WorkflowNode['data']>) {
  const nodeType = data.nodeType;
  const Icon = nodeIcons[nodeType] || Bot;
  const imageIcon = nodeImageIcons[nodeType];
  const colorClass = nodeColors[nodeType] || 'from-gray-500/20 to-gray-600/20 border-gray-500';
  const [hasImageLoadError, setHasImageLoadError] = useState(false);

  const hasBreakpoint = Boolean((data as any)?.hasBreakpoint);
  const isFrozen = Boolean((data as any)?.isFrozen);
  const pinnedEnabled = Boolean((data as any)?.config?.pinnedEnabled);
  const executionResult = (data as any)?.executionResult;
  const onRunFromHere = (data as any)?.onRunFromHere as undefined | (() => void);
  const onToggleBreakpoint = (data as any)?.onToggleBreakpoint as undefined | (() => void);
  const onToggleFreeze = (data as any)?.onToggleFreeze as undefined | (() => void);

  const config = (data as any)?.config || {};

  const headerAccent = useMemo(() => {
    if (nodeType === 'start') return 'rgba(34,197,94,0.55)';
    if (nodeType === 'end') return 'rgba(239,68,68,0.55)';
    if (nodeType === 'agent') return 'rgba(59,130,246,0.55)';
    if (nodeType === 'mcp-tool') return 'rgba(168,85,247,0.55)';
    if (nodeType === 'transform') return 'rgba(249,115,22,0.55)';
    if (nodeType === 'file-search') return 'rgba(139,92,246,0.55)';
    if (nodeType === 'webhook-trigger') return 'rgba(96,165,250,0.55)';
    if (nodeType === 'schedule-trigger') return 'rgba(245,158,11,0.55)';
    if (nodeType === 'integration') return 'rgba(16,185,129,0.55)';
    if (nodeType === 'guardrail' || nodeType === 'guardrails') return 'rgba(99,102,241,0.55)';
    if (nodeType === 'approval') return 'rgba(34,211,238,0.55)';
    return 'rgba(148,163,184,0.45)';
  }, [nodeType]);

  const subtitle = useMemo(() => {
    if (nodeType === 'agent') {
      const model = typeof config?.model === 'string' && config.model ? config.model : undefined;
      const effort = typeof config?.reasoningEffort === 'string' && config.reasoningEffort ? config.reasoningEffort : undefined;
      const parts = [model, effort ? `Reasoning: ${effort}` : undefined].filter(Boolean);
      return parts.length ? parts.join(' • ') : 'AI Agent';
    }
    if (nodeType === 'webhook-trigger') {
      const path = typeof config?.webhookPath === 'string' && config.webhookPath ? config.webhookPath : undefined;
      const methods = Array.isArray(config?.webhookMethods) && config.webhookMethods.length ? String(config.webhookMethods.join(', ')) : undefined;
      const parts = [methods, path].filter(Boolean);
      return parts.length ? parts.join(' ') : 'Webhook Trigger';
    }
    if (nodeType === 'schedule-trigger') {
      const cron = typeof config?.cronExpression === 'string' && config.cronExpression ? config.cronExpression : undefined;
      const tz = typeof config?.timezone === 'string' && config.timezone ? config.timezone : undefined;
      const parts = [cron, tz].filter(Boolean);
      return parts.length ? parts.join(' • ') : 'Schedule Trigger';
    }
    if (nodeType === 'integration') {
      const integration = typeof config?.integration === 'string' && config.integration ? config.integration : undefined;
      const action = typeof config?.integrationAction === 'string' && config.integrationAction ? config.integrationAction : undefined;
      const parts = [integration, action].filter(Boolean);
      return parts.length ? parts.join(' • ') : 'Integration';
    }
    if (nodeType === 'file-search') {
      const k = typeof config?.topK === 'number' && isFinite(config.topK) ? `TopK: ${config.topK}` : undefined;
      const vs = typeof config?.vectorStoreId === 'string' && config.vectorStoreId ? 'Vector Store' : undefined;
      const parts = [vs, k].filter(Boolean);
      return parts.length ? parts.join(' • ') : 'Search';
    }
    if (nodeType === 'set-state') {
      const key = typeof config?.stateKey === 'string' && config.stateKey ? config.stateKey : undefined;
      return key ? `Key: ${key}` : 'State';
    }
    if (nodeType === 'if-else' || nodeType === 'condition') {
      const cond = typeof config?.condition === 'string' && config.condition ? config.condition : undefined;
      return cond ? cond : 'Condition';
    }
    if (nodeType === 'while' || nodeType === 'loop') {
      const it = typeof config?.maxIterations === 'number' && isFinite(config.maxIterations) ? `Max: ${config.maxIterations}` : undefined;
      return it ? it : 'Loop';
    }
    if (nodeType === 'approval') {
      const msg = typeof config?.approvalMessage === 'string' && config.approvalMessage ? 'Approval required' : undefined;
      return msg ? msg : 'Approval';
    }
    if (nodeType === 'guardrail' || nodeType === 'guardrails') {
      const gt = typeof config?.guardrailType === 'string' && config.guardrailType ? String(config.guardrailType) : undefined;
      return gt ? `Guardrail: ${gt}` : 'Guardrail';
    }
    if (nodeType === 'transform') return 'Transform';
    if (nodeType === 'mcp-tool') return 'Tool';
    if (nodeType === 'note') return 'Note';
    if (nodeType === 'start') return 'Start';
    if (nodeType === 'end') return 'End';
    return '';
  }, [config, nodeType]);

  const chips = useMemo(() => {
    const items: Array<{ label: string; tone: 'neutral' | 'good' | 'warn' | 'bad' }> = [];
    if (nodeType === 'agent') {
      const toolsCount = Array.isArray(config?.tools) ? config.tools.length : 0;
      if (toolsCount > 0) items.push({ label: `Tools: ${toolsCount}`, tone: 'neutral' });
      if (typeof config?.outputFormat === 'string' && config.outputFormat) items.push({ label: String(config.outputFormat).toUpperCase(), tone: 'neutral' });
      if (Boolean(config?.includeChatHistory)) items.push({ label: 'History', tone: 'neutral' });
    }
    if (nodeType === 'approval') items.push({ label: 'HITL', tone: 'warn' });
    if (nodeType === 'guardrail' || nodeType === 'guardrails') items.push({ label: 'Safety', tone: 'good' });
    if (nodeType === 'webhook-trigger') items.push({ label: 'Trigger', tone: 'neutral' });
    if (nodeType === 'schedule-trigger') items.push({ label: 'Trigger', tone: 'neutral' });
    if (nodeType === 'file-search') items.push({ label: 'Search', tone: 'neutral' });
    if (nodeType === 'set-state') items.push({ label: 'State', tone: 'neutral' });
    if (data.isRunning) items.push({ label: 'Running', tone: 'warn' });
    if (data.executionStatus === 'completed') items.push({ label: 'OK', tone: 'good' });
    if (data.executionStatus === 'failed') items.push({ label: 'Failed', tone: 'bad' });
    if (Boolean((data as any)?.dirty)) items.push({ label: 'Unsaved', tone: 'warn' });
    return items.slice(0, 4);
  }, [config, data, nodeType]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const resizingRef = useRef<{ active: boolean; startX: number; startY: number; startW: number; startH: number }>(
    { active: false, startX: 0, startY: 0, startW: 0, startH: 0 }
  );

  const rawWidth = (data as any)?.config?.nodeWidth;
  const rawHeight = (data as any)?.config?.nodeHeight;
  const width = typeof rawWidth === 'number' && isFinite(rawWidth) ? rawWidth : undefined;
  const height = typeof rawHeight === 'number' && isFinite(rawHeight) ? rawHeight : undefined;

  const [tempSize, setTempSize] = useState<{ w?: number; h?: number } | null>(null);
  const sizePreset = nodeSizePresets[nodeType] || { minW: 180, minH: 58, defaultW: 230, defaultH: 68, iconBox: 28, iconSize: 14 };
  const minSize = useMemo(() => ({ w: sizePreset.minW, h: sizePreset.minH }), [sizePreset.minW, sizePreset.minH]);

  useEffect(() => {
    setHasImageLoadError(false);
  }, [nodeType]);

  const oversizeLimits = useMemo(() => {
    const maxW = Math.max(520, Math.round(sizePreset.defaultW * 2.6));
    const maxH = Math.max(220, Math.round(sizePreset.defaultH * 2.6));
    return { maxW, maxH };
  }, [sizePreset.defaultW, sizePreset.defaultH]);

  useEffect(() => {
    const tooWide = typeof width === 'number' && width > oversizeLimits.maxW;
    const tooTall = typeof height === 'number' && height > oversizeLimits.maxH;
    const onUpdate = (data as any)?.onUpdate;
    if ((!tooWide && !tooTall) || typeof onUpdate !== 'function') return;
    onUpdate({
      config: {
        nodeWidth: tooWide ? undefined : width,
        nodeHeight: tooTall ? undefined : height,
      },
    });
  }, [data, width, height, oversizeLimits.maxW, oversizeLimits.maxH]);

  const effectiveWidth = tempSize?.w ?? width;
  const effectiveHeight = tempSize?.h ?? height;
  
  const showInputHandle = nodeType !== 'start';
  const showOutputHandle = nodeType !== 'end';
  const showAgentPorts = nodeType === 'agent';
  const isCircleNode = nodeType === 'start' || nodeType === 'end';
  const isOvalNode = nodeType === 'webhook-trigger' || nodeType === 'schedule-trigger' || nodeType === 'integration';
  const useImageIcon = Boolean(imageIcon) && !hasImageLoadError;
  const isSmallNode =
    nodeType === 'webhook-trigger' ||
    nodeType === 'schedule-trigger' ||
    nodeType === 'integration' ||
    nodeType === 'mcp-tool' ||
    nodeType === 'transform' ||
    nodeType === 'set-state' ||
    nodeType === 'file-search' ||
    nodeType === 'approval' ||
    nodeType === 'note' ||
    nodeType === 'guardrail' ||
    nodeType === 'guardrails' ||
    nodeType === 'condition' ||
    nodeType === 'while' ||
    nodeType === 'loop';
  const isAgentPill = nodeType === 'agent';
  
  // Execution status styling
  const getStatusStyle = () => {
    if (data.isRunning) {
      return 'ring-4 ring-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)] animate-pulse';
    }
    if (data.executionStatus === 'completed') {
      return 'ring-2 ring-green-400';
    }
    if (data.executionStatus === 'failed') {
      return 'ring-2 ring-red-400';
    }
    if (selected) {
      return 'ring-2 ring-white/50';
    }
    return '';
  };

  return (
    <div
      ref={containerRef}
      className={`
        group relative border bg-[#0f0f10] ${isCircleNode || isSmallNode ? 'overflow-visible' : 'overflow-hidden'}
        shadow-[0_8px_24px_rgba(0,0,0,0.55)] transition-all duration-200 hover:shadow-[0_12px_30px_rgba(0,0,0,0.65)]
        ${colorClass}
        ${getStatusStyle()}
      `}
      style={{
        borderRadius: isCircleNode ? 999 : isAgentPill ? 14 : isOvalNode ? 999 : 12,
        minWidth: `${sizePreset.minW}px`,
        minHeight: `${sizePreset.minH}px`,
        width: (typeof effectiveWidth === 'number' ? `${effectiveWidth}px` : `${sizePreset.defaultW}px`) as any,
        height: (typeof effectiveHeight === 'number' ? `${effectiveHeight}px` : `${sizePreset.defaultH}px`) as any,
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-10 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, ${headerAccent}, rgba(0,0,0,0))`,
          opacity: 0.22,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 20% 12%, rgba(255,255,255,0.06), rgba(0,0,0,0.0) 45%, rgba(0,0,0,0.35) 82%)',
          opacity: 0.85,
        }}
      />
      {selected && (
        <ResizeHandle
          minW={minSize.w}
          minH={minSize.h}
          onStart={(e) => {
            const el = containerRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            resizingRef.current = {
              active: true,
              startX: e.clientX,
              startY: e.clientY,
              startW: rect.width,
              startH: rect.height,
            };
            setTempSize({ w: rect.width, h: rect.height });
          }}
          onMove={(e) => {
            if (!resizingRef.current.active) return;
            const dx = e.clientX - resizingRef.current.startX;
            const dy = e.clientY - resizingRef.current.startY;
            const nextW = Math.max(minSize.w, resizingRef.current.startW + dx);
            const nextH = Math.max(minSize.h, resizingRef.current.startH + dy);
            setTempSize({ w: nextW, h: nextH });
          }}
          onEnd={() => {
            if (!resizingRef.current.active) return;
            resizingRef.current.active = false;
            const nextW = typeof tempSize?.w === 'number' ? tempSize.w : undefined;
            const nextH = typeof tempSize?.h === 'number' ? tempSize.h : undefined;
            setTempSize(null);
            if (typeof (data as any)?.onUpdate === 'function' && (nextW || nextH)) {
              (data as any).onUpdate({
                config: {
                  nodeWidth: nextW,
                  nodeHeight: nextH,
                },
              });
            }
          }}
        />
      )}
      {data.isRunning && (
        <div className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full shadow-lg animate-pulse flex items-center gap-1">
          <Circle size={8} fill="white" className="animate-ping" />
          RUNNING
        </div>
      )}
      {showInputHandle && (
        <Handle
          type="target"
          position={Position.Left}
          className={
            isCircleNode
              ? `w-2 h-2 rounded-full !bg-white/80 border border-white/25 shadow-[0_0_0_3px_rgba(0,0,0,0.35)] group-hover:visible`
              : `w-2.5 h-2.5 rounded-full !bg-white/80 border border-white/25 shadow-[0_0_0_3px_rgba(0,0,0,0.35)]`
          }
          style={{
            left: isCircleNode ? 4 : -5,
            top: '50%',
            transform: 'translateY(-50%)',
            ...(isCircleNode ? { visibility: 'hidden' } : {}),
          }}
        />
      )}
      {nodeType === 'start' && (
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={false}
          className="opacity-0 pointer-events-none w-2.5 h-2.5 rounded-full"
          style={{ left: 4, top: '50%', transform: 'translateY(-50%)' }}
        />
      )}
      {showOutputHandle && (
        <Handle
          type="source"
          position={Position.Right}
          className={
            `${showAgentPorts ? 'opacity-0 pointer-events-none' : ''} ` +
            (isCircleNode
              ? `w-2 h-2 rounded-full !bg-white border border-white/25 shadow-[0_0_0_3px_rgba(0,0,0,0.35)] group-hover:visible`
              : `w-3 h-3 !bg-white border-2 border-gray-700 shadow-[0_0_0_3px_rgba(0,0,0,0.35)]`)
          }
          style={{
            right: isCircleNode ? 4 : -6,
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: 'rgba(255,255,255,0.85)',
            ...(isCircleNode ? { visibility: 'hidden' } : {}),
          }}
        />
      )}
      {nodeType === 'end' && (
        <Handle
          type="source"
          position={Position.Right}
          isConnectable={false}
          className="opacity-0 pointer-events-none w-3 h-3 rounded-full"
          style={{ right: 4, top: '50%', transform: 'translateY(-50%)' }}
        />
      )}

      {showAgentPorts && (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="chat-model"
            className="w-2.5 h-2.5 rounded-full !bg-white/85 border border-white/30 shadow-[0_0_0_3px_rgba(0,0,0,0.35)]"
            style={{ left: '30%', bottom: -5, transform: 'translateX(-50%)' }}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="memory"
            className="w-2.5 h-2.5 rounded-full !bg-white/85 border border-white/30 shadow-[0_0_0_3px_rgba(0,0,0,0.35)]"
            style={{ left: '50%', bottom: -5, transform: 'translateX(-50%)' }}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="tool"
            className="w-2.5 h-2.5 rounded-full !bg-white/85 border border-white/30 shadow-[0_0_0_3px_rgba(0,0,0,0.35)]"
            style={{ left: '70%', bottom: -5, transform: 'translateX(-50%)' }}
          />
        </>
      )}

      <div className={`relative flex h-full flex-col ${isCircleNode ? 'p-0 items-center justify-center' : 'px-2.5 py-2'}`}>
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="relative flex items-center justify-center rounded-full"
            style={{
              width: isCircleNode ? Math.max(28, Math.round(sizePreset.defaultW * 0.62)) : 24,
              height: isCircleNode ? Math.max(28, Math.round(sizePreset.defaultH * 0.62)) : 24,
              background: isCircleNode ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.06)',
              boxShadow: isCircleNode ? 'inset 0 1px 0 rgba(255,255,255,0.10)' : '0 10px 18px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.10)',
              border: isCircleNode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.10)',
            }}
          >
            {useImageIcon ? (
              <img
                src={imageIcon}
                alt={`${nodeType} icon`}
                loading="lazy"
                decoding="async"
                draggable={false}
                onError={() => setHasImageLoadError(true)}
                style={{
                  width: isCircleNode ? 20 : 'clamp(18px, 1.6vw, 20px)',
                  height: isCircleNode ? 20 : 'clamp(18px, 1.6vw, 20px)',
                  objectFit: 'contain',
                  display: 'block',
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              />
            ) : (
              <Icon
                style={{
                  width: isCircleNode ? 20 : 'clamp(18px, 1.6vw, 20px)',
                  height: isCircleNode ? 20 : 'clamp(18px, 1.6vw, 20px)',
                  color: 'rgba(255,255,255,0.95)',
                  filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.45))',
                }}
              />
            )}
          </div>
          <div className={`${isCircleNode ? 'hidden' : ''} flex-1 min-w-0`}>
            <div className={`${(isCircleNode || isSmallNode) ? 'hidden' : ''} font-semibold text-white text-[12px] tracking-wide min-w-0 truncate`}>{data.label}</div>
            {subtitle ? <div className={`${(isCircleNode || isSmallNode) ? 'hidden' : ''} text-[10px] text-white/60 mt-0.5 min-w-0 truncate`}>{subtitle}</div> : null}
          </div>
          <div className={`${isCircleNode ? 'hidden' : ''} ml-auto flex items-center gap-1 shrink-0`}>
            {hasBreakpoint && <Circle size={9} color="#ef4444" fill="#ef4444" />}
            {pinnedEnabled && <Circle size={9} color="#06b6d4" fill="#06b6d4" />}
            {selected && typeof onRunFromHere === 'function' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRunFromHere();
                }}
                className="w-6 h-6 rounded-md bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center"
              >
                <Play className="w-3.5 h-3.5 text-white/90" />
              </button>
            )}
            {selected && typeof onToggleBreakpoint === 'function' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleBreakpoint();
                }}
                className={`w-6 h-6 rounded-md border flex items-center justify-center ${hasBreakpoint ? 'bg-red-500/20 border-red-500/40' : 'bg-white/10 hover:bg-white/15 border-white/10'}`}
              >
                <Circle className={`w-3.5 h-3.5 ${hasBreakpoint ? 'text-red-300' : 'text-white/80'}`} />
              </button>
            )}
            {selected && typeof onToggleFreeze === 'function' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFreeze();
                }}
                className={`w-6 h-6 rounded-md border flex items-center justify-center ${isFrozen ? 'bg-cyan-500/20 border-cyan-500/40' : 'bg-white/10 hover:bg-white/15 border-white/10'}`}
              >
                <Snowflake className={`w-3.5 h-3.5 ${isFrozen ? 'text-cyan-200' : 'text-white/80'}`} />
              </button>
            )}
          </div>
        </div>

        <div className="mt-2 flex-1 min-h-0">
          {nodeType === 'agent' && typeof config?.prompt === 'string' && config.prompt ? (
            <div className="text-[10px] text-white/75 leading-snug line-clamp-3">{String(config.prompt)}</div>
          ) : null}

          {nodeType === 'agent' ? (
            <div className="mt-2 flex items-center justify-center gap-3 text-[9px] text-white/45">
              <span className="select-none">Chat Model</span>
              <span className="select-none">Memory</span>
              <span className="select-none">Tool</span>
            </div>
          ) : null}

          {nodeType === 'note' && typeof config?.noteText === 'string' && config.noteText ? (
            <div className="text-[10px] text-white/75 leading-snug line-clamp-4">{String(config.noteText)}</div>
          ) : null}

          {nodeType === 'transform' && (data.config as any)?.code && (
            <div className="text-[10px] text-gray-200 mt-0.5 line-clamp-1 leading-tight">{String((data.config as any).code)}</div>
          )}

        {nodeType === 'approval' && (data.config as any)?.approvalMessage && (
          <div className="text-[10px] text-gray-200 mt-0.5 line-clamp-1 leading-tight">{String((data.config as any).approvalMessage)}</div>
        )}

        {nodeType === 'set-state' && (data.config as any)?.stateKey && (
          <div className="text-[10px] text-gray-200 mt-0.5 line-clamp-1 leading-tight">{String((data.config as any).stateKey)}</div>
        )}

        {nodeType === 'file-search' && (data.config as any)?.searchQuery && (
          <div className="text-[10px] text-gray-200 mt-0.5 line-clamp-1 leading-tight">{String((data.config as any).searchQuery)}</div>
        )}

        {(nodeType === 'webhook-trigger' || nodeType === 'schedule-trigger') && (
          <div className="text-[10px] text-gray-300 mt-0.5 line-clamp-1 leading-tight">
            {nodeType === 'webhook-trigger' ? String((data.config as any)?.webhookPath || '') : String((data.config as any)?.cronExpression || '')}
          </div>
        )}

        {nodeType === 'integration' && ((data.config as any)?.integration || (data.config as any)?.integrationAction) && (
          <div className="text-[10px] text-gray-300 mt-0.5 line-clamp-1 leading-tight">
            {String((data.config as any)?.integration || '')}{((data.config as any)?.integrationAction ? ` · ${String((data.config as any).integrationAction)}` : '') as any}
          </div>
        )}

        {(nodeType === 'guardrail' || nodeType === 'guardrails') && (data.config as any)?.guardrailType && (
          <div className="text-[10px] text-gray-300 mt-0.5 line-clamp-1 leading-tight">{String((data.config as any).guardrailType)}</div>
        )}

        {nodeType === 'end' && (data.config as any)?.outputVariable && (
          <div className="text-[10px] text-gray-300 mt-0.5 line-clamp-1 leading-tight">{String((data.config as any).outputVariable)}</div>
        )}

        {data.executionStatus === 'completed' && typeof executionResult !== 'undefined' && (
          <div className="text-[10px] text-gray-200 mt-1 line-clamp-2 leading-tight">
            {typeof executionResult === 'object' && executionResult && 'output' in executionResult
              ? String((executionResult as any).output)
              : String(executionResult)}
          </div>
        )}

        {data.executionStatus === 'failed' && typeof executionResult !== 'undefined' && (
          <div className="text-[10px] text-red-200 mt-1 line-clamp-2 leading-tight">
            {typeof executionResult === 'object' && executionResult && 'error' in executionResult
              ? String((executionResult as any).error)
              : String(executionResult)}
          </div>
        )}

        </div>

        {chips.length ? (
          <div className={`${isCircleNode || isSmallNode ? 'hidden' : ''} mt-2 flex flex-wrap gap-1`}>
            {chips.map((c, idx) => (
              <span
                key={`${c.label}-${idx}`}
                className={`px-1.5 py-0.5 rounded-md text-[9px] tracking-wide border ${
                  c.tone === 'good'
                    ? 'bg-green-500/10 border-green-400/30 text-green-200'
                    : c.tone === 'warn'
                      ? 'bg-amber-500/10 border-amber-400/30 text-amber-200'
                      : c.tone === 'bad'
                        ? 'bg-red-500/10 border-red-400/30 text-red-200'
                        : 'bg-white/5 border-white/10 text-white/70'
                }`}
              >
                {c.label}
              </span>
            ))}
          </div>
        ) : null}

        <div className="pointer-events-none absolute left-2 top-full mt-2 hidden group-hover:block z-50">
          <div className="w-72 rounded-xl border border-white/10 bg-black/70 backdrop-blur-xl px-3 py-2 shadow-2xl">
            <div className="text-[11px] font-semibold text-white truncate">{data.label}</div>
            {subtitle ? <div className="text-[10px] text-white/65 mt-0.5 line-clamp-2">{subtitle}</div> : null}
            {nodeType === 'agent' && typeof config?.prompt === 'string' && config.prompt ? (
              <div className="text-[10px] text-white/70 mt-1 line-clamp-4 leading-snug">{String(config.prompt)}</div>
            ) : null}
            {typeof executionResult !== 'undefined' ? (
              <div className="text-[10px] text-white/65 mt-1 line-clamp-3 leading-snug">{String(executionResult)}</div>
            ) : null}
          </div>
        </div>
        
        {data.isRunning && (
          <div className="absolute -top-2 -right-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-ping" />
          </div>
        )}
        
        {data.executionStatus === 'completed' && (
          <div className="absolute -top-2 -right-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
        )}
        
        {data.executionStatus === 'failed' && (
          <div className="absolute -top-2 -right-2">
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
        )}
      </div>
      
      {showOutputHandle && !showAgentPorts && nodeType !== 'if-else' && (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            className="hidden w-3 h-3 !bg-white border-2 border-gray-700 shadow-[0_0_0_3px_rgba(0,0,0,0.35)]"
            style={{
              backgroundColor: 'rgba(255,255,255,0.92)',
            }}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="error"
            className="hidden w-2.5 h-2.5 rounded-full !bg-red-500/90 border border-red-300/40 shadow-[0_0_0_3px_rgba(0,0,0,0.35)]"
            style={{ top: '72%', transform: 'translateY(-50%)' }}
          />
        </>
      )}

      {nodeType === 'if-else' && (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            className="w-3 h-3 !bg-green-500 border-2 border-gray-700 shadow-[0_0_0_3px_rgba(0,0,0,0.35)]"
            style={{ right: -6, top: '40%', transform: 'translateY(-50%)' }}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            className="w-3 h-3 !bg-red-500 border-2 border-gray-700 shadow-[0_0_0_3px_rgba(0,0,0,0.35)]"
            style={{ right: -6, top: '60%', transform: 'translateY(-50%)' }}
          />
        </>
      )}

      {(isCircleNode || isSmallNode) && (
        <div className="absolute left-1/2 top-full mt-1 -translate-x-1/2 text-[10px] text-white/70 whitespace-nowrap max-w-[180px] truncate">
          {data.label}
        </div>
      )}
    </div>
  );
}

function ResizeHandle({
  minW,
  minH,
  onStart,
  onMove,
  onEnd,
}: {
  minW: number;
  minH: number;
  onStart: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMove: (e: MouseEvent) => void;
  onEnd: () => void;
}) {
  useEffect(() => {
    const handleMove = (e: MouseEvent) => onMove(e);
    const handleUp = () => onEnd();
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [onMove, onEnd]);

  return (
    <div
      className="absolute"
      style={{
        right: 6,
        bottom: 6,
        width: 12,
        height: 12,
        borderRadius: 5,
        cursor: 'nwse-resize',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.8), rgba(255,255,255,0.25))',
        border: '1px solid rgba(0,0,0,0.35)',
        boxShadow: '0 10px 18px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.35)',
        userSelect: 'none',
        touchAction: 'none',
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        onStart(e);
      }}
      aria-hidden
      data-minw={minW}
      data-minh={minH}
    />
  );
}

// Export node types for ReactFlow
import { ConditionalBranchNode } from './nodes/ConditionalBranchNode';
import { ErrorHandlingNode } from './nodes/ErrorHandlingNode';
import { LoopNode } from './nodes/LoopNode';

export const nodeTypes = {
  custom: CustomNode,
  conditionalBranch: ConditionalBranchNode,
  errorHandling: ErrorHandlingNode,
  loopNode: LoopNode,
};

export { CustomNode };
