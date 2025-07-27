import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedAvatarProps {
  state: 'thinking' | 'searching' | 'browsing' | 'scraping' | 'processing' | 'idle';
  message: string;
}

const AnimatedAvatar: React.FC<AnimatedAvatarProps> = ({ state, message }) => {
  const getEyePattern = () => {
    switch (state) {
      case 'thinking':
        return '||';
      case 'searching':
        return '++';
      case 'browsing':
        return '**';
      case 'scraping':
        return '++';
      case 'processing':
        return 'XX';
      case 'idle':
      default:
        return 'OO';
    }
  };

  const renderEyes = () => {
    const pattern = getEyePattern();
    
    if (pattern === '||') {
      return (
        <div className="flex space-x-2">
          <motion.div
            className="w-1 h-3 bg-white rounded-full"
            animate={{ scaleY: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="w-1 h-3 bg-white rounded-full"
            animate={{ scaleY: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          />
        </div>
      );
    }
    
    if (pattern === 'OO') {
      return (
        <div className="flex space-x-2">
          <motion.div
            className="w-2 h-2 bg-white rounded-full"
            animate={{ scale: [1, 0.8, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="w-2 h-2 bg-white rounded-full"
            animate={{ scale: [1, 0.8, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
          />
        </div>
      );
    }
    
    if (pattern === 'XX') {
      return (
        <div className="flex space-x-2">
          <motion.div
            className="relative w-2 h-2"
            animate={{ rotate: [0, 180, 360] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute inset-0">
              <div className="w-2 h-0.5 bg-white rounded-full transform rotate-45 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              <div className="w-2 h-0.5 bg-white rounded-full transform -rotate-45 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          </motion.div>
          <motion.div
            className="relative w-2 h-2"
            animate={{ rotate: [0, -180, -360] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute inset-0">
              <div className="w-2 h-0.5 bg-white rounded-full transform rotate-45 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              <div className="w-2 h-0.5 bg-white rounded-full transform -rotate-45 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          </motion.div>
        </div>
      );
    }
    
    if (pattern === '++') {
      return (
        <div className="flex space-x-2">
          <motion.div
            className="relative w-2 h-2"
            animate={{ scale: [1, 1.3, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute inset-0">
              <div className="w-2 h-0.5 bg-white rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              <div className="w-0.5 h-2 bg-white rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          </motion.div>
          <motion.div
            className="relative w-2 h-2"
            animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          >
            <div className="absolute inset-0">
              <div className="w-2 h-0.5 bg-white rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              <div className="w-0.5 h-2 bg-white rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          </motion.div>
        </div>
      );
    }
    
    if (pattern === '**') {
      return (
        <div className="flex space-x-2">
          <motion.div
            className="relative w-2 h-2"
            animate={{ scale: [0.8, 1.5, 0.8], rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            {[0, 45, 90, 135].map((rotation, i) => (
              <div
                key={i}
                className="w-1 h-0.5 bg-white rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ transform: `rotate(${rotation}deg)` }}
              />
            ))}
          </motion.div>
          <motion.div
            className="relative w-2 h-2"
            animate={{ scale: [0.8, 1.5, 0.8], rotate: [0, -360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          >
            {[0, 45, 90, 135].map((rotation, i) => (
              <div
                key={i}
                className="w-1 h-0.5 bg-white rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ transform: `rotate(${rotation}deg)` }}
              />
            ))}
          </motion.div>
        </div>
      );
    }
    
    return null;
  };

  const renderAntlers = () => (
    <div className="flex justify-center space-x-4 mb-1">
      <motion.div
        className="w-0.5 h-4 bg-gray-600 rounded-full"
        animate={{
          scaleY: state === 'idle' ? [1, 1.1, 1] : [1, 1.2, 1],
          rotateZ: state === 'thinking' ? [0, 5, -5, 0] : 0
        }}
        transition={{
          duration: state === 'idle' ? 3 : 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="w-0.5 h-4 bg-gray-600 rounded-full"
        animate={{
          scaleY: state === 'idle' ? [1, 1.1, 1] : [1, 1.2, 1],
          rotateZ: state === 'thinking' ? [0, -5, 5, 0] : 0
        }}
        transition={{
          duration: state === 'idle' ? 3 : 1.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.1
        }}
      />
    </div>
  );

  return (
    <div className="flex flex-col items-center">
      <motion.div
        className="flex flex-col items-center p-2"
        animate={{
          scale: state === 'processing' ? [1, 1.1, 1] : [1, 1.02, 1],
          y: state === 'idle' ? [0, -1, 0] : [0, -2, 0]
        }}
        transition={{
          duration: state === 'processing' ? 1 : 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {renderAntlers()}
        <div className="flex items-center justify-center h-6">
          {renderEyes()}
        </div>
      </motion.div>
      <div className="text-xs text-gray-400 mt-1 text-center max-w-32">
        {message}
      </div>
    </div>
  );
};

export default AnimatedAvatar;
