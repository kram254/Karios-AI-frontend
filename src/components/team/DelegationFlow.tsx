import React from 'react';
import { GitBranch, ArrowRight, CheckCircle2, MessageSquare, User } from 'lucide-react';
import type { TeamMember, TeamTask } from '../../services/agentTeamService';

interface DelegationFlowProps {
  members: TeamMember[];
  tasks: TeamTask[];
}

const ROLE_COLORS: Record<string, string> = {
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

const ROLE_ICONS: Record<string, string> = {
  ceo: '👑',
  cto: '⚙️',
  cmo: '📢',
  cfo: '📊',
  engineer: '💻',
  designer: '🎨',
  pm: '📋',
  qa: '✅',
  devops: '🖥️',
  researcher: '🔍',
  sales: '📈',
  support: '🎧',
  general: '👤',
};

interface FlowNode {
  id: number;
  name: string;
  role: string;
  level: number;
  children: FlowNode[];
}

function buildOrgTree(members: TeamMember[]): FlowNode[] {
  const memberMap = new Map<number, TeamMember>();
  const nodeMap = new Map<number, FlowNode>();
  
  members.forEach(m => {
    memberMap.set(m.id, m);
    nodeMap.set(m.id, {
      id: m.id,
      name: m.name,
      role: m.role,
      level: 0,
      children: [],
    });
  });
  
  const roots: FlowNode[] = [];
  
  members.forEach(m => {
    const node = nodeMap.get(m.id)!;
    if (m.reports_to_id && nodeMap.has(m.reports_to_id)) {
      const parent = nodeMap.get(m.reports_to_id)!;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });
  
  const setLevels = (nodes: FlowNode[], level: number) => {
    nodes.forEach(n => {
      n.level = level;
      setLevels(n.children, level + 1);
    });
  };
  
  setLevels(roots, 0);
  
  return roots;
}

const DelegationFlow: React.FC<DelegationFlowProps> = ({ members, tasks }) => {
  const orgTree = buildOrgTree(members);
  const activeTasks = tasks.filter(t => t.status === 'in_progress' || t.status === 'todo');
  
  const renderNode = (node: FlowNode, isLast: boolean = true) => {
    const color = ROLE_COLORS[node.role] || '#6b7280';
    const icon = ROLE_ICONS[node.role] || '👤';
    const memberTasks = activeTasks.filter(t => t.assignee_id === node.id);
    
    return (
      <div key={node.id} className="flex">
        <div className="flex flex-col items-center">
          <div 
            className="w-32 p-3 rounded-lg border bg-[#1A1A1A] flex flex-col items-center gap-2"
            style={{ borderColor: `${color}40` }}
          >
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
              style={{ backgroundColor: `${color}20` }}
            >
              {icon}
            </div>
            <div className="text-center">
              <div className="text-xs font-medium text-white truncate w-full">{node.name}</div>
              <div 
                className="text-[10px] uppercase tracking-wider"
                style={{ color }}
              >
                {node.role}
              </div>
            </div>
            {memberTasks.length > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-gray-500">
                <GitBranch size={10} />
                <span>{memberTasks.length} tasks</span>
              </div>
            )}
          </div>
          
          {node.children.length > 0 && (
            <div className="mt-4 flex gap-4">
              {node.children.map((child, idx) => (
                <div key={child.id} className="relative">
                  <div 
                    className="absolute -top-4 left-1/2 w-px h-4 bg-gray-700"
                    style={{ transform: 'translateX(-50%)' }}
                  />
                  {idx === 0 && node.children.length > 1 && (
                    <div 
                      className="absolute -top-4 left-1/2 h-px bg-gray-700"
                      style={{ 
                        width: `${(node.children.length - 1) * 144}px`,
                        transform: 'translateX(-50%)',
                      }}
                    />
                  )}
                  {renderNode(child, idx === node.children.length - 1)}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {!isLast && (
          <div className="flex items-center px-2">
            <ArrowRight size={16} className="text-gray-600" />
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch size={16} className="text-cyan-400" />
          <h3 className="text-sm font-medium text-white">Organization Structure</h3>
        </div>
        <p className="text-xs text-gray-500 mb-6">
          Work flows down the org tree through delegation. Every agent (except the CEO) reports to a manager, 
          creating a clear tree of accountability.
        </p>
        
        {orgTree.length > 0 ? (
          <div className="flex justify-center overflow-x-auto pb-4">
            <div className="flex gap-8">
              {orgTree.map((root, idx) => (
                <div key={root.id}>
                  {renderNode(root, idx === orgTree.length - 1)}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm">
            No team members yet
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={14} className="text-green-400" />
            <h4 className="text-xs font-medium text-white">Manager Responsibilities</h4>
          </div>
          <ul className="space-y-2 text-xs text-gray-400">
            <li className="flex items-start gap-2">
              <ArrowRight size={10} className="mt-0.5 text-cyan-500" />
              <span>Receive delegated work from your manager</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight size={10} className="mt-0.5 text-cyan-500" />
              <span>Break it down into tasks for your reports</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight size={10} className="mt-0.5 text-cyan-500" />
              <span>Assign work based on capabilities</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight size={10} className="mt-0.5 text-cyan-500" />
              <span>Monitor progress via task status</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight size={10} className="mt-0.5 text-cyan-500" />
              <span>Report upward on outcomes and blockers</span>
            </li>
          </ul>
        </div>
        
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={14} className="text-purple-400" />
            <h4 className="text-xs font-medium text-white">Delegation Flow</h4>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs">
              <div className="w-6 h-6 rounded bg-amber-500/20 flex items-center justify-center text-[10px]">👑</div>
              <ArrowRight size={12} className="text-gray-600" />
              <div className="w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center text-[10px]">⚙️</div>
              <ArrowRight size={12} className="text-gray-600" />
              <div className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center text-[10px]">💻</div>
              <span className="text-gray-500 ml-2">Task assignment</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center text-[10px]">💻</div>
              <ArrowRight size={12} className="text-gray-600 rotate-180" />
              <div className="w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center text-[10px]">⚙️</div>
              <ArrowRight size={12} className="text-gray-600 rotate-180" />
              <div className="w-6 h-6 rounded bg-amber-500/20 flex items-center justify-center text-[10px]">👑</div>
              <span className="text-gray-500 ml-2">Status updates</span>
            </div>
            <div className="mt-3 pt-3 border-t border-[#2A2A2A] text-[10px] text-gray-500">
              Clear reporting lines ensure work flows from CEO down to ICs, 
              with status flowing back up the chain.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DelegationFlow;
