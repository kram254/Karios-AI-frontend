import React from 'react';
import { DollarSign, TrendingUp, AlertTriangle, Shield, Users } from 'lucide-react';
import type { BudgetOverview } from '../../services/agentTeamService';

interface BudgetDashboardProps {
  overview: BudgetOverview | null;
  incidents?: any[];
  onResolveIncident?: (incidentId: number) => void;
}

const formatCents = (cents: number): string => {
  return `$${(cents / 100).toFixed(2)}`;
};

const BudgetDashboard: React.FC<BudgetDashboardProps> = ({ overview, incidents, onResolveIncident }) => {
  if (!overview) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <DollarSign size={24} className="mr-2 opacity-40" />
        <span className="text-sm">No budget data available</span>
      </div>
    );
  }

  const utilization = overview.budget_utilization_pct || 0;
  const barColor = utilization >= 90 ? '#EF4444' : utilization >= 70 ? '#F59E0B' : '#10B981';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <DollarSign size={14} className="text-green-400" />
            </div>
            <span className="text-xs text-gray-400 uppercase tracking-wider">Monthly Budget</span>
          </div>
          <div className="text-2xl font-bold text-white">{formatCents(overview.monthly_budget_cents || 0)}</div>
          <div className="mt-2 text-xs text-gray-500">
            Spent: {formatCents(overview.spent_monthly_cents || 0)}
          </div>
        </div>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <TrendingUp size={14} className="text-cyan-400" />
            </div>
            <span className="text-xs text-gray-400 uppercase tracking-wider">Utilization</span>
          </div>
          <div className="text-2xl font-bold text-white">{utilization.toFixed(1)}%</div>
          <div className="mt-2 h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(utilization, 100)}%`, backgroundColor: barColor }}
            />
          </div>
        </div>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Shield size={14} className="text-purple-400" />
            </div>
            <span className="text-xs text-gray-400 uppercase tracking-wider">Total Spent</span>
          </div>
          <div className="text-2xl font-bold text-white">{formatCents(overview.total_spent_cents || 0)}</div>
          <div className="mt-2 text-xs text-gray-500">
            {overview.policies?.length || 0} active policies
          </div>
        </div>
      </div>

      {overview.member_spend && overview.member_spend.length > 0 && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Users size={14} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Member Spend</span>
          </div>
          <div className="space-y-3">
            {overview.member_spend.map((ms: any, i: number) => {
              const memberBudget = ms.monthly_budget_cents || overview.monthly_budget_cents || 1;
              const memberUtil = memberBudget > 0 ? (ms.spent_monthly_cents / memberBudget) * 100 : 0;
              const mBarColor = memberUtil >= 90 ? '#EF4444' : memberUtil >= 70 ? '#F59E0B' : '#10B981';
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-24 text-xs text-gray-400 truncate">{ms.name}</div>
                  <div className="text-[10px] text-gray-500 uppercase w-16">{ms.role}</div>
                  <div className="flex-1 h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(memberUtil, 100)}%`, backgroundColor: mBarColor }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 w-16 text-right">{formatCents(ms.spent_monthly_cents)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {incidents && incidents.length > 0 && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={14} className="text-amber-400" />
            <span className="text-sm font-medium text-gray-300">Budget Incidents</span>
          </div>
          <div className="space-y-2">
            {incidents.map((inc: any) => (
              <div key={inc.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase ${inc.threshold_type === 'hard' ? 'text-red-400 bg-red-500/15' : 'text-amber-400 bg-amber-500/15'}`}>
                    {inc.threshold_type}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatCents(inc.amount_cents)} / {formatCents(inc.limit_cents)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500">{inc.created_at ? new Date(inc.created_at).toLocaleDateString() : ''}</span>
                  {!inc.resolved && onResolveIncident && (
                    <button
                      onClick={() => onResolveIncident(inc.id)}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      Resolve
                    </button>
                  )}
                  {inc.resolved && <span className="text-[10px] text-green-400">Resolved</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetDashboard;
