import React from 'react';
import { CopyableCard } from './CopyableCard';

interface PhaseItem {
  id: number;
  title: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'error';
}

interface PhaseCardProps {
  phase: {
    title: string;
    subtitle?: string;
    items: PhaseItem[];
    status?: 'pending' | 'in_progress' | 'completed' | 'error';
  };
  isCollapsible?: boolean;
}

export const PhaseCard: React.FC<PhaseCardProps> = ({ phase, isCollapsible = true }) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusDot = (status?: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500 animate-pulse';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const content = `${phase.title}\n${phase.items.map(item => `${item.id}. ${item.title}`).join('\n')}`;

  return (
    <CopyableCard title={phase.title} content={content}>
      <div className="space-y-3">
        {phase.subtitle && (
          <p className="text-sm text-gray-600 font-medium">{phase.subtitle}</p>
        )}
        
        <div className="space-y-2">
          {phase.items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 p-3 rounded-md hover:bg-gray-50 transition-colors">
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getStatusDot(item.status)}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{item.id}.</span>
                  <span className="text-gray-900">{item.title}</span>
                  {item.status && (
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-sm text-gray-600 mt-1 ml-6">{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </CopyableCard>
  );
};
