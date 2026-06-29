import React from 'react';
import { Users, Activity, TrendingUp, DollarSign, Clock } from 'lucide-react';
import type { FleetOverview } from '../types';

interface FleetCardProps {
  overview: FleetOverview;
}

export const FleetCard: React.FC<FleetCardProps> = ({ overview }) => {
  const { summary } = overview;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Fleet Overview</h2>
          <p className="text-sm text-gray-500">Your agent workforce at a glance</p>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <Users className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Total Agents</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{summary.total_agents}</p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-blue-600">Active Now</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">{summary.active_now}</p>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-600">Avg Score</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{summary.avg_rubric_score}%</p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-purple-600">Hours Saved</span>
          </div>
          <p className="text-2xl font-bold text-purple-700">{summary.estimated_human_hours_saved}h</p>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Token Usage (24h)</span>
          <span className="font-medium text-gray-900">
            {summary.total_token_usage_24h.toLocaleString()} tokens
          </span>
        </div>
        <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
            style={{ width: `${Math.min((summary.total_token_usage_24h / 1000000) * 100, 100)}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-lg font-semibold text-gray-900">{summary.idle}</p>
          <p className="text-xs text-gray-500">Idle</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900">{summary.learning}</p>
          <p className="text-xs text-gray-500">Learning</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900">{summary.deployed}</p>
          <p className="text-xs text-gray-500">Deployed</p>
        </div>
      </div>
    </div>
  );
};
