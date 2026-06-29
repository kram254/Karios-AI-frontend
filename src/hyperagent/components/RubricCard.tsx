import React from 'react';
import { Scale, CheckCircle, XCircle, Zap, Bot } from 'lucide-react';
import type { EvaluationRubric } from '../types';

interface RubricCardProps {
  rubric: EvaluationRubric;
  onClick?: (rubric: EvaluationRubric) => void;
  onToggleAuto?: (rubric: EvaluationRubric) => void;
}

const scoringMethodLabels: Record<string, string> = {
  llm_judge: 'LLM Judge',
  human: 'Human Review',
  hybrid: 'Hybrid'
};

export const RubricCard: React.FC<RubricCardProps> = ({
  rubric,
  onClick,
  onToggleAuto
}) => {
  return (
    <div
      onClick={() => onClick?.(rubric)}
      className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{rubric.name}</h3>
            <p className="text-sm text-gray-500">{rubric.dimensions.length} dimensions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            rubric.auto_trigger ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {rubric.auto_trigger ? 'Auto' : 'Manual'}
          </span>
        </div>
      </div>

      <p className="mt-3 text-sm text-gray-600">{rubric.description}</p>

      <div className="mt-4">
        <p className="text-xs text-gray-500 mb-2">Evaluation Criteria:</p>
        <div className="flex flex-wrap gap-2">
          {rubric.dimensions.slice(0, 3).map((dim, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700"
            >
              {dim.name} ({Math.round(dim.weight * 100)}%)
            </span>
          ))}
          {rubric.dimensions.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-500">
              +{rubric.dimensions.length - 3} more
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-1 text-gray-500">
          <Bot className="w-4 h-4" />
          <span>{scoringMethodLabels[rubric.scoring_method]}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-500">
          <Zap className="w-4 h-4" />
          <span>{rubric.judge_model}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-2 text-center text-sm">
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-500" />
          <span className="text-gray-600">Low: {rubric.on_low_score_action}</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-gray-600">High: {rubric.on_high_score_action}</span>
        </div>
      </div>

      {onToggleAuto && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleAuto(rubric);
          }}
          className={`mt-3 w-full py-2 rounded-lg text-sm font-medium transition-colors ${
            rubric.auto_trigger
              ? 'bg-green-50 text-green-600 hover:bg-green-100'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          {rubric.auto_trigger ? 'Disable Auto-Evaluation' : 'Enable Auto-Evaluation'}
        </button>
      )}
    </div>
  );
};
