import React from 'react';
import { Copy, Play, HelpCircle, Download, Table, CheckSquare, ExternalLink, Globe, Calendar, Users } from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface QuickActionsProps {
  messageContent: string;
  onAction: (actionId: string, content?: string) => void;
}

const detectContentType = (content: string): string[] => {
  const types: string[] = [];
  if (/```[\s\S]*?```/.test(content)) types.push('code');
  if (/^[-*]\s|^\d+\.\s/m.test(content)) types.push('list');
  if (/https?:\/\/[^\s]+/.test(content)) types.push('url');
  if (/task|todo|action item|step \d/i.test(content)) types.push('task');
  return types;
};

export const QuickActions: React.FC<QuickActionsProps> = ({ messageContent, onAction }) => {
  const contentTypes = detectContentType(messageContent);
  const actions: QuickAction[] = [];

  if (contentTypes.includes('code')) {
    actions.push(
      { id: 'copy_code', label: 'Copy', icon: <Copy className="w-3 h-3" />, onClick: () => onAction('copy_code', messageContent) },
      { id: 'run_code', label: 'Run', icon: <Play className="w-3 h-3" />, onClick: () => onAction('run_code') },
      { id: 'explain_code', label: 'Explain', icon: <HelpCircle className="w-3 h-3" />, onClick: () => onAction('explain_code') }
    );
  }

  if (contentTypes.includes('list')) {
    actions.push(
      { id: 'export_list', label: 'Export', icon: <Download className="w-3 h-3" />, onClick: () => onAction('export_list') },
      { id: 'to_checklist', label: 'Checklist', icon: <CheckSquare className="w-3 h-3" />, onClick: () => onAction('to_checklist') },
      { id: 'to_table', label: 'Table', icon: <Table className="w-3 h-3" />, onClick: () => onAction('to_table') }
    );
  }

  if (contentTypes.includes('url')) {
    actions.push(
      { id: 'open_url', label: 'Open', icon: <ExternalLink className="w-3 h-3" />, onClick: () => onAction('open_url') },
      { id: 'scrape_url', label: 'Scrape', icon: <Globe className="w-3 h-3" />, onClick: () => onAction('scrape_url') }
    );
  }

  if (contentTypes.includes('task')) {
    actions.push(
      { id: 'create_task', label: 'Create Task', icon: <CheckSquare className="w-3 h-3" />, onClick: () => onAction('create_task') },
      { id: 'schedule', label: 'Schedule', icon: <Calendar className="w-3 h-3" />, onClick: () => onAction('schedule') },
      { id: 'delegate', label: 'Delegate', icon: <Users className="w-3 h-3" />, onClick: () => onAction('delegate') }
    );
  }

  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
      {actions.slice(0, 5).map(action => (
        <button
          key={action.id}
          onClick={action.onClick}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 transition-colors"
          title={action.label}
        >
          {action.icon}
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
};

export default QuickActions;
