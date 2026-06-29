import React from 'react';
import { Star, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface QualityMetrics {
  overallScore: number;
  completeness: number;
  accuracy: number;
  relevance: number;
  efficiency: number;
  suggestions?: string[];
}

interface QualityIndicatorProps {
  metrics: QualityMetrics;
  previousScore?: number;
}

export const QualityIndicator: React.FC<QualityIndicatorProps> = ({
  metrics,
  previousScore
}) => {
  const { overallScore, completeness, accuracy, relevance, efficiency, suggestions } = metrics;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  const scoreDelta = previousScore ? overallScore - previousScore : 0;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className={`w-5 h-5 ${getScoreColor(overallScore)}`} />
          <span className="text-sm font-semibold">Quality Score</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
            {overallScore}%
          </div>
          {scoreDelta !== 0 && (
            <div className={`flex items-center gap-1 text-sm ${scoreDelta > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {scoreDelta > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(scoreDelta)}%
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {[
          { label: 'Completeness', value: completeness },
          { label: 'Accuracy', value: accuracy },
          { label: 'Relevance', value: relevance },
          { label: 'Efficiency', value: efficiency }
        ].map((metric) => (
          <div key={metric.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">{metric.label}</span>
              <span className={`font-medium ${getScoreColor(metric.value)}`}>
                {metric.value}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <motion.div
                className={`${getScoreBg(metric.value)} h-1.5 rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${metric.value}%` }}
                transition={{ duration: 0.5, delay: 0.1 }}
              />
            </div>
          </div>
        ))}
      </div>

      {suggestions && suggestions.length > 0 && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium">Improvement Suggestions</span>
          </div>
          <ul className="space-y-1">
            {suggestions.map((suggestion, idx) => (
              <li key={idx} className="text-xs text-gray-600 dark:text-gray-400 pl-4">
                • {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
