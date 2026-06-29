import React, { useEffect, useState } from 'react';

interface AnimatedAvatarProps {
    state: 'thinking' | 'searching' | 'browsing' | 'scraping' | 'processing' | 'idle';
    message: string;
    size?: 'sm' | 'md' | 'lg' | 'responsive';
}

// Eye states for different processing states
const eyeStates: Record<string, { left: string; right: string; focusIntensity: number; blinkPattern: number }> = {
    thinking: { left: '⚬', right: '⚬', focusIntensity: 1.2, blinkPattern: 2 },
    searching: { left: '◉', right: '◉', focusIntensity: 1.4, blinkPattern: 1.5 },
    browsing: { left: '◎', right: '◎', focusIntensity: 1.1, blinkPattern: 1.8 },
    scraping: { left: '◐', right: '◑', focusIntensity: 1.3, blinkPattern: 1.2 },
    processing: { left: '⦿', right: '⦿', focusIntensity: 1.5, blinkPattern: 0.8 },
    idle: { left: '●', right: '●', focusIntensity: 1, blinkPattern: 2.5 },
};

// Size configurations based on Google Stitch design guidelines
const sizeConfig = {
    sm: { container: 'w-10 h-10', sphere: 'w-8 h-8', eyeSize: '8px', gap: '1', shadow: '6px' },
    md: { container: 'w-12 h-12', sphere: 'w-10 h-10', eyeSize: '10px', gap: '1.5', shadow: '8px' },
    lg: { container: 'w-14 h-14', sphere: 'w-11 h-11', eyeSize: '11px', gap: '2', shadow: '10px' },
    responsive: { container: 'w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14', sphere: 'w-8 h-8 sm:w-10 sm:h-10 lg:w-11 lg:h-11', eyeSize: '10px', gap: '2', shadow: '8px' }
};

const Avatar2D: React.FC<{ state: AnimatedAvatarProps['state']; size?: AnimatedAvatarProps['size'] }> = ({ state, size = 'md' }) => {
    const [animationOffset, setAnimationOffset] = useState(0);
    const [isBlinking, setIsBlinking] = useState(false);
    const [progressPhase, setProgressPhase] = useState(0);

    const currentEyeState = eyeStates[state] || eyeStates.idle;
    const sizeStyles = sizeConfig[size];

    useEffect(() => {
        let animationFrameId: number;
        const animate = () => {
            setAnimationOffset(prev => prev + 0.02);
            setProgressPhase(prev => prev + 0.03);
            animationFrameId = requestAnimationFrame(animate);
        };
        animationFrameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    // Blinking system
    useEffect(() => {
        const performBlinks = (count: number) => {
            let blinksCompleted = 0;

            const doBlink = () => {
                setIsBlinking(true);
                setTimeout(() => {
                    setIsBlinking(false);
                    blinksCompleted++;

                    if (blinksCompleted < count) {
                        setTimeout(doBlink, 200);
                    }
                }, 150);
            };

            doBlink();
        };

        const scheduleBlinking = () => {
            setTimeout(() => performBlinks(2), 5000);
            setTimeout(() => performBlinks(3), 10000);
            setTimeout(() => performBlinks(3), 15000);
        };

        scheduleBlinking();
        const interval = setInterval(scheduleBlinking, 20000);

        return () => clearInterval(interval);
    }, []);

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
            className={`relative ${sizeStyles.container} flex items-center justify-center flex-shrink-0`}
            style={{
                transform: `scale(${pulseScale}) perspective(150px)`,
                transformStyle: 'preserve-3d',
                filter: `drop-shadow(0 4px ${sizeStyles.shadow} rgba(59, 130, 246, ${ringOpacity * 0.5}))`
            }}
        >
            {/* Outer rotating ring - active states only */}
            {state !== 'idle' && (
                <div
                    className="absolute inset-0 rounded-full border-2"
                    style={{
                        borderColor: 'transparent',
                        borderTopColor: '#3b82f6',
                        borderRightColor: '#60a5fa',
                        transform: `rotate(${progressRotation}deg)`,
                        opacity: ringOpacity
                    }}
                />
            )}

            {/* Inner counter-rotating ring */}
            {state !== 'idle' && (
                <div
                    className="absolute inset-1 rounded-full border-2"
                    style={{
                        borderColor: 'transparent',
                        borderBottomColor: '#93c5fd',
                        borderLeftColor: '#dbeafe',
                        transform: `rotate(${-progressRotation * 0.7}deg)`,
                        opacity: ringOpacity * 0.6
                    }}
                />
            )}

            {/* Main sphere with 3D gradient */}
            <div
                className={`${sizeStyles.sphere} rounded-full flex items-center justify-center relative overflow-hidden`}
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
            inset 0 -${2 + Math.sin(animationOffset * 1.9) * 0.5}px ${5 + Math.cos(animationOffset * 1.3) * 0.8}px rgba(0, 0, 0, 0.15)
          `,
                    transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
                    transformStyle: 'preserve-3d',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
            >
                {/* Eyes container */}
                <div
                    className={`flex items-center justify-center gap-${sizeStyles.gap}`}
                    style={{
                        transform: `translateX(${eyeMoveX}px) translateY(${eyeMoveY}px)`
                    }}
                >
                    {/* Left Eye */}
                    <div
                        className="w-2.5 h-3 bg-white rounded-full flex items-center justify-center transition-all duration-75"
                        style={{
                            boxShadow: `
                0 ${2 + Math.sin(animationOffset * 3.1) * 0.5}px ${4 + Math.cos(animationOffset * 2.7) * 0.8}px rgba(0, 0, 0, 0.4),
                inset 0 ${1 + Math.sin(animationOffset * 4.2) * 0.2}px ${2 + Math.cos(animationOffset * 3.8) * 0.3}px rgba(255, 255, 255, 0.9)
              `,
                            transform: `scale(${eyePulse})`
                        }}
                    >
                        <span
                            className="text-blue-600 font-bold leading-none"
                            style={{
                                fontSize: sizeStyles.eyeSize,
                                fontFamily: 'ui-monospace, monospace'
                            }}
                        >
                            {displayEyeState.left}
                        </span>
                    </div>

                    {/* Right Eye */}
                    <div
                        className="w-2.5 h-3 bg-white rounded-full flex items-center justify-center transition-all duration-75"
                        style={{
                            boxShadow: `
                0 ${2 + Math.sin(animationOffset * 3.1 + 0.5) * 0.5}px ${4 + Math.cos(animationOffset * 2.7 + 0.5) * 0.8}px rgba(0, 0, 0, 0.4),
                inset 0 ${1 + Math.sin(animationOffset * 4.2 + 0.5) * 0.2}px ${2 + Math.cos(animationOffset * 3.8 + 0.5) * 0.3}px rgba(255, 255, 255, 0.9)
              `,
                            transform: `scale(${eyePulse})`
                        }}
                    >
                        <span
                            className="text-blue-600 font-bold leading-none"
                            style={{
                                fontSize: sizeStyles.eyeSize,
                                fontFamily: 'ui-monospace, monospace'
                            }}
                        >
                            {displayEyeState.right}
                        </span>
                    </div>
                </div>

                {/* Spherical highlight */}
                <div
                    className="absolute inset-0 rounded-full pointer-events-none"
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

                {/* Animated rim light */}
                <div
                    className="absolute inset-0 rounded-full pointer-events-none"
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

            {/* Progress indicator dot */}
            {state !== 'idle' && (
                <div
                    className="absolute"
                    style={{
                        top: '2px',
                        left: '50%',
                        width: '3px',
                        height: '3px',
                        background: '#3b82f6',
                        borderRadius: '50%',
                        transform: `translateX(-50%) rotate(${progressRotation}deg) translateY(-6px)`,
                        boxShadow: '0 0 6px rgba(59, 130, 246, 0.8)'
                    }}
                />
            )}
        </div>
    );
};

const AnimatedAvatarEnhanced: React.FC<AnimatedAvatarProps> = ({ state, message, size = 'md' }) => {
    return (
        <div className="flex flex-col items-center flex-shrink-0">
            <Avatar2D state={state} size={size} />
            {message && (
                <div className="text-xs text-gray-400 mt-2 text-center max-w-32 line-clamp-2">
                    {message}
                </div>
            )}
        </div>
    );
};

export default AnimatedAvatarEnhanced;
