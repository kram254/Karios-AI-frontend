import React, { useEffect, useState } from 'react';
import { Crown, Code2, Megaphone, DollarSign, Settings, Paintbrush, Shield, Search, Users, ChevronDown, ChevronRight, Circle } from 'lucide-react';
import type { OrgChartNode } from '../../services/agentTeamService';

interface OrgChartProps {
  nodes: OrgChartNode[];
  onMemberClick?: (memberId: number) => void;
}

const ROLE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  ceo: { icon: Crown, color: '#FFD700', bg: 'rgba(255, 215, 0, 0.15)' },
  cto: { icon: Code2, color: '#00F3FF', bg: 'rgba(0, 243, 255, 0.15)' },
  cmo: { icon: Megaphone, color: '#FF6B9D', bg: 'rgba(255, 107, 157, 0.15)' },
  cfo: { icon: DollarSign, color: '#4ADE80', bg: 'rgba(74, 222, 128, 0.15)' },
  coo: { icon: Settings, color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.15)' },
  engineer: { icon: Code2, color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)' },
  designer: { icon: Paintbrush, color: '#F472B6', bg: 'rgba(244, 114, 182, 0.15)' },
  qa: { icon: Shield, color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.15)' },
  researcher: { icon: Search, color: '#34D399', bg: 'rgba(52, 211, 153, 0.15)' },
  pm: { icon: Users, color: '#C084FC', bg: 'rgba(192, 132, 252, 0.15)' },
  general: { icon: Users, color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.15)' },
};

const STATUS_COLORS: Record<string, string> = {
  active: '#4ADE80',
  idle: '#94A3B8',
  running: '#00F3FF',
  paused: '#FBBF24',
  error: '#EF4444',
  pending_approval: '#F59E0B',
  terminated: '#6B7280',
};

const OrgChartNode: React.FC<{ node: OrgChartNode; depth: number; onMemberClick?: (id: number) => void }> = ({ node, depth, onMemberClick }) => {
  const [expanded, setExpanded] = useState(true);
  const config = ROLE_CONFIG[node.role] || ROLE_CONFIG.general;
  const Icon = config.icon;
  const statusColor = STATUS_COLORS[node.status] || '#94A3B8';
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div style={{ marginLeft: depth > 0 ? 24 : 0 }}>
      <div
        className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-white/5"
        style={{ borderLeft: depth > 0 ? `2px solid ${config.color}33` : 'none' }}
        onClick={() => onMemberClick?.(node.id)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-white"
          >
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : (
          <div className="w-4" />
        )}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: config.bg, border: `1px solid ${config.color}40` }}
        >
          <Icon size={14} style={{ color: config.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white truncate">{node.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-medium" style={{ color: config.color, background: config.bg }}>
              {node.role}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Circle size={6} fill={statusColor} stroke="none" />
          <span className="text-[10px] text-gray-500 capitalize">{node.status}</span>
        </div>
      </div>
      {expanded && hasChildren && (
        <div className="mt-0.5">
          {node.children.map((child) => (
            <OrgChartNode key={child.id} node={child} depth={depth + 1} onMemberClick={onMemberClick} />
          ))}
        </div>
      )}
    </div>
  );
};

const OrgChart: React.FC<OrgChartProps> = ({ nodes, onMemberClick }) => {
  if (!nodes || nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Users size={32} className="mb-2 opacity-40" />
        <span className="text-sm">No team members yet</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {nodes.map((node) => (
        <OrgChartNode key={node.id} node={node} depth={0} onMemberClick={onMemberClick} />
      ))}
    </div>
  );
};

export default OrgChart;
