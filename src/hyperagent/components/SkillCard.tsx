import React from 'react';
import { Zap, Star, TrendingUp, Clock } from 'lucide-react';
import type { HyperSkill } from '../types';

interface SkillCardProps {
  skill: HyperSkill;
  onClick?: (skill: HyperSkill) => void;
  onPin?: (skill: HyperSkill) => void;
}

const categoryColors: Record<string, string> = {
  general: 'bg-gray-100 text-gray-700',
  performance: 'bg-blue-100 text-blue-700',
  security: 'bg-red-100 text-red-700',
  ui: 'bg-purple-100 text-purple-700',
  api: 'bg-green-100 text-green-700',
  testing: 'bg-yellow-100 text-yellow-700',
  content: 'bg-pink-100 text-pink-700',
  research: 'bg-indigo-100 text-indigo-700',
  automation: 'bg-cyan-100 text-cyan-700'
};

const categoryIcons: Record<string, string> = {
  general: '🔧',
  performance: '⚡',
  security: '🔒',
  ui: '🎨',
  api: '🔌',
  testing: '🧪',
  content: '✍️',
  research: '🔍',
  automation: '🤖'
};

export const SkillCard: React.FC<SkillCardProps> = ({
  skill,
  onClick,
  onPin
}) => {
  const score = skill.avg_rubric_score;
  let scoreColor = 'text-gray-500';
  if (score >= 80) scoreColor = 'text-green-600';
  else if (score >= 60) scoreColor = 'text-yellow-600';
  else if (score > 0) scoreColor = 'text-red-600';

  return (
    <div
      onClick={() => onClick?.(skill)}
      className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-lg">
            {categoryIcons[skill.category] || '🔧'}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{skill.name}</h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${categoryColors[skill.category] || categoryColors.general}`}>
              {skill.category}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400">v{skill.version}</span>
        </div>
      </div>

      <p className="mt-3 text-sm text-gray-600 line-clamp-2">{skill.description}</p>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm">
            <Zap className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{skill.total_uses.toLocaleString()} uses</span>
          </div>
          {skill.last_used && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Recently used</span>
            </div>
          )}
        </div>

        {score > 0 && (
          <div className="flex items-center gap-1">
            <Star className={`w-4 h-4 ${scoreColor}`} />
            <span className={`text-sm font-medium ${scoreColor}`}>{score.toFixed(1)}</span>
          </div>
        )}
      </div>

      {skill.components?.promptTemplate && (
        <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-500 font-mono line-clamp-2">
          {skill.components.promptTemplate.slice(0, 100)}...
        </div>
      )}

      {onPin && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPin(skill);
          }}
          className="mt-3 w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
        >
          Pin to Agent
        </button>
      )}
    </div>
  );
};
