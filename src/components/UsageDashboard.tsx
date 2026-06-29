import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  TrendingUpIcon, 
  ActivityIcon, 
  DollarSignIcon, 
  ZapIcon,
  AlertCircleIcon,
  CheckCircleIcon
} from 'lucide-react';

interface UsageData {
  tier: {
    name: string;
    tier_id: string;
    price_monthly: number;
  };
  usage: {
    research_queries: number;
    automation_runs: number;
    api_calls: number;
  };
  limits: {
    research_queries_per_month: number;
    automation_runs_per_month: number;
    api_calls_per_month: number;
  };
  usage_percentage: {
    research_queries_per_month: number;
    automation_runs_per_month: number;
    api_calls_per_month: number;
  };
  cost_optimization: {
    model_routing_savings_pct: number;
    cache_hit_rate_pct: number;
    estimated_savings_usd: number;
  };
  recommendations: string[];
}

interface UsageDashboardProps {
  userId: string;
}

const UsageDashboard: React.FC<UsageDashboardProps> = ({ userId }) => {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
    const interval = setInterval(fetchUsage, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const fetchUsage = async () => {
    try {
      const response = await axios.get(`/api/billing/usage/${userId}`);
      setUsageData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch usage:', error);
      setLoading(false);
    }
  };

  const formatLimit = (limit: number) => {
    if (limit === -1) return 'Unlimited';
    return limit.toLocaleString();
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getUsageTextColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!usageData) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Unable to load usage data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold">{usageData.tier.name}</h2>
            <p className="text-blue-100">Current subscription tier</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              {usageData.tier.price_monthly === 0 ? 'Free' : `$${usageData.tier.price_monthly}`}
            </div>
            {usageData.tier.price_monthly > 0 && (
              <p className="text-blue-100">per month</p>
            )}
          </div>
        </div>
        <button 
          onClick={() => window.location.href = '/pricing'}
          className="w-full bg-white text-blue-600 font-semibold py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Upgrade Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <ActivityIcon className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="font-semibold text-gray-900">Research Queries</h3>
            </div>
            <span className={`text-sm font-semibold ${getUsageTextColor(usageData.usage_percentage.research_queries_per_month)}`}>
              {usageData.usage_percentage.research_queries_per_month.toFixed(0)}%
            </span>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{usageData.usage.research_queries.toLocaleString()}</span>
              <span>{formatLimit(usageData.limits.research_queries_per_month)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getUsageColor(usageData.usage_percentage.research_queries_per_month)}`}
                style={{ width: `${Math.min(100, usageData.usage_percentage.research_queries_per_month)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <ZapIcon className="w-5 h-5 text-purple-600 mr-2" />
              <h3 className="font-semibold text-gray-900">Automation Runs</h3>
            </div>
            <span className={`text-sm font-semibold ${getUsageTextColor(usageData.usage_percentage.automation_runs_per_month)}`}>
              {usageData.usage_percentage.automation_runs_per_month.toFixed(0)}%
            </span>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{usageData.usage.automation_runs.toLocaleString()}</span>
              <span>{formatLimit(usageData.limits.automation_runs_per_month)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getUsageColor(usageData.usage_percentage.automation_runs_per_month)}`}
                style={{ width: `${Math.min(100, usageData.usage_percentage.automation_runs_per_month)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <TrendingUpIcon className="w-5 h-5 text-green-600 mr-2" />
              <h3 className="font-semibold text-gray-900">API Calls</h3>
            </div>
            <span className={`text-sm font-semibold ${getUsageTextColor(usageData.usage_percentage.api_calls_per_month)}`}>
              {usageData.usage_percentage.api_calls_per_month.toFixed(0)}%
            </span>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{usageData.usage.api_calls.toLocaleString()}</span>
              <span>{formatLimit(usageData.limits.api_calls_per_month)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getUsageColor(usageData.usage_percentage.api_calls_per_month)}`}
                style={{ width: `${Math.min(100, usageData.usage_percentage.api_calls_per_month)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow p-6 border border-green-200">
        <div className="flex items-center mb-4">
          <DollarSignIcon className="w-6 h-6 text-green-600 mr-2" />
          <h3 className="text-xl font-bold text-gray-900">Cost Optimization</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Model Routing Savings</div>
            <div className="text-2xl font-bold text-green-600">
              {usageData.cost_optimization.model_routing_savings_pct.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">vs always using GPT-4</div>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Cache Hit Rate</div>
            <div className="text-2xl font-bold text-blue-600">
              {usageData.cost_optimization.cache_hit_rate_pct.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">queries served from cache</div>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Total Savings</div>
            <div className="text-2xl font-bold text-green-600">
              ${usageData.cost_optimization.estimated_savings_usd.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 mt-1">this month</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">How we optimize your costs:</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Intelligent routing to cost-effective models for simple queries</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Semantic caching eliminates redundant API calls</span>
            </li>
            <li className="flex items-start">
              <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Premium models only when complexity requires it</span>
            </li>
          </ul>
        </div>
      </div>

      {usageData.recommendations.length > 0 && (
        <div className="bg-blue-50 rounded-lg shadow p-6 border border-blue-200">
          <div className="flex items-center mb-4">
            <AlertCircleIcon className="w-6 h-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-bold text-gray-900">Recommendations</h3>
          </div>
          <ul className="space-y-2">
            {usageData.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start text-gray-700">
                <span className="text-blue-600 mr-2">•</span>
                <span>{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Usage History</h3>
        <div className="text-center text-gray-500 py-8">
          <ActivityIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>Detailed usage charts coming soon</p>
          <p className="text-sm mt-1">Track your usage trends over time</p>
        </div>
      </div>
    </div>
  );
};

export default UsageDashboard;
