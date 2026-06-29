import React from 'react';
import './canvas.css';

interface CanvasBackgroundProps {
  className?: string;
  intensity?: 'subtle' | 'normal' | 'rich';
}

export const CanvasBackground: React.FC<CanvasBackgroundProps> = ({
  className = '',
  intensity = 'normal'
}) => {
  const opacityScale = intensity === 'subtle' ? 0.6 : intensity === 'rich' ? 1.2 : 1;

  return (
    <div
      className={`canvas-background ${className}`}
      aria-hidden="true"
      style={{ opacity: opacityScale }}
    >
      <div className="canvas-bg-base" />
      <div className="canvas-bg-glow canvas-bg-glow-cyan" />
      <div className="canvas-bg-glow canvas-bg-glow-purple" />
      <div className="canvas-bg-grid" />
      <div className="canvas-bg-noise" />
      <div className="canvas-bg-vignette" />
    </div>
  );
};

export default CanvasBackground;
