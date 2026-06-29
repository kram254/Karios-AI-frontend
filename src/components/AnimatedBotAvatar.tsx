import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedBotAvatarProps {
  state: 'thinking' | 'searching' | 'browsing' | 'scraping' | 'processing' | 'idle' | 'greeting' | 'success' | 'listening' | 'explaining';
  message?: string;
  size?: 'tiny' | 'small' | 'normal' | 'large' | 'inline';
  variant?: 'full' | 'icon' | 'inline';
  showMessage?: boolean;
}

const stateImageMap: Record<string, string> = {
  idle: '/bot/bot.png',
  thinking: '/bot/bot.png',
  searching: '/bot/bot.png',
  browsing: '/bot/bot.png',
  scraping: '/bot/bot.png',
  processing: '/bot/bot.png',
  greeting: '/bot/bot4.png',
  success: '/bot/bot2.png',
  listening: '/bot/bot3.png',
  explaining: '/bot/bot2.png',
};

const sizeConfig = {
  tiny: { width: 32, height: 32, messageSize: 'text-[8px]', messageWidth: 'max-w-20' },
  small: { width: 48, height: 48, messageSize: 'text-[10px]', messageWidth: 'max-w-24' },
  normal: { width: 80, height: 80, messageSize: 'text-xs', messageWidth: 'max-w-40' },
  large: { width: 120, height: 120, messageSize: 'text-sm', messageWidth: 'max-w-48' },
  inline: { width: 24, height: 24, messageSize: 'text-[8px]', messageWidth: 'max-w-20' },
};

const AnimatedBotAvatar: React.FC<AnimatedBotAvatarProps> = ({
  state,
  message = '',
  size = 'normal',
  variant = 'full',
  showMessage = true
}) => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [currentImage, setCurrentImage] = useState(stateImageMap[state]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [floatOffset, setFloatOffset] = useState(0);
  const [pulsePhase, setPulsePhase] = useState(0);

  const resolvedSize = variant === 'inline' ? 'inline' : size;
  const config = sizeConfig[resolvedSize];
  const showMessageBubble = showMessage && variant === 'full';
  const showActivityDots = variant === 'full';
  const showActivePulse = variant !== 'inline';
  const floatingScale = variant === 'inline' ? 0.35 : variant === 'icon' ? 0.6 : 1;

  useEffect(() => {
    const newImage = stateImageMap[state];
    if (newImage !== currentImage) {
      setIsAnimating(true);
      setCurrentImage(newImage);
      setTimeout(() => setIsAnimating(false), 600);
    }
  }, [state, currentImage]);

  useEffect(() => {
    let animationFrame: number;
    let startTime = Date.now();
    
    const animate = () => {
      if (prefersReducedMotion) return;
      const elapsed = Date.now() - startTime;
      setFloatOffset(Math.sin(elapsed * 0.001) * (8 * floatingScale));
      setPulsePhase(Math.sin(elapsed * 0.002) * (0.1 * floatingScale) + 1);
      animationFrame = requestAnimationFrame(animate);
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const getBotAnimation = useMemo(() => {
    switch (state) {
      case 'thinking':
        return {
          rotate: [0, -5, 5, -5, 0],
          scale: [1, 1.05, 0.95, 1.05, 1],
        };
      case 'searching':
      case 'browsing':
        return {
          x: [0, -3, 3, -3, 0],
          rotate: [0, -2, 2, -2, 0],
        };
      case 'processing':
      case 'scraping':
        return {
          rotate: [0, 360],
          scale: [1, 1.1, 1],
        };
      case 'greeting':
        return {
          y: [0, -10, 0],
          rotate: [0, -15, 15, -15, 0],
          scale: [1, 1.1, 1],
        };
      case 'success':
        return {
          y: [0, -15, 0, -8, 0],
          scale: [1, 1.15, 1, 1.08, 1],
          rotate: [0, -10, 10, -5, 0],
        };
      case 'listening':
        return {
          scale: [1, 1.05, 1, 1.05, 1],
          rotate: [0, 3, -3, 0],
        };
      case 'explaining':
        return {
          x: [0, 2, -2, 2, 0],
          y: [0, -2, 0, -2, 0],
          rotate: [0, 5, -5, 5, 0],
        };
      default:
        return {
          y: [0, -5, 0],
          scale: [1, 1.02, 1],
        };
    }
  }, [state]);

  const getGlowColor = () => {
    switch (state) {
      case 'thinking': return 'rgba(147, 197, 253, 0.5)';
      case 'searching': return 'rgba(34, 211, 238, 0.5)';
      case 'browsing': return 'rgba(168, 85, 247, 0.5)';
      case 'scraping': return 'rgba(251, 146, 60, 0.5)';
      case 'processing': return 'rgba(251, 191, 36, 0.5)';
      case 'success': return 'rgba(74, 222, 128, 0.6)';
      case 'greeting': return 'rgba(96, 165, 250, 0.5)';
      case 'listening': return 'rgba(196, 181, 253, 0.5)';
      case 'explaining': return 'rgba(59, 130, 246, 0.5)';
      default: return 'rgba(148, 163, 184, 0.3)';
    }
  };

  const getAnimationSpeed = () => {
    switch (state) {
      case 'processing':
      case 'scraping':
        return 1.5;
      case 'thinking':
        return 2;
      case 'searching':
      case 'browsing':
        return 1.8;
      case 'success':
      case 'greeting':
        return 0.8;
      default:
        return 2.5;
    }
  };

  const isActiveState = ['thinking', 'searching', 'browsing', 'scraping', 'processing'].includes(state);

  return (
    <div className="flex flex-col items-center justify-center">
      <div 
        className="relative flex items-center justify-center"
        style={{ 
          width: config.width,
          height: config.height,
          transform: `translateY(${floatOffset}px) scale(${pulsePhase})`,
          transition: 'transform 0.1s ease-out'
        }}
      >
        {isActiveState && showActivePulse && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: `0 0 30px ${getGlowColor()}, 0 0 60px ${getGlowColor()}`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: getAnimationSpeed(),
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentImage}
            className="relative w-full h-full flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
            animate={prefersReducedMotion ? { opacity: 1, scale: 1, rotateY: 0 } : {
              opacity: 1,
              scale: 1,
              rotateY: 0,
              ...getBotAnimation
            }}
            exit={{ opacity: 0, scale: 0.8, rotateY: 90 }}
            transition={{
              opacity: { duration: 0.3 },
              scale: { duration: 0.3 },
              rotateY: { duration: 0.4 },
              default: {
                duration: getAnimationSpeed(),
                repeat: Infinity,
                ease: "easeInOut",
              }
            }}
            style={{
              filter: `drop-shadow(0 4px 12px ${getGlowColor()})`,
            }}
          >
            <img
              src={currentImage}
              alt="AI Assistant Bot"
              className="w-full h-full object-contain"
              style={{
                imageRendering: '-webkit-optimize-contrast',
              }}
            />
          </motion.div>
        </AnimatePresence>

        {isActiveState && showActivePulse && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-blue-400"
              style={{ opacity: 0.3 }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <motion.div
              className="absolute inset-2 rounded-full border-2 border-cyan-400"
              style={{ opacity: 0.2 }}
              animate={{ rotate: -360 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </>
        )}

        {state === 'success' && (
          <motion.div
            className="absolute -top-2 -right-2"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: [0, 1.3, 1], rotate: 0 }}
            transition={{ duration: 0.5, ease: "backOut" }}
          >
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
              ✓
            </div>
          </motion.div>
        )}
      </div>

      {showMessageBubble && message && (
        <motion.div
          className={`${config.messageSize} text-gray-400 mt-3 text-center ${config.messageWidth} font-medium`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {message}
        </motion.div>
      )}

      {isActiveState && showActivityDots && (
        <motion.div
          className="flex gap-1 mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: getGlowColor().replace('0.5', '0.8') }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default AnimatedBotAvatar;
