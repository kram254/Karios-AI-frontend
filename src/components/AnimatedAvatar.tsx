import React from 'react';
import { motion } from 'framer-motion';

export type AvatarState = 'thinking' | 'searching' | 'browsing' | 'scraping' | 'processing' | 'idle';

interface AnimatedAvatarProps {
  state: AvatarState;
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

const AnimatedAvatar: React.FC<AnimatedAvatarProps> = ({ 
  state, 
  message, 
  size = 'small' 
}) => {
  const getStateMessage = (state: AvatarState): string => {
    if (message) return message;
    
    switch (state) {
      case 'thinking':
        return 'Thinking...';
      case 'searching':
        return 'Searching the web';
      case 'browsing':
        return 'Browsing';
      case 'scraping':
        return 'Gathering information';
      case 'processing':
        return 'Processing';
      default:
        return '';
    }
  };

  const getAvatarSize = () => {
    switch (size) {
      case 'small':
        return { width: 32, height: 32 };
      case 'medium':
        return { width: 40, height: 40 };
      case 'large':
        return { width: 48, height: 48 };
      default:
        return { width: 32, height: 32 };
    }
  };

  const avatarSize = getAvatarSize();

  const dotVariants = {
    initial: { y: 0 },
    animate: {
      y: [-2, -6, -2],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const pulseVariants = {
    initial: { scale: 1, opacity: 0.8 },
    animate: {
      scale: [1, 1.1, 1],
      opacity: [0.8, 1, 0.8],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const rotateVariants = {
    initial: { rotate: 0 },
    animate: {
      rotate: 360,
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  const renderAvatar = () => {
    switch (state) {
      case 'thinking':
        return (
          <div className="flex items-center space-x-1">
            <motion.div
              style={{
                width: avatarSize.width,
                height: avatarSize.height,
                backgroundColor: '#3B82F6',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
              variants={pulseVariants}
              initial="initial"
              animate="animate"
            >
              <div className="flex space-x-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    style={{
                      width: 3,
                      height: 3,
                      backgroundColor: 'white',
                      borderRadius: '50%'
                    }}
                    variants={dotVariants}
                    initial="initial"
                    animate="animate"
                    transition={{ delay: i * 0.2 }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        );

      case 'searching':
        return (
          <div className="flex items-center space-x-1">
            <motion.div
              style={{
                width: avatarSize.width,
                height: avatarSize.height,
                backgroundColor: '#10B981',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              variants={rotateVariants}
              initial="initial"
              animate="animate"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </motion.div>
          </div>
        );

      case 'browsing':
        return (
          <div className="flex items-center space-x-1">
            <motion.div
              style={{
                width: avatarSize.width,
                height: avatarSize.height,
                backgroundColor: '#8B5CF6',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              variants={pulseVariants}
              initial="initial"
              animate="animate"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </motion.div>
          </div>
        );

      case 'scraping':
        return (
          <div className="flex items-center space-x-1">
            <motion.div
              style={{
                width: avatarSize.width,
                height: avatarSize.height,
                backgroundColor: '#F59E0B',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              variants={rotateVariants}
              initial="initial"
              animate="animate"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
              </svg>
            </motion.div>
          </div>
        );

      case 'processing':
        return (
          <div className="flex items-center space-x-1">
            <motion.div
              style={{
                width: avatarSize.width,
                height: avatarSize.height,
                backgroundColor: '#EF4444',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              variants={pulseVariants}
              initial="initial"
              animate="animate"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </motion.div>
          </div>
        );

      default:
        return (
          <div
            style={{
              width: avatarSize.width,
              height: avatarSize.height,
              backgroundColor: '#6B7280',
              borderRadius: '50%'
            }}
          />
        );
    }
  };

  if (state === 'idle') {
    return null;
  }

  return (
    <motion.div
      className="flex items-center space-x-2 px-3 py-2 bg-gray-800 rounded-lg"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      {renderAvatar()}
      <span className="text-sm text-gray-300 font-medium">
        {getStateMessage(state)}
      </span>
    </motion.div>
  );
};

export default AnimatedAvatar;
