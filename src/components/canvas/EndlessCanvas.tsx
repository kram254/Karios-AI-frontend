import React, { useRef } from 'react';
import { Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import { Artifact } from '../../services/artifactManager.service';
import { CanvasBackground } from './CanvasBackground';
import { CanvasArtifactCard } from './CanvasArtifactCard';
import './canvas.css';

interface EndlessCanvasProps {
  artifacts: Artifact[];
  onExpandArtifact?: (artifact: Artifact) => void;
  onSelectArtifact?: (artifact: Artifact) => void;
  showBackground?: boolean;
  emptyHint?: string;
  className?: string;
  children?: React.ReactNode;
  scrollRef?: React.RefObject<HTMLDivElement>;
  liveSlot?: React.ReactNode;
}

export const EndlessCanvas: React.FC<EndlessCanvasProps> = ({
  artifacts,
  onExpandArtifact,
  onSelectArtifact,
  showBackground = true,
  emptyHint = 'Generated artifacts will appear here as the agent works.',
  className = '',
  children,
  scrollRef,
  liveSlot
}) => {
  const isEmpty = !artifacts || artifacts.length === 0;
  const hasLiveSlot = liveSlot !== undefined && liveSlot !== null && liveSlot !== false;
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const scrollAmount = carouselRef.current.offsetWidth * 0.75;
    carouselRef.current.scrollBy({ left: direction === 'right' ? scrollAmount : -scrollAmount, behavior: 'smooth' });
  };

  return (
    <div className={`canvas-shell ${className}`}>
      {showBackground && <CanvasBackground />}
      <div className="canvas-endless" ref={scrollRef}>
        <div className="canvas-carousel-wrapper">
          {!isEmpty && (
            <button className="canvas-carousel-btn canvas-carousel-btn-prev" onClick={() => scrollCarousel('left')}>
              <ChevronLeft size={20} />
            </button>
          )}
          <div className="canvas-endless-grid" ref={carouselRef}>
            {artifacts.map((artifact, index) => (
              <CanvasArtifactCard
                key={artifact.id || index}
                artifact={artifact}
                onExpand={onExpandArtifact}
                onClick={onSelectArtifact}
                style={{
                  animationDelay: `${index * 60}ms`
                }}
              />
            ))}
            {hasLiveSlot && liveSlot}
            {isEmpty && !hasLiveSlot && (
              <div className="canvas-endless-empty">
                <div className="canvas-endless-empty-icon">
                  <Layers size={22} color="rgba(255,255,255,0.35)" />
                </div>
                <div className="canvas-endless-empty-text">{emptyHint}</div>
              </div>
            )}
          </div>
          {!isEmpty && (
            <button className="canvas-carousel-btn canvas-carousel-btn-next" onClick={() => scrollCarousel('right')}>
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
};

export default EndlessCanvas;
