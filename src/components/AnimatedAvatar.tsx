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

  const renderHelmet = () => (
    <motion.div
      className="relative w-16 h-14 rounded-t-full rounded-b-lg overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, #2c3e50 0%, #34495e 30%, #2c3e50 60%, #1a252f 100%)',
        boxShadow: 'inset 0 4px 8px rgba(255,255,255,0.1), inset 0 -4px 8px rgba(0,0,0,0.3), 0 8px 16px rgba(0,0,0,0.2)',
        transformStyle: 'preserve-3d'
      }}
      animate={{
        rotateY: state === 'processing' ? [0, 10, -10, 0] : [0, 3, -3, 0],
        scale: state === 'processing' ? [1, 1.05, 1] : [1, 1.02, 1]
      }}
      transition={{
        duration: state === 'processing' ? 1.5 : 3,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <div
        className="absolute top-1 left-1 right-1 h-2 rounded-t-full"
        style={{
          background: 'linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.2) 100%)'
        }}
      />
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {renderEyes()}
      </div>
    </motion.div>
  );

  const renderEyes = () => {
    const pattern = getEyePattern();
    
    if (pattern === '||') {
      return (
        <div className="flex space-x-3">
          <motion.div
            className="relative w-5 h-7 rounded-full overflow-hidden"
            style={{
              background: 'radial-gradient(ellipse at 30% 30%, #ffffff 0%, #f0f0f0 40%, #d0d0d0 100%)',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.15), 0 4px 12px rgba(255,255,255,0.4), 0 0 20px rgba(59,130,246,0.3)'
            }}
            animate={{ scaleY: [1, 1.1, 1], rotateX: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              className="absolute inset-x-0 top-1/2 h-0.5 bg-blue-400 rounded-full transform -translate-y-1/2"
              animate={{ scaleX: [0.8, 1.2, 0.8], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-x-0 bottom-1/3 h-0.5 bg-blue-400 rounded-full"
              animate={{ scaleX: [0.6, 1, 0.6], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
            />
          </motion.div>
          <motion.div
            className="relative w-5 h-7 rounded-full overflow-hidden"
            style={{
              background: 'radial-gradient(ellipse at 30% 30%, #ffffff 0%, #f0f0f0 40%, #d0d0d0 100%)',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.15), 0 4px 12px rgba(255,255,255,0.4), 0 0 20px rgba(59,130,246,0.3)'
            }}
            animate={{ scaleY: [1, 1.1, 1], rotateX: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          >
            <motion.div
              className="absolute inset-x-0 top-1/2 h-0.5 bg-blue-400 rounded-full transform -translate-y-1/2"
              animate={{ scaleX: [0.8, 1.2, 0.8], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            />
            <motion.div
              className="absolute inset-x-0 bottom-1/3 h-0.5 bg-blue-400 rounded-full"
              animate={{ scaleX: [0.6, 1, 0.6], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            />
          </motion.div>
        </div>
      );
    }
    
    if (pattern === 'OO') {
      return (
        <div className="flex space-x-3">
          <motion.div
            className="relative w-5 h-5 rounded-full overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #f0f0f0 40%, #d0d0d0 100%)',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.15), 0 4px 12px rgba(255,255,255,0.4), 0 0 15px rgba(76,175,80,0.3)'
            }}
            animate={{ scale: [1, 0.9, 1], rotateY: [0, 10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              className="absolute w-3 h-3 bg-green-500 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              animate={{ scale: [0.8, 1.1, 0.8], x: [-1, 1, -1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="absolute w-1 h-1 bg-white rounded-full top-1/3 left-1/3 opacity-80" />
          </motion.div>
          <motion.div
            className="relative w-5 h-5 rounded-full overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #f0f0f0 40%, #d0d0d0 100%)',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.15), 0 4px 12px rgba(255,255,255,0.4), 0 0 15px rgba(76,175,80,0.3)'
            }}
            animate={{ scale: [1, 0.9, 1], rotateY: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
          >
            <motion.div
              className="absolute w-3 h-3 bg-green-500 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              animate={{ scale: [0.8, 1.1, 0.8], x: [1, -1, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
            />
            <div className="absolute w-1 h-1 bg-white rounded-full top-1/3 left-1/3 opacity-80" />
          </motion.div>
        </div>
      );
    }
    
    if (pattern === 'XX') {
      return (
        <div className="flex space-x-3">
          <motion.div
            className="relative w-5 h-5 rounded-full overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ff6b6b 0%, #ff5252 40%, #d32f2f 100%)',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.2), 0 4px 12px rgba(255,107,107,0.4), 0 0 20px rgba(255,87,87,0.5)'
            }}
            animate={{ rotate: [0, 180, 360], scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-0.5 bg-white rounded-full transform rotate-45" />
              <div className="absolute w-4 h-0.5 bg-white rounded-full transform -rotate-45" />
            </div>
          </motion.div>
          <motion.div
            className="relative w-5 h-5 rounded-full overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ff6b6b 0%, #ff5252 40%, #d32f2f 100%)',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.2), 0 4px 12px rgba(255,107,107,0.4), 0 0 20px rgba(255,87,87,0.5)'
            }}
            animate={{ rotate: [0, -180, -360], scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-0.5 bg-white rounded-full transform rotate-45" />
              <div className="absolute w-4 h-0.5 bg-white rounded-full transform -rotate-45" />
            </div>
          </motion.div>
        </div>
      );
    }
    
    if (pattern === '++') {
      return (
        <div className="flex space-x-3">
          <motion.div
            className="relative w-5 h-5 rounded-full overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #4caf50 0%, #388e3c 40%, #2e7d32 100%)',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.2), 0 4px 12px rgba(76,175,80,0.4), 0 0 20px rgba(76,175,80,0.5)'
            }}
            animate={{ scale: [1, 1.3, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-0.5 bg-white rounded-full" />
              <div className="absolute w-0.5 h-4 bg-white rounded-full" />
            </div>
          </motion.div>
          <motion.div
            className="relative w-5 h-5 rounded-full overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #4caf50 0%, #388e3c 40%, #2e7d32 100%)',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.2), 0 4px 12px rgba(76,175,80,0.4), 0 0 20px rgba(76,175,80,0.5)'
            }}
            animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-0.5 bg-white rounded-full" />
              <div className="absolute w-0.5 h-4 bg-white rounded-full" />
            </div>
          </motion.div>
        </div>
      );
    }
    
    if (pattern === '**') {
      return (
        <div className="flex space-x-3">
          <motion.div
            className="relative w-5 h-5 rounded-full overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffc107 0%, #ff9800 40%, #f57c00 100%)',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.2), 0 4px 12px rgba(255,193,7,0.4), 0 0 20px rgba(255,193,7,0.5)'
            }}
            animate={{ scale: [0.8, 1.5, 0.8], rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              {[0, 45, 90, 135].map((rotation, i) => (
                <div
                  key={i}
                  className="absolute w-3 h-0.5 bg-white rounded-full"
                  style={{ transform: `rotate(${rotation}deg)` }}
                />
              ))}
            </div>
          </motion.div>
          <motion.div
            className="relative w-5 h-5 rounded-full overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffc107 0%, #ff9800 40%, #f57c00 100%)',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.2), 0 4px 12px rgba(255,193,7,0.4), 0 0 20px rgba(255,193,7,0.5)'
            }}
            animate={{ scale: [0.8, 1.5, 0.8], rotate: [0, -360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              {[0, 45, 90, 135].map((rotation, i) => (
                <div
                  key={i}
                  className="absolute w-3 h-0.5 bg-white rounded-full"
                  style={{ transform: `rotate(${rotation}deg)` }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      );
    }
    
    return null;
  };

  const renderAntlers = () => (
    <div className="flex justify-center space-x-6 mb-2">
      <motion.div
        className="relative"
        animate={{
          rotateZ: state === 'thinking' ? [0, 8, -8, 0] : [0, 3, -3, 0]
        }}
        transition={{
          duration: state === 'idle' ? 4 : 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div
          className="w-1 h-6 rounded-full"
          style={{
            background: 'linear-gradient(145deg, #8b4513 0%, #654321 50%, #4a2c17 100%)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3), 0 2px 6px rgba(139,69,19,0.3)'
          }}
        />
        <div
          className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
          style={{
            background: 'linear-gradient(145deg, #a0522d 0%, #8b4513 100%)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
          }}
        />
      </motion.div>
      <motion.div
        className="relative"
        animate={{
          rotateZ: state === 'thinking' ? [0, -8, 8, 0] : [0, -3, 3, 0]
        }}
        transition={{
          duration: state === 'idle' ? 4 : 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.1
        }}
      >
        <div
          className="w-1 h-6 rounded-full"
          style={{
            background: 'linear-gradient(145deg, #8b4513 0%, #654321 50%, #4a2c17 100%)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3), 0 2px 6px rgba(139,69,19,0.3)'
          }}
        />
        <div
          className="absolute -top-1 -left-1 w-2 h-2 rounded-full"
          style={{
            background: 'linear-gradient(145deg, #a0522d 0%, #8b4513 100%)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
          }}
        />
      </motion.div>
    </div>
  );

  return (
    <div className="flex flex-col items-center">
      <motion.div
        className="flex flex-col items-center"
        animate={{
          scale: state === 'processing' ? [1, 1.05, 1] : [1, 1.02, 1],
          y: state === 'idle' ? [0, -1, 0] : [0, -2, 0]
        }}
        transition={{
          duration: state === 'processing' ? 1.5 : 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {renderAntlers()}
        {renderHelmet()}
      </motion.div>
      <div className="text-xs text-gray-400 mt-2 text-center max-w-40">
        {message}
      </div>
    </div>
  );
};

export default AnimatedAvatar;
