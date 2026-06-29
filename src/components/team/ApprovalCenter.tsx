import React, { useState } from 'react';
import { ShieldCheck, ShieldX, Clock, UserPlus, DollarSign, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { TeamApproval } from '../../services/agentTeamService';

interface ApprovalCenterProps {
  approvals: TeamApproval[];
  onResolve: (approvalId: number, approved: boolean, notes?: string) => void;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  hire_agent: { icon: UserPlus, color: '#00F3FF', label: 'Hire Agent' },
  budget_override: { icon: DollarSign, color: '#F59E0B', label: 'Budget Override' },
  task_escalation: { icon: AlertTriangle, color: '#EF4444', label: 'Task Escalation' },
};

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType }> = {
  pending: { color: '#F59E0B', icon: Clock },
  approved: { color: '#10B981', icon: CheckCircle2 },
  rejected: { color: '#EF4444', icon: XCircle },
  expired: { color: '#6B7280', icon: Clock },
};

const ApprovalCenter: React.FC<ApprovalCenterProps> = ({ approvals, onResolve }) => {
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  const pending = approvals.filter(a => a.status === 'pending');
  const resolved = approvals.filter(a => a.status !== 'pending');

  const handleResolve = (approvalId: number, approved: boolean) => {
    onResolve(approvalId, approved, notes || undefined);
    setResolvingId(null);
    setNotes('');
  };

  if (approvals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <ShieldCheck size={32} className="mb-2 opacity-40" />
        <span className="text-sm">No approval requests</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-amber-400" />
            <span className="text-sm font-medium text-gray-300">Pending Approvals</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400">{pending.length}</span>
          </div>
          <div className="space-y-3">
            {pending.map((approval) => {
              const typeConfig = TYPE_CONFIG[approval.approval_type] || TYPE_CONFIG.hire_agent;
              const TypeIcon = typeConfig.icon;
              const isResolving = resolvingId === approval.id;

              return (
                <div key={approval.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${typeConfig.color}15`, border: `1px solid ${typeConfig.color}30` }}>
                        <TypeIcon size={16} style={{ color: typeConfig.color }} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{typeConfig.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {approval.created_at ? new Date(approval.created_at).toLocaleString() : ''}
                        </div>
                      </div>
                    </div>
                    {!isResolving && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleResolve(approval.id, true)}
                          className="px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 text-xs font-medium hover:bg-green-500/25 transition-colors flex items-center gap-1"
                        >
                          <CheckCircle2 size={12} /> Approve
                        </button>
                        <button
                          onClick={() => setResolvingId(approval.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 text-xs font-medium hover:bg-red-500/25 transition-colors flex items-center gap-1"
                        >
                          <XCircle size={12} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                  {approval.payload && (
                    <div className="mt-3 p-2 rounded-lg bg-white/5 text-xs text-gray-400 font-mono">
                      {JSON.stringify(approval.payload, null, 2).slice(0, 200)}
                    </div>
                  )}
                  {isResolving && (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Rejection reason (optional)"
                        className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-2 text-xs text-white placeholder-gray-600 resize-none"
                        rows={2}
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => { setResolvingId(null); setNotes(''); }}
                          className="px-3 py-1 rounded-lg text-xs text-gray-400 hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleResolve(approval.id, false)}
                          className="px-3 py-1 rounded-lg bg-red-500/15 text-red-400 text-xs font-medium hover:bg-red-500/25 transition-colors"
                        >
                          Confirm Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {resolved.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={14} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-400">Resolved</span>
          </div>
          <div className="space-y-2">
            {resolved.slice(0, 10).map((approval) => {
              const typeConfig = TYPE_CONFIG[approval.approval_type] || TYPE_CONFIG.hire_agent;
              const statusConfig = STATUS_CONFIG[approval.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;

              return (
                <div key={approval.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-[#1A1A1A]">
                  <div className="flex items-center gap-2">
                    <StatusIcon size={12} style={{ color: statusConfig.color }} />
                    <span className="text-xs text-gray-400">{typeConfig.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] uppercase font-medium" style={{ color: statusConfig.color }}>{approval.status}</span>
                    <span className="text-[10px] text-gray-600">
                      {approval.resolved_at ? new Date(approval.resolved_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalCenter;
