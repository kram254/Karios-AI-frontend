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
      className="relative w-20 h-20 rounded-full overflow-hidden"
      style={{
        background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #f8fafc 20%, #e2e8f0 60%, #cbd5e1 100%)',
        boxShadow: 'inset 0 8px 16px rgba(255,255,255,0.8), inset 0 -8px 16px rgba(0,0,0,0.1), 0 12px 24px rgba(0,0,0,0.15)',
        transformStyle: 'preserve-3d',
        border: '2px solid rgba(255,255,255,0.3)'
      }}
      animate={{
        rotateY: state === 'processing' ? [0, 8, -8, 0] : [0, 2, -2, 0],
        scale: state === 'processing' ? [1, 1.03, 1] : [1, 1.01, 1]
      }}
      transition={{
        duration: state === 'processing' ? 2 : 4,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <div
        className="absolute top-2 left-2 right-2 h-4 rounded-full opacity-40"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.6) 100%)'
        }}
      />
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex space-x-3">
        {renderEyes()}
      </div>
      <div
        className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full opacity-30"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, #64748b 50%, transparent 100%)'
        }}
      />
    </motion.div>
  );

  const renderEyes = () => {
    const pattern = getEyePattern();
    
    if (pattern === '||') {
      return (
        <div className="flex space-x-2">
          <motion.div
            className="relative w-6 h-6 rounded-full overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 35% 30%, #ffffff 0%, #e0f2fe 30%, #0ea5e9 70%, #0284c7 100%)',
              boxShadow: 'inset 0 3px 6px rgba(255,255,255,0.7), inset 0 -3px 6px rgba(0,0,0,0.1), 0 4px 12px rgba(14,165,233,0.3)',
              border: '1px solid rgba(255,255,255,0.5)'
            }}
            animate={{ scale: [1, 1.05, 1], rotateZ: [0, 2, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              className="absolute w-4 h-4 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #1e40af 0%, #1d4ed8 50%, #1e3a8a 100%)'
              }}
              animate={{ scale: [0.8, 1, 0.8], x: [0, 1, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <div
                className="absolute w-1.5 h-1.5 rounded-full top-1 left-1"
                style={{ background: 'rgba(255,255,255,0.8)' }}
              />
            </motion.div>
          </motion.div>
          <motion.div
            className="relative w-6 h-6 rounded-full overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 35% 30%, #ffffff 0%, #e0f2fe 30%, #0ea5e9 70%, #0284c7 100%)',
              boxShadow: 'inset 0 3px 6px rgba(255,255,255,0.7), inset 0 -3px 6px rgba(0,0,0,0.1), 0 4px 12px rgba(14,165,233,0.3)',
              border: '1px solid rgba(255,255,255,0.5)'
            }}
            animate={{ scale: [1, 1.05, 1], rotateZ: [0, -2, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
          >
            <motion.div
              className="absolute w-4 h-4 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #1e40af 0%, #1d4ed8 50%, #1e3a8a 100%)'
              }}
              animate={{ scale: [0.8, 1, 0.8], x: [0, -1, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
            >
              <div
                className="absolute w-1.5 h-1.5 rounded-full top-1 left-1"
                style={{ background: 'rgba(255,255,255,0.8)' }}
              />
            </motion.div>
          </motion.div>
        </div>
      );
    }
    
    if (pattern === 'OO') {
      return (
        <div className="flex space-x-2">
          <motion.div
            className="relative w-6 h-6 rounded-full overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 35% 30%, #ffffff 0%, #f0fdf4 30%, #22c55e 70%, #16a34a 100%)',
              boxShadow: 'inset 0 3px 6px rgba(255,255,255,0.7), inset 0 -3px 6px rgba(0,0,0,0.1), 0 4px 12px rgba(34,197,94,0.3)',
              border: '1px solid rgba(255,255,255,0.5)'
            }}
            animate={{ scale: [1, 0.95, 1], rotateZ: [0, 1, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              className="absolute w-4 h-4 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #15803d 0%, #166534 50%, #14532d 100%)'
              }}
              animate={{ scale: [0.9, 1, 0.9], x: [0, 0.5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div
                className="absolute w-1.5 h-1.5 rounded-full top-1 left-1"
                style={{ background: 'rgba(255,255,255,0.8)' }}
              />
            </motion.div>
          </motion.div>
          <motion.div
            className="relative w-6 h-6 rounded-full overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 35% 30%, #ffffff 0%, #f0fdf4 30%, #22c55e 70%, #16a34a 100%)',
              boxShadow: 'inset 0 3px 6px rgba(255,255,255,0.7), inset 0 -3px 6px rgba(0,0,0,0.1), 0 4px 12px rgba(34,197,94,0.3)',
              border: '1px solid rgba(255,255,255,0.5)'
            }}
            animate={{ scale: [1, 0.95, 1], rotateZ: [0, -1, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
          >
            <motion.div
              className="absolute w-4 h-4 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #15803d 0%, #166534 50%, #14532d 100%)'
              }}
              animate={{ scale: [0.9, 1, 0.9], x: [0, -0.5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
            >
              <div
                className="absolute w-1.5 h-1.5 rounded-full top-1 left-1"
                style={{ background: 'rgba(255,255,255,0.8)' }}
              />
            </motion.div>
          </motion.div>
        </div>
      );
    }
    
    if (pattern === 'XX') {
      return (
        <div className="flex space-x-2">
          <motion.div
            className="relative w-6 h-6 rounded-full overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 35% 30%, #ffffff 0%, #fef2f2 30%, #ef4444 70%, #dc2626 100%)',
              boxShadow: 'inset 0 3px 6px rgba(255,255,255,0.7), inset 0 -3px 6px rgba(0,0,0,0.1), 0 4px 12px rgba(239,68,68,0.3)',
              border: '1px solid rgba(255,255,255,0.5)'
            }}
            animate={{ rotate: [0, 180, 360], scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          >
            <motion.div
              className="absolute w-4 h-4 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #991b1b 0%, #7f1d1d 50%, #450a0a 100%)'
              }}
              animate={{ scale: [0.8, 1.1, 0.8] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-0.5 bg-white rounded-full transform rotate-45" />
                <div className="absolute w-3 h-0.5 bg-white rounded-full transform -rotate-45" />
              </div>
            </motion.div>
          </motion.div>
          <motion.div
            className="relative w-6 h-6 rounded-full overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 35% 30%, #ffffff 0%, #fef2f2 30%, #ef4444 70%, #dc2626 100%)',
              boxShadow: 'inset 0 3px 6px rgba(255,255,255,0.7), inset 0 -3px 6px rgba(0,0,0,0.1), 0 4px 12px rgba(239,68,68,0.3)',
              border: '1px solid rgba(255,255,255,0.5)'
            }}
            animate={{ rotate: [0, -180, -360], scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          >
            <motion.div
              className="absolute w-4 h-4 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #991b1b 0%, #7f1d1d 50%, #450a0a 100%)'
              }}
              animate={{ scale: [0.8, 1.1, 0.8] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-0.5 bg-white rounded-full transform rotate-45" />
                <div className="absolute w-3 h-0.5 bg-white rounded-full transform -rotate-45" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      );
    }
    
    if (pattern === '++') {
      return (
        <div className="flex space-x-2">
          <motion.div
            className="relative w-6 h-6 rounded-full overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 35% 30%, #ffffff 0%, #fefce8 30%, #eab308 70%, #ca8a04 100%)',
              boxShadow: 'inset 0 3px 6px rgba(255,255,255,0.7), inset 0 -3px 6px rgba(0,0,0,0.1), 0 4px 12px rgba(234,179,8,0.3)',
              border: '1px solid rgba(255,255,255,0.5)'
            }}
            animate={{ rotate: [0, 90, 180, 270, 360], scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              className="absolute w-4 h-4 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #a16207 0%, #854d0e 50%, #713f12 100%)'
              }}
              animate={{ scale: [0.8, 1.1, 0.8] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-0.5 bg-white rounded-full" />
                <div className="absolute w-0.5 h-3 bg-white rounded-full" />
              </div>
              <div
                className="absolute w-1.5 h-1.5 rounded-full top-1 left-1"
                style={{ background: 'rgba(255,255,255,0.6)' }}
              />
            </motion.div>
          </motion.div>
          <motion.div
            className="relative w-6 h-6 rounded-full overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 35% 30%, #ffffff 0%, #fefce8 30%, #eab308 70%, #ca8a04 100%)',
              boxShadow: 'inset 0 3px 6px rgba(255,255,255,0.7), inset 0 -3px 6px rgba(0,0,0,0.1), 0 4px 12px rgba(234,179,8,0.3)',
              border: '1px solid rgba(255,255,255,0.5)'
            }}
            animate={{ rotate: [0, -90, -180, -270, -360], scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              className="absolute w-4 h-4 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #a16207 0%, #854d0e 50%, #713f12 100%)'
              }}
              animate={{ scale: [0.8, 1.1, 0.8] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-0.5 bg-white rounded-full" />
                <div className="absolute w-0.5 h-3 bg-white rounded-full" />
              </div>
              <div
                className="absolute w-1.5 h-1.5 rounded-full top-1 left-1"
                style={{ background: 'rgba(255,255,255,0.6)' }}
              />
            </motion.div>
          </motion.div>
        </div>
      );
    }
    
    if (pattern === '**') {
      return (
        <div className="flex space-x-2">
          <motion.div
            className="relative w-6 h-6 rounded-full overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 35% 30%, #ffffff 0%, #fffbeb 30%, #f59e0b 70%, #d97706 100%)',
              boxShadow: 'inset 0 3px 6px rgba(255,255,255,0.7), inset 0 -3px 6px rgba(0,0,0,0.1), 0 4px 12px rgba(245,158,11,0.3)',
              border: '1px solid rgba(255,255,255,0.5)'
            }}
            animate={{ scale: [1, 1.1, 1], rotate: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              className="absolute w-4 h-4 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #92400e 0%, #78350f 50%, #451a03 100%)'
              }}
              animate={{ scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {[0, 45, 90, 135].map((rotation, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2.5 h-0.5 bg-white rounded-full"
                    style={{ transform: `rotate(${rotation}deg)` }}
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
                  />
                ))}
              </div>
              <div
                className="absolute w-1.5 h-1.5 rounded-full top-1 left-1"
                style={{ background: 'rgba(255,255,255,0.6)' }}
              />
            </motion.div>
          </motion.div>
          <motion.div
            className="relative w-6 h-6 rounded-full overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 35% 30%, #ffffff 0%, #fffbeb 30%, #f59e0b 70%, #d97706 100%)',
              boxShadow: 'inset 0 3px 6px rgba(255,255,255,0.7), inset 0 -3px 6px rgba(0,0,0,0.1), 0 4px 12px rgba(245,158,11,0.3)',
              border: '1px solid rgba(255,255,255,0.5)'
            }}
            animate={{ scale: [1, 1.1, 1], rotate: [0, -360] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          >
            <motion.div
              className="absolute w-4 h-4 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #92400e 0%, #78350f 50%, #451a03 100%)'
              }}
              animate={{ scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {[0, 45, 90, 135].map((rotation, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2.5 h-0.5 bg-white rounded-full"
                    style={{ transform: `rotate(${rotation}deg)` }}
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: (i * 0.1) + 0.2 }}
                  />
                ))}
              </div>
              <div
                className="absolute w-1.5 h-1.5 rounded-full top-1 left-1"
                style={{ background: 'rgba(255,255,255,0.6)' }}
              />
            </motion.div>
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
