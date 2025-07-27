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

  const renderEyesContainer = () => (
    <motion.div
      className="relative flex justify-center"
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
      {renderEyes()}
    </motion.div>
  );

  const renderEyes = () => {
    const pattern = getEyePattern();
    
    if (pattern === '||') {
      // Thinking eyes - vertical lines
      return (
        <div className="flex space-x-4">
          <motion.div
            className="w-5 h-8 bg-white rounded-full relative"
            animate={{ scaleY: [1, 1.1, 1], rotateX: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div 
              className="absolute inset-x-0 top-1/2 h-5 w-0.5 bg-white rounded-full transform -translate-y-1/2 left-1/2 -translate-x-1/2"
              animate={{ scaleY: [0.7, 1, 0.7] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          </motion.div>
          <motion.div
            className="w-5 h-8 bg-white rounded-full relative"
            animate={{ scaleY: [1, 1.1, 1], rotateX: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          >
            <motion.div 
              className="absolute inset-x-0 top-1/2 h-5 w-0.5 bg-white rounded-full transform -translate-y-1/2 left-1/2 -translate-x-1/2"
              animate={{ scaleY: [0.7, 1, 0.7] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
            />
          </motion.div>
        </div>
      );
    }
    
    if (pattern === 'OO') {
      // Idle eyes - circles
      return (
        <div className="flex space-x-4">
          <motion.div
            className="w-5 h-5 bg-white rounded-full"
            animate={{ scale: [1, 0.9, 1], rotateY: [0, 10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="w-5 h-5 bg-white rounded-full"
            animate={{ scale: [1, 0.9, 1], rotateY: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
          />
        </div>
      );
    }
    
    if (pattern === 'XX') {
      // Processing eyes - X shape
      return (
        <div className="flex space-x-4">
          <motion.div
            className="w-5 h-5 bg-white rounded-full relative"
            animate={{ rotate: [0, 180, 360], scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-0.5 bg-black rounded-full transform rotate-45" />
              <div className="absolute w-4 h-0.5 bg-black rounded-full transform -rotate-45" />
            </div>
          </motion.div>
          <motion.div
            className="w-5 h-5 bg-white rounded-full relative"
            animate={{ rotate: [0, -180, -360], scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-0.5 bg-black rounded-full transform rotate-45" />
              <div className="absolute w-4 h-0.5 bg-black rounded-full transform -rotate-45" />
            </div>
          </motion.div>
        </div>
      );
    }
    
    if (pattern === '++') {
      // Searching eyes - plus shape
      return (
        <div className="flex space-x-4">
          <motion.div
            className="w-5 h-5 bg-white rounded-full relative"
            animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-0.5 bg-black rounded-full" />
              <div className="absolute w-0.5 h-4 bg-black rounded-full" />
            </div>
          </motion.div>
          <motion.div
            className="w-5 h-5 bg-white rounded-full relative"
            animate={{ scale: [1, 1.2, 1], rotate: [0, -45, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-0.5 bg-black rounded-full" />
              <div className="absolute w-0.5 h-4 bg-black rounded-full" />
            </div>
          </motion.div>
        </div>
      );
    }
    
    if (pattern === '**') {
      // Browsing eyes - star/asterisk shape
      return (
        <div className="flex space-x-4">
          <motion.div
            className="w-5 h-5 bg-white rounded-full relative"
            animate={{ scale: [0.9, 1.2, 0.9], rotate: [0, 360, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              {[0, 45, 90, 135].map((rotation, i) => (
                <div
                  key={i}
                  className="absolute w-4 h-0.5 bg-black rounded-full"
                  style={{ transform: `rotate(${rotation}deg)` }}
                />
              ))}
            </div>
          </motion.div>
          <motion.div
            className="w-5 h-5 bg-white rounded-full relative"
            animate={{ scale: [0.9, 1.2, 0.9], rotate: [0, -360, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              {[0, 45, 90, 135].map((rotation, i) => (
                <div
                  key={i}
                  className="absolute w-4 h-0.5 bg-black rounded-full"
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
        {renderEyesContainer()}
      </motion.div>
      <div className="text-xs text-gray-400 mt-2 text-center max-w-40">
        {message}
      </div>
    </div>
  );
};

export default AnimatedAvatar;
