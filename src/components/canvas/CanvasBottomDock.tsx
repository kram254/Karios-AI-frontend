import React from 'react';
import { Volume2, Image as ImageIcon, Bot, Monitor } from 'lucide-react';

export interface CanvasBottomDockItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export interface CanvasBottomDockProps {
  items?: CanvasBottomDockItem[];
  onAudioClick?: () => void;
  onImageClick?: () => void;
  onAgentClick?: () => void;
  onMonitorClick?: () => void;
  className?: string;
}

const dispatchCanvasEvent = (name: string) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(name));
};

export const CanvasBottomDock: React.FC<CanvasBottomDockProps> = ({
  items,
  onAudioClick,
  onImageClick,
  onAgentClick,
  onMonitorClick,
  className = ''
}) => {
  const defaultItems: CanvasBottomDockItem[] = items || [
    {
      id: 'audio',
      icon: <Volume2 size={16} />,
      label: 'Audio',
      onClick: onAudioClick || (() => dispatchCanvasEvent('canvas:dock-audio'))
    },
    {
      id: 'image',
      icon: <ImageIcon size={16} />,
      label: 'Image',
      onClick: onImageClick || (() => dispatchCanvasEvent('canvas:dock-image'))
    },
    {
      id: 'agent',
      icon: <Bot size={16} />,
      label: 'Agent',
      onClick: onAgentClick || (() => dispatchCanvasEvent('canvas:dock-agent'))
    },
    {
      id: 'monitor',
      icon: <Monitor size={16} />,
      label: 'Live view',
      onClick: onMonitorClick || (() => dispatchCanvasEvent('canvas:dock-monitor'))
    }
  ];

  return (
    <div className={`canvas-bottom-dock ${className}`} role="toolbar" aria-label="Canvas tools">
      <div className="canvas-bottom-dock-handle" aria-hidden />
      <div className="canvas-bottom-dock-items">
        {defaultItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`canvas-bottom-dock-item ${item.active ? 'active' : ''}`}
            onClick={item.onClick}
            aria-label={item.label}
            title={item.label}
            disabled={!!item.disabled}
          >
            {item.icon}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CanvasBottomDock;
