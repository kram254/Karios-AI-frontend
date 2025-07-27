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
        <div className="flex space-x-3">
          <motion.div
            className="w-6 h-8 rounded-full relative overflow-hidden"
            style={{
              background: 'radial-gradient(ellipse at 30% 30%, #ffffff 0%, #f8f9fa 40%, #e9ecef 100%)',
              boxShadow: 'inset -2px -2px 4px rgba(255,255,255,0.8), inset 2px 2px 6px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)'
            }}
            animate={{ scaleY: [1, 1.1, 1], rotateX: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div 
              className="absolute top-1/2 left-1/2 h-5 w-0.5 bg-gray-700 rounded-full transform -translate-y-1/2 -translate-x-1/2"
              animate={{ scaleY: [0.7, 1, 0.7], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          </motion.div>
          <motion.div
            className="w-6 h-8 rounded-full relative overflow-hidden"
            style={{
              background: 'radial-gradient(ellipse at 30% 30%, #ffffff 0%, #f8f9fa 40%, #e9ecef 100%)',
              boxShadow: 'inset -2px -2px 4px rgba(255,255,255,0.8), inset 2px 2px 6px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)'
            }}
            animate={{ scaleY: [1, 1.1, 1], rotateX: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          >
            <motion.div 
              className="absolute top-1/2 left-1/2 h-5 w-0.5 bg-gray-700 rounded-full transform -translate-y-1/2 -translate-x-1/2"
              animate={{ scaleY: [0.7, 1, 0.7], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
            />
          </motion.div>
        </div>
      );
    }
    
    if (pattern === 'OO') {
      // Idle eyes - circles
      return (
        <div className="flex space-x-3">
          <motion.div
            className="w-6 h-6 rounded-full"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #f8f9fa 40%, #e9ecef 100%)',
              boxShadow: 'inset -2px -2px 4px rgba(255,255,255,0.8), inset 2px 2px 6px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)'
            }}
            animate={{ scale: [1, 0.95, 1], rotateY: [0, 8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="w-6 h-6 rounded-full"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #f8f9fa 40%, #e9ecef 100%)',
              boxShadow: 'inset -2px -2px 4px rgba(255,255,255,0.8), inset 2px 2px 6px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)'
            }}
            animate={{ scale: [1, 0.95, 1], rotateY: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
          />
        </div>
      );
    }
    
    if (pattern === 'XX') {
      // Processing eyes - X shape
      return (
        <div className="flex space-x-3">
          <motion.div
            className="w-6 h-6 rounded-full relative overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #f8f9fa 40%, #e9ecef 100%)',
              boxShadow: 'inset -2px -2px 4px rgba(255,255,255,0.8), inset 2px 2px 6px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)'
            }}
            animate={{ rotate: [0, 180, 360], scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-0.5 bg-gray-700 rounded-full transform rotate-45" />
              <div className="absolute w-4 h-0.5 bg-gray-700 rounded-full transform -rotate-45" />
            </div>
          </motion.div>
          <motion.div
            className="w-6 h-6 rounded-full relative overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #f8f9fa 40%, #e9ecef 100%)',
              boxShadow: 'inset -2px -2px 4px rgba(255,255,255,0.8), inset 2px 2px 6px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)'
            }}
            animate={{ rotate: [0, -180, -360], scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-0.5 bg-gray-700 rounded-full transform rotate-45" />
              <div className="absolute w-4 h-0.5 bg-gray-700 rounded-full transform -rotate-45" />
            </div>
          </motion.div>
        </div>
      );
    }
    
    if (pattern === '++') {
      // Searching eyes - plus shape
      return (
        <div className="flex space-x-3">
          <motion.div
            className="w-6 h-6 rounded-full relative overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #f8f9fa 40%, #e9ecef 100%)',
              boxShadow: 'inset -2px -2px 4px rgba(255,255,255,0.8), inset 2px 2px 6px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)'
            }}
            animate={{ scale: [1, 1.15, 1], rotate: [0, 45, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-0.5 bg-gray-700 rounded-full" />
              <div className="absolute w-0.5 h-4 bg-gray-700 rounded-full" />
            </div>
          </motion.div>
          <motion.div
            className="w-6 h-6 rounded-full relative overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #f8f9fa 40%, #e9ecef 100%)',
              boxShadow: 'inset -2px -2px 4px rgba(255,255,255,0.8), inset 2px 2px 6px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)'
            }}
            animate={{ scale: [1, 1.15, 1], rotate: [0, -45, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-0.5 bg-gray-700 rounded-full" />
              <div className="absolute w-0.5 h-4 bg-gray-700 rounded-full" />
            </div>
          </motion.div>
        </div>
      );
    }
    
    if (pattern === '**') {
      // Browsing eyes - star/asterisk shape
      return (
        <div className="flex space-x-3">
          <motion.div
            className="w-6 h-6 rounded-full relative overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #f8f9fa 40%, #e9ecef 100%)',
              boxShadow: 'inset -2px -2px 4px rgba(255,255,255,0.8), inset 2px 2px 6px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)'
            }}
            animate={{ scale: [0.95, 1.2, 0.95], rotate: [0, 360, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              {[0, 45, 90, 135].map((rotation, i) => (
                <div
                  key={i}
                  className="absolute w-4 h-0.5 bg-gray-700 rounded-full"
                  style={{ transform: `rotate(${rotation}deg)` }}
                />
              ))}
            </div>
          </motion.div>
          <motion.div
            className="w-6 h-6 rounded-full relative overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #f8f9fa 40%, #e9ecef 100%)',
              boxShadow: 'inset -2px -2px 4px rgba(255,255,255,0.8), inset 2px 2px 6px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)'
            }}
            animate={{ scale: [0.95, 1.2, 0.95], rotate: [0, -360, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              {[0, 45, 90, 135].map((rotation, i) => (
                <div
                  key={i}
                  className="absolute w-4 h-0.5 bg-gray-700 rounded-full"
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
    <div className="flex justify-center space-x-8 mb-1">
      <motion.div
        className="relative"
        animate={{
          rotateZ: state === 'thinking' ? [0, 12, -12, 0] : [0, 5, -5, 0]
        }}
        transition={{
          duration: state === 'idle' ? 4 : 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div
          className="w-1.5 h-8 rounded-full"
          style={{
            background: 'linear-gradient(145deg, #8b4513 0%, #654321 50%, #4a2c17 100%)',
            boxShadow: 'inset -1px -1px 2px rgba(255,255,255,0.3), inset 1px 1px 3px rgba(0,0,0,0.4), 0 3px 8px rgba(139,69,19,0.4)'
          }}
        />
        <div
          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
          style={{
            background: 'linear-gradient(145deg, #a0522d 0%, #8b4513 100%)',
            boxShadow: 'inset -1px -1px 1px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.3)'
          }}
        />
        <div
          className="absolute top-2 -right-0.5 w-1.5 h-1.5 rounded-full"
          style={{
            background: 'linear-gradient(145deg, #a0522d 0%, #8b4513 100%)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
          }}
        />
      </motion.div>
      <motion.div
        className="relative"
        animate={{
          rotateZ: state === 'thinking' ? [0, -12, 12, 0] : [0, -5, 5, 0]
        }}
        transition={{
          duration: state === 'idle' ? 4 : 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.1
        }}
      >
        <div
          className="w-1.5 h-8 rounded-full"
          style={{
            background: 'linear-gradient(145deg, #8b4513 0%, #654321 50%, #4a2c17 100%)',
            boxShadow: 'inset -1px -1px 2px rgba(255,255,255,0.3), inset 1px 1px 3px rgba(0,0,0,0.4), 0 3px 8px rgba(139,69,19,0.4)'
          }}
        />
        <div
          className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full"
          style={{
            background: 'linear-gradient(145deg, #a0522d 0%, #8b4513 100%)',
            boxShadow: 'inset -1px -1px 1px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.3)'
          }}
        />
        <div
          className="absolute top-2 -left-0.5 w-1.5 h-1.5 rounded-full"
          style={{
            background: 'linear-gradient(145deg, #a0522d 0%, #8b4513 100%)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
          }}
        />
      </motion.div>
    </div>
  );

  return (
    <div className="flex flex-col items-center">
      <motion.div
        className="relative w-24 h-24 rounded-full flex flex-col items-center justify-center"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #4ec5f1, #1d6fa5)',
          boxShadow: 'inset -5px -5px 10px rgba(255,255,255,0.15), inset 5px 5px 15px rgba(0,0,0,0.2), 0 5px 15px rgba(0,0,0,0.3)',
          border: '2px solid #1b4e6b'
        }}
        animate={{
          scale: state === 'processing' ? [1, 1.05, 1] : [1, 1.02, 1],
          y: state === 'idle' ? [0, -1, 0] : [0, -2, 0],
          rotateY: state === 'processing' ? [0, 5, -5, 0] : [0, 2, -2, 0]
        }}
        transition={{
          duration: state === 'processing' ? 1.5 : 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* Helmet highlight */}
        <div
          className="absolute top-2 left-2 right-2 h-3 rounded-t-full opacity-30"
          style={{
            background: 'linear-gradient(90deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.4) 100%)'
          }}
        />
        
        {/* Antlers positioned above helmet */}
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
          {renderAntlers()}
        </div>
        
        {/* Eyes positioned in center of helmet */}
        <div className="relative z-10">
          {renderEyesContainer()}
        </div>
        
        {/* Bottom helmet detail */}
        <div
          className="absolute bottom-1 left-3 right-3 h-1 rounded-full opacity-20"
          style={{
            background: 'linear-gradient(90deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.3) 100%)'
          }}
        />
      </motion.div>
      <div className="text-xs text-gray-400 mt-3 text-center max-w-40">
        {message}
      </div>
    </div>
  );
};

export default AnimatedAvatar;
