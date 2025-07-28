import React, { useRef, useEffect, useState } from 'react';

interface AnimatedAvatarProps {
  state: 'thinking' | 'searching' | 'browsing' | 'scraping' | 'processing' | 'idle';
  message: string;
}

const eyeStates: Record<string, { left: string; right: string }> = {
  thinking: { left: '|', right: '|' },
  searching: { left: '+', right: '+' },
  browsing: { left: '*', right: '*' },
  scraping: { left: '+', right: '+' },
  processing: { left: 'X', right: 'X' },
  idle: { left: 'O', right: 'O' },
};

const Avatar2D: React.FC<{ state: AnimatedAvatarProps['state'] }> = ({ state }) => {
  const [animationOffset, setAnimationOffset] = useState(0);
  
  const currentEyeState = eyeStates[state] || eyeStates.idle;

  useEffect(() => {
    const animate = () => {
      setAnimationOffset(prev => prev + 0.02);
      requestAnimationFrame(animate);
    };
    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  const pulseScale = 1 + Math.sin(animationOffset * 3) * 0.02;
  
  const rotateY = Math.sin(animationOffset * 0.8) * 3;
  const rotateX = Math.cos(animationOffset * 0.6) * 2;
  const rotateZ = Math.sin(animationOffset * 0.4) * 1;
  
  const eyePulse = 1 + Math.sin(animationOffset * 4) * 0.1;
  const eyeMoveX = Math.sin(animationOffset * 1.5) * 2;
  const eyeMoveY = Math.cos(animationOffset * 1.2) * 1;

  return (
    <div 
      className="relative w-16 h-16 flex items-center justify-center"
      style={{ 
        transform: `
          scale(${pulseScale})
          perspective(150px)
        `,
        transformStyle: 'preserve-3d',
        filter: `drop-shadow(0 4px 8px rgba(59, 130, 246, 0.3))`
      }}
    >
      {/* Main sphere with enhanced 3D gradient */}
      <div 
        className="w-14 h-14 rounded-full flex items-center justify-center relative overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse 40% 30% at ${50 + rotateY * 0.5}% ${40 - rotateX * 0.3}%, 
              #93c5fd 0%, 
              #60a5fa 25%, 
              #3b82f6 50%, 
              #2563eb 75%, 
              #1d4ed8 100%
            )
          `,
          boxShadow: `
            0 6px 20px rgba(59, 130, 246, 0.5),
            inset 0 2px 4px rgba(255, 255, 255, 0.4),
            inset 0 -2px 4px rgba(0, 0, 0, 0.1)
          `,
          transform: `
            rotateX(${rotateX}deg) 
            rotateY(${rotateY}deg) 
            rotateZ(${rotateZ}deg)
          `,
          transformStyle: 'preserve-3d',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        {/* Eyes with enhanced dynamic positioning */}
        <div 
          className="flex items-center justify-center gap-2"
          style={{
            transform: `
              translateX(${eyeMoveX}px)
              translateY(${eyeMoveY}px)
            `
          }}
        >
          {/* Left Eye */}
          <div 
            className="w-3 h-4 bg-white rounded-full flex items-center justify-center transition-all duration-75"
            style={{ 
              boxShadow: `
                0 1px 2px rgba(0, 0, 0, 0.3),
                inset 0 0.5px 1px rgba(255, 255, 255, 0.8)
              `,
              transform: `
                scale(${eyePulse})
              `
            }}
          >
            <span 
              className="text-blue-600 font-bold leading-none"
              style={{ 
                fontSize: '12px',
                fontFamily: 'ui-monospace, monospace',
                transform: `scale(1)`
              }}
            >
              {currentEyeState.left}
            </span>
          </div>
          
          {/* Right Eye */}
          <div 
            className="w-3 h-4 bg-white rounded-full flex items-center justify-center transition-all duration-75"
            style={{ 
              boxShadow: `
                0 1px 2px rgba(0, 0, 0, 0.3),
                inset 0 0.5px 1px rgba(255, 255, 255, 0.8)
              `,
              transform: `
                scale(${eyePulse})
              `
            }}
          >
            <span 
              className="text-blue-600 font-bold leading-none"
              style={{ 
                fontSize: '12px',
                fontFamily: 'ui-monospace, monospace',
                transform: `scale(1)`
              }}
            >
              {currentEyeState.right}
            </span>
          </div>
        </div>
        
        {/* Enhanced spherical lighting with multiple layers */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: `
              radial-gradient(ellipse 60% 40% at ${35 + rotateY * 0.8}% ${25 - rotateX * 0.6}%, 
                rgba(255, 255, 255, 0.6) 0%, 
                rgba(255, 255, 255, 0.2) 30%, 
                transparent 60%
              )
            `
          }}
        />
        {/* Secondary highlight for more depth */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: `
              radial-gradient(circle at ${70 - rotateY * 0.3}% ${70 + rotateX * 0.4}%, 
                transparent 40%, 
                rgba(0, 0, 0, 0.1) 70%, 
                rgba(0, 0, 0, 0.2) 100%
              )
            `
          }}
        />
        {/* Animated rim light */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(
              from ${animationOffset * 50}deg,
              transparent 0deg,
              rgba(147, 197, 253, 0.3) 45deg,
              transparent 90deg,
              rgba(147, 197, 253, 0.3) 135deg,
              transparent 180deg,
              rgba(147, 197, 253, 0.3) 225deg,
              transparent 270deg,
              rgba(147, 197, 253, 0.3) 315deg,
              transparent 360deg
            )`,
            opacity: 0.4 + Math.sin(animationOffset * 2) * 0.2
          }}
        />
      </div>
      
      {/* Highly dynamic shadow with multiple effects */}
      <div 
        className="absolute bottom-0 w-12 h-2 rounded-full"
        style={{
          background: `
            radial-gradient(ellipse, 
              rgba(0, 0, 0, 0.4) 0%, 
              rgba(0, 0, 0, 0.2) 50%, 
              transparent 80%
            )
          `,
          opacity: 0.6 + Math.sin(animationOffset * 1.8) * 0.2,
          transform: `
            translateY(6px) 
            scaleX(${1 + Math.abs(rotateY) * 0.01}) 
            scaleY(${1 - Math.abs(rotateX) * 0.02})
            skewX(${rotateY * 0.3}deg)
          `,
          filter: `blur(1px)`
        }}
      />
    </div>
  );
};

const AnimatedAvatar: React.FC<AnimatedAvatarProps> = ({ state, message }) => {
  return (
    <div className="flex flex-col items-center">
      <Avatar2D state={state} />
      <div className="text-xs text-gray-400 mt-3 text-center max-w-40">
        {message}
      </div>
    </div>
  );
};

export default AnimatedAvatar;