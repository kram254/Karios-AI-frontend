import React, { useEffect, useState, useRef, ReactNode } from 'react';
import { artifactManager } from '../../services/artifactManager.service';

interface CanvasLayoutProps {
  chatContent: ReactNode;
  artifactContent: ReactNode | null;
  onResize?: (chatWidth: number, artifactWidth: number) => void;
}

export const CanvasLayout: React.FC<CanvasLayoutProps> = ({
  chatContent,
  artifactContent,
  onResize
}) => {
  const [layoutMode, setLayoutMode] = useState<'chat' | 'split' | 'artifact-focused'>('chat');
  const [splitRatio, setSplitRatio] = useState({ chat: 100, artifact: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number>(0);
  const dragStartRatio = useRef({ chat: 35, artifact: 65 });

  useEffect(() => {
    const unsubscribe = artifactManager.subscribe((state) => {
      setLayoutMode(state.layoutMode);
      setSplitRatio(state.splitRatio);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.offsetWidth;
      const optimal = artifactManager.calculateOptimalSplitRatio(
        width,
        layoutMode !== 'chat'
      );
      if (layoutMode !== 'chat') {
        artifactManager.updateSplitRatio(optimal.chat, optimal.artifact);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [layoutMode]);

  const handleDragStart = (e: React.MouseEvent) => {
    if (layoutMode !== 'split') return;
    
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartRatio.current = { ...splitRatio };
    
    e.preventDefault();
  };

  const handleDragMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const deltaX = e.clientX - dragStartX.current;
    const deltaPercent = (deltaX / containerWidth) * 100;

    let newChatPercent = dragStartRatio.current.chat + deltaPercent;
    newChatPercent = Math.max(20, Math.min(80, newChatPercent));

    const newArtifactPercent = 100 - newChatPercent;

    setSplitRatio({ chat: newChatPercent, artifact: newArtifactPercent });
    
    if (onResize) {
      onResize(newChatPercent, newArtifactPercent);
    }
  };

  const handleDragEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      artifactManager.updateSplitRatio(splitRatio.chat, splitRatio.artifact);
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, splitRatio]);

  const getGridTemplate = (): string => {
    if (layoutMode === 'chat' || !artifactContent) {
      return '100fr';
    }
    if (layoutMode === 'artifact-focused') {
      return '20fr 80fr';
    }
    return `${splitRatio.chat}fr ${splitRatio.artifact}fr`;
  };

  return (
    <div
      ref={containerRef}
      className="canvas-layout-container"
      style={{
        display: 'grid',
        gridTemplateColumns: getGridTemplate(),
        height: '100%',
        width: '100%',
        transition: isDragging ? 'none' : 'grid-template-columns 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden'
      }}
    >
      <div
        className="canvas-chat-panel"
        style={{
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          opacity: layoutMode === 'artifact-focused' ? 0.7 : 1,
          transition: 'opacity 0.2s ease-in-out'
        }}
      >
        {chatContent}
      </div>

      {layoutMode !== 'chat' && artifactContent && (
        <>
          <div
            className="canvas-resize-handle"
            onMouseDown={handleDragStart}
            style={{
              width: '4px',
              cursor: 'col-resize',
              background: isDragging 
                ? 'linear-gradient(90deg, rgba(0,243,255,0.5) 0%, rgba(0,243,255,0.8) 50%, rgba(0,243,255,0.5) 100%)'
                : 'transparent',
              transition: 'background 0.2s ease',
              position: 'relative',
              zIndex: 10,
              marginLeft: '-2px',
              marginRight: '-2px'
            }}
            onMouseEnter={(e) => {
              if (!isDragging) {
                (e.target as HTMLElement).style.background = 
                  'linear-gradient(90deg, rgba(0,243,255,0.2) 0%, rgba(0,243,255,0.4) 50%, rgba(0,243,255,0.2) 100%)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDragging) {
                (e.target as HTMLElement).style.background = 'transparent';
              }
            }}
          />

          <div
            className="canvas-artifact-panel"
            style={{
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              transform: `translateX(${isResizing ? '0' : '0'})`,
              transition: isResizing ? 'none' : 'transform 0.3s ease-out'
            }}
          >
            {artifactContent}
          </div>
        </>
      )}
    </div>
  );
};
