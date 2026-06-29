import React, { useEffect, useState, useRef, ReactNode } from 'react';
import { artifactManager } from '../../services/artifactManager.service';

interface CanvasLayoutProps {
  chatContent: ReactNode;
  artifactContent: ReactNode | null;
  onResize?: (chatWidth: number, artifactWidth: number) => void;
  forceSplit?: boolean;
  centeredMode?: boolean;
  isChatFullscreen?: boolean;
  endlessCanvas?: ReactNode;
  topBar?: ReactNode;
  projectBadge?: ReactNode;
  bottomDock?: ReactNode;
}

export const CanvasLayout: React.FC<CanvasLayoutProps> = ({
  chatContent,
  artifactContent,
  onResize,
  forceSplit = false,
  centeredMode = false,
  isChatFullscreen = false,
  endlessCanvas,
  topBar,
  projectBadge,
  bottomDock
}) => {
  const [layoutMode, setLayoutMode] = useState<'chat' | 'split' | 'artifact-focused'>('chat');
  const [splitRatio, setSplitRatio] = useState({ chat: 100, artifact: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isHoveringHandle, setIsHoveringHandle] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number>(0);
  const dragStartRatio = useRef({ chat: 42, artifact: 58 });

  const CHAT_WIDTH_MIN = 380;
  const CHAT_WIDTH_MAX = 820;
  const [chatColumnWidth, setChatColumnWidth] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = window.localStorage.getItem('canvas:chatColumnWidth');
      if (stored) {
        const n = parseInt(stored, 10);
        if (!isNaN(n) && n >= CHAT_WIDTH_MIN && n <= CHAT_WIDTH_MAX) return n;
      }
    } catch {}
    return null;
  });
  const [isResizingChat, setIsResizingChat] = useState(false);
  const chatResizeStartX = useRef<number>(0);
  const chatResizeStartWidth = useRef<number>(0);
  const chatColumnRef = useRef<HTMLDivElement>(null);

  const startChatResize = (e: React.MouseEvent) => {
    if (!chatColumnRef.current) return;
    e.preventDefault();
    chatResizeStartX.current = e.clientX;
    chatResizeStartWidth.current = chatColumnRef.current.getBoundingClientRect().width;
    setIsResizingChat(true);
  };

  useEffect(() => {
    if (!isResizingChat) return;
    const handleMove = (e: MouseEvent) => {
      const delta = e.clientX - chatResizeStartX.current;
      let next = chatResizeStartWidth.current + delta;
      next = Math.max(CHAT_WIDTH_MIN, Math.min(CHAT_WIDTH_MAX, next));
      setChatColumnWidth(next);
    };
    const handleUp = () => {
      setIsResizingChat(false);
      try {
        if (chatColumnWidth !== null) {
          window.localStorage.setItem('canvas:chatColumnWidth', String(chatColumnWidth));
        }
      } catch {}
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingChat, chatColumnWidth]);

  const effectiveLayoutMode = forceSplit && layoutMode === 'chat' ? 'split' : layoutMode;

  useEffect(() => {
    const unsubscribe = artifactManager.subscribe((state) => {
      setLayoutMode(state.layoutMode);
      setSplitRatio(state.splitRatio);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // If forced split is active, ensure we have a valid split ratio
    if (forceSplit && splitRatio.artifact === 0) {
      const defaultSplit = artifactManager.getState().preferences.defaultSplitRatio;
      setSplitRatio(defaultSplit);
    }
  }, [forceSplit]);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.offsetWidth;
      const optimal = artifactManager.calculateOptimalSplitRatio(
        width,
        effectiveLayoutMode !== 'chat'
      );
      if (effectiveLayoutMode !== 'chat') {
        // Only update if not dragging to avoid conflict
        if (!isDragging) {
            // We don't necessarily want to override user preference on resize unless it's extreme
            // But artifactManager.updateSplitRatio updates the global state
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [effectiveLayoutMode]);

  const handleDragStart = (e: React.MouseEvent) => {
    if (effectiveLayoutMode !== 'split') return;
    
    setIsDragging(true);
    dragStartX.current = e.clientX;
    // Capture the VISUAL ratio at start of drag to prevent jumping
    dragStartRatio.current = { chat: currentChatRatio, artifact: currentArtifactRatio };
    
    e.preventDefault();
  };

  const handleDragMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const deltaX = e.clientX - dragStartX.current;
    const deltaPercent = (deltaX / containerWidth) * 100;

    let newChatPercent = dragStartRatio.current.chat + deltaPercent;
    
    // Expert adjustment: 20% min and 80% max ensures both panels remain usable
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

  // Calculate current ratios based on state and forceSplit overrides
  let chatRatio = splitRatio.chat;
  let artifactRatio = splitRatio.artifact;

  // If split is forced but we're in a collapsed state (chat > 90%), enforce default split
  if (forceSplit && chatRatio > 90) {
    const defaultSplit = artifactManager.getState().preferences.defaultSplitRatio;
    chatRatio = defaultSplit.chat;
    artifactRatio = defaultSplit.artifact;
  }

  const currentChatRatio = chatRatio;
  const currentArtifactRatio = artifactRatio;

  const getGridTemplate = (): string => {
    if ((effectiveLayoutMode === 'chat' && !forceSplit) || !artifactContent) {
      return '100%';
    }
    if (effectiveLayoutMode === 'artifact-focused') {
      return '20% 80%';
    }
  
   // Strictly ensure columns sum to 100% to prevent overflow
    return  ${currentChatRatio}% calc(100% - ${currentChatRatio}%)`’;
  };

  if (centeredMode && isChatFullscreen) {
    return (
      <div className="canvas-split-shell canvas-split-fullscreen">
        <div className="canvas-chat-column-attached">
          <div className="canvas-chat-column-frame">
            {topBar}
            {chatContent}
          </div>
        </div>
        <div className="canvas-canvas-region">
          {endlessCanvas}
          {projectBadge}
          {bottomDock}
        </div>
      </div>
    );
  }

  if (centeredMode) {
    return (
      <div className="canvas-split-shell">
        <div
          ref={chatColumnRef}
          className="canvas-chat-column-attached"
          style={chatColumnWidth ? { width: chatColumnWidth } : undefined}
        >
          <div className="canvas-chat-column-frame">
            {chatContent}
          </div>
          <div
            className={`canvas-chat-resize-handle ${isResizingChat ? 'dragging' : ''}`}
            onMouseDown={startChatResize}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize chat panel"
            title="Drag to resize chat"
          />
        </div>
        <div className="canvas-canvas-region">
          {topBar}
          {endlessCanvas}
          {projectBadge}
          {bottomDock}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="canvas-layout-container"
      style={{
        display: 'grid',
        gridTemplateColumns: getGridTemplate(),
        gridTemplateRows: '1fr',
        height: '100%',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        transition: isDragging ? 'none' : 'grid-template-columns 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        position: 'relative',
        background: 'linear-gradient(135deg, #0A0A0A 0%, #0F0F0F 50%, #0A0A0A 100%)'
      }}
    >
      <div
        className="canvas-chat-panel"
        style={{
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          opacity: effectiveLayoutMode === 'artifact-focused' ? 0.7 : 1,
          transform: effectiveLayoutMode === 'artifact-focused' ? 'scale(0.98)' : 'scale(1)',
          transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
          minWidth: 0,
          width: '100%',
          gridColumn: '1 / 2',
          gridRow: '1 / 2',
          position: 'relative'
        }}
      >
        {chatContent}
      </div>

      {(effectiveLayoutMode !== 'chat' || forceSplit) && artifactContent && (
        <>
          <div
            className="canvas-artifact-panel"
            style={{
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              transform: `stranslateX(${isDragging ? '0' : '0'}) scale(${isDragging ? '0.995' : '1'})`,
              transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              minWidth: 0,
              width: '100%',
              gridColumn: '2 / 3',
              gridRow: '1 / 2',
              position: 'relative'
            }}
          >
            {artifactContent}
          </div>

          <div
            className="canvas-resize-handle"
            onMouseDown={handleDragStart}
            onDoubleClick={() => {
              const defaultSplit = artifactManager.getState().preferences.defaultSplitRatio;
              setSplitRatio(defaultSplit);
              artifactManager.updateSplitRatio(defaultSplit.chat, defaultSplit.artifact);
            }}
            onMouseEnter={() => setIsHoveringHandle(true)}
            onMouseLeave={() => setIsHoveringHandle(false)}
            style={{
              width: '20px',
              height: '100%',
              cursor: 'col-resize',
              background: 'transparent',
              position: 'absolute',
              left: `calc(${currentChatRatio}% - 10px)`,
              top: 0,
              zIndex: 50,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gridColumn: '1 / -1',
              gridRow: '1 / -1'
            }}
          >
            <div style={{
              width: '3px',
              height: '100%',
              background: isDragging || isHoveringHandle 
                ? 'linear-gradient(180deg, rgba(0,243,255,0) 0%, rgba(0,243,255,0.9) 20%, rgba(0,243,255,1) 50%, rgba(0,243,255,0.9) 80%, rgba(0,243,255,0) 100%)'
                : 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%)',
              boxShadow: isDragging || isHoveringHandle ? '0 0 20px rgba(0, 243, 255, 0.6), 0 0 40px rgba(0, 243, 255, 0.3)' : 'none',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: 1,
              borderRadius: '2px'
            }} />
            {(hisDragging || isHoveringHandle) && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '32px',
                height: '48px',
                background: 'linear-gradient(135deg, rgba(0,243,255,0.15) 0%, rgba(0,243,255,0.05) 100%)',
                border: '1px solid rgba(0,243,255,0.3)',
                borderRadius: '8px',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                transition: 'all 0.2s ease'
              }}>
                <div style={{
                  width: '2px',
                  height: '20px',
                  background: 'rgba(0,243,255,0.6)',
                  borderRadius: '1px'
                }} />
                <div style={{
                  width: '2px',
                  height: '20px',
                  background: 'rgba(0,243,255,0.6)',
                  borderRadius: '1px'
                }} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
