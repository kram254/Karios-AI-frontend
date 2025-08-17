import React, { useEffect, useState } from 'react';

interface AnimatedAvatarProps {
  state: 'thinking' | 'searching' | 'browsing' | 'scraping' | 'processing' | 'idle';
  message: string;
}

const eyeStates: Record<string, { left: string; right: string; focusIntensity: number; blinkPattern: number }> = {
  thinking: { left: '⚬', right: '⚬', focusIntensity: 1.2, blinkPattern: 2 },
  searching: { left: '◉', right: '◉', focusIntensity: 1.4, blinkPattern: 1.5 },
  browsing: { left: '◎', right: '◎', focusIntensity: 1.1, blinkPattern: 1.8 },
  scraping: { left: '◐', right: '◑', focusIntensity: 1.3, blinkPattern: 1.2 },
  processing: { left: '⦿', right: '⦿', focusIntensity: 1.5, blinkPattern: 0.8 },
  idle: { left: '●', right: '●', focusIntensity: 1, blinkPattern: 2.5 },
};

const Avatar2D: React.FC<{ state: AnimatedAvatarProps['state'] }> = ({ state }) => {
  const [animationOffset, setAnimationOffset] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);
  const [progressPhase, setProgressPhase] = useState(0);
  
  const currentEyeState = eyeStates[state] || eyeStates.idle;

  useEffect(() => {
    const animate = () => {
      setAnimationOffset(prev => prev + 0.02);
      setProgressPhase(prev => prev + 0.03);
      requestAnimationFrame(animate);
    };
    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Simple blinking system
  useEffect(() => {
    const performBlinks = (count: number) => {
      let blinksCompleted = 0;
      
      const doBlink = () => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          blinksCompleted++;
          
          if (blinksCompleted < count) {
            setTimeout(doBlink, 200); // 200ms between blinks
          }
        }, 150); // 150ms blink duration
      };
      
      doBlink();
    };

    // Set up the blinking schedule
    const scheduleBlinking = () => {
      // 2 blinks after 5 seconds
      setTimeout(() => performBlinks(2), 5000);
      
      // 3 blinks after 10 seconds
      setTimeout(() => performBlinks(3), 10000);
      
      // 3 blinks after 15 seconds
      setTimeout(() => performBlinks(3), 15000);
    };

    // Start initial schedule
    scheduleBlinking();
    
    // Repeat every 20 seconds
    const interval = setInterval(scheduleBlinking, 20000);
    
    return () => clearInterval(interval);
  }, []); // Empty dependency array to run only once

  const pulseScale = 1 + Math.sin(animationOffset * 3) * 0.02;
  
  const rotateY = Math.sin(animationOffset * 0.8) * 3;
  const rotateX = Math.cos(animationOffset * 0.6) * 2;
  const rotateZ = Math.sin(animationOffset * 0.4) * 1;
  
  const eyePulse = 1 + Math.sin(animationOffset * 4) * 0.1;
  const eyeMoveX = Math.sin(animationOffset * 1.5) * 2;
  const eyeMoveY = Math.cos(animationOffset * 1.2) * 1;

  const progressRotation = state !== 'idle' ? progressPhase * 40 : 0;
  const ringOpacity = state !== 'idle' ? 0.8 : 0.3;

  const displayEyeState = isBlinking ? { left: '━', right: '━' } : currentEyeState;

  return (
    <div 
      className="relative w-20 h-20 flex items-center justify-center"
      style={{ 
        transform: `
          scale(${pulseScale})
          perspective(150px)
        `,
        transformStyle: 'preserve-3d',
        filter: `drop-shadow(0 4px 8px rgba(59, 130, 246, ${ringOpacity * 0.5}))`
      }}
    >
      {state !== 'idle' && (
        <div
          className="absolute inset-0 rounded-full border-2"
          style={{
            borderColor: `transparent`,
            borderTopColor: '#3b82f6',
            borderRightColor: '#60a5fa',
            animation: 'none',
            transform: `rotate(${progressRotation}deg)`,
            opacity: ringOpacity
          }}
        />
      )}

      {state !== 'idle' && (
        <div
          className="absolute inset-1 rounded-full border-2"
          style={{
            borderColor: `transparent`,
            borderBottomColor: '#93c5fd',
            borderLeftColor: '#dbeafe',
            animation: 'none',
            transform: `rotate(${-progressRotation * 0.7}deg)`,
            opacity: ringOpacity * 0.6
          }}
        />
      )}
      {/* Main sphere with enhanced 3D gradient */}
      <div 
        className="w-14 h-14 rounded-full flex items-center justify-center relative overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse 45% 35% at ${50 + rotateY * 0.8}% ${35 - rotateX * 0.5}%, 
              #f0f9ff 0%,
              #dbeafe 8%,
              #93c5fd 20%, 
              #60a5fa 35%, 
              #3b82f6 55%, 
              #2563eb 75%, 
              #1d4ed8 90%,
              #1e3a8a 100%
            )
          `,
          boxShadow: `
            0 ${8 + Math.sin(animationOffset * 1.2) * 2}px ${25 + Math.abs(rotateY * 0.5)}px rgba(59, 130, 246, 0.6),
            0 ${4 + Math.cos(animationOffset * 0.8) * 1}px ${12 + Math.abs(rotateX * 0.3)}px rgba(29, 78, 216, 0.4),
            inset 0 ${3 + Math.sin(animationOffset * 2.1) * 0.8}px ${6 + Math.cos(animationOffset * 1.7) * 1}px rgba(255, 255, 255, 0.5),
            inset 0 -${2 + Math.sin(animationOffset * 1.9) * 0.5}px ${5 + Math.cos(animationOffset * 1.3) * 0.8}px rgba(0, 0, 0, 0.15),
            inset ${2 + Math.sin(animationOffset * 2.3) * 0.5}px 0 ${4 + Math.cos(animationOffset * 1.8) * 0.7}px rgba(255, 255, 255, 0.3)
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
                0 ${2 + Math.sin(animationOffset * 3.1) * 0.5}px ${4 + Math.cos(animationOffset * 2.7) * 0.8}px rgba(0, 0, 0, 0.4),
                inset 0 ${1 + Math.sin(animationOffset * 4.2) * 0.2}px ${2 + Math.cos(animationOffset * 3.8) * 0.3}px rgba(255, 255, 255, 0.9),
                inset 0 -${0.5 + Math.sin(animationOffset * 3.5) * 0.1}px ${1 + Math.cos(animationOffset * 4.1) * 0.2}px rgba(0, 0, 0, 0.1)
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
              {displayEyeState.left}
            </span>
          </div>
          
          {/* Right Eye */}
          <div 
            className="w-3 h-4 bg-white rounded-full flex items-center justify-center transition-all duration-75"
            style={{ 
              boxShadow: `
                0 ${2 + Math.sin(animationOffset * 3.1 + 0.5) * 0.5}px ${4 + Math.cos(animationOffset * 2.7 + 0.5) * 0.8}px rgba(0, 0, 0, 0.4),
                inset 0 ${1 + Math.sin(animationOffset * 4.2 + 0.5) * 0.2}px ${2 + Math.cos(animationOffset * 3.8 + 0.5) * 0.3}px rgba(255, 255, 255, 0.9),
                inset 0 -${0.5 + Math.sin(animationOffset * 3.5 + 0.5) * 0.1}px ${1 + Math.cos(animationOffset * 4.1 + 0.5) * 0.2}px rgba(0, 0, 0, 0.1)
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
              {displayEyeState.right}
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
            translateY(8px) 
            scaleX(${1 + Math.abs(rotateY) * 0.01}) 
            scaleY(${1 - Math.abs(rotateX) * 0.02})
            skewX(${rotateY * 0.3}deg)
          `,
          filter: `blur(1px)`
        }}
      />

      {state !== 'idle' && (
        <>
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(
                from ${progressRotation}deg,
                #3b82f6 0deg,
                #60a5fa 90deg,
                transparent 91deg,
                transparent 269deg,
                #93c5fd 270deg,
                #3b82f6 360deg
              )`,
              opacity: 0.15,
              transform: 'scale(1.1)'
            }}
          />
          <div
            className="absolute"
            style={{
              top: '2px',
              left: '50%',
              width: '4px',
              height: '4px',
              background: '#3b82f6',
              borderRadius: '50%',
              transform: `translateX(-50%) rotate(${progressRotation}deg) translateY(-8px)`,
              boxShadow: '0 0 8px rgba(59, 130, 246, 0.8)'
            }}
          />
        </>
      )}
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