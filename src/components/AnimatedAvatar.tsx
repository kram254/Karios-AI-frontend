import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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



  const renderAvatar = () => {
    const baseSize = avatarSize.width;
    
    switch (state) {
      case 'thinking':
        return (
          <motion.div
            style={{
              width: baseSize,
              height: baseSize,
              position: 'relative',
              transformStyle: 'preserve-3d'
            }}
            animate={{
              rotateY: [0, 8, -8, 0],
              scale: [1, 1.05, 1],
              transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <motion.div
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4), inset 0 2px 8px rgba(255,255,255,0.2)',
                position: 'relative'
              }}
              animate={{
                scale: [1, 1.02, 1],
                transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              <motion.div
                style={{
                  position: 'absolute',
                  top: '25%',
                  left: '30%',
                  width: '8px',
                  height: '16px',
                  background: 'white',
                  borderRadius: '2px'
                }}
                animate={{
                  scaleY: [1, 0.8, 1],
                  transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
                }}
              />
              <motion.div
                style={{
                  position: 'absolute',
                  top: '25%',
                  right: '30%',
                  width: '8px',
                  height: '16px',
                  background: 'white',
                  borderRadius: '2px'
                }}
                animate={{
                  scaleY: [1, 0.8, 1],
                  transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.1 }
                }}
              />
              <motion.div
                style={{
                  position: 'absolute',
                  bottom: '30%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '12px',
                  height: '6px',
                  borderRadius: '0 0 12px 12px',
                  background: 'white',
                  opacity: 0.8
                }}
                animate={{
                  scaleX: [1, 1.2, 1],
                  transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                }}
              />
              {[0, 1].map((i) => (
                <motion.div
                  key={i}
                  style={{
                    position: 'absolute',
                    top: '15%',
                    left: i === 0 ? '25%' : '75%',
                    width: '4px',
                    height: '4px',
                    background: '#fbbf24',
                    borderRadius: '50%'
                  }}
                  animate={{
                    y: [-2, 2, -2],
                    opacity: [0.5, 1, 0.5],
                    transition: { duration: 1, repeat: Infinity, delay: i * 0.3 }
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        );

      case 'searching':
        return (
          <motion.div
            style={{
              width: baseSize,
              height: baseSize,
              position: 'relative',
              transformStyle: 'preserve-3d'
            }}
            animate={{
              rotateY: [0, 360],
              scale: [1, 1.1, 1],
              transition: { duration: 3, repeat: Infinity, ease: "linear" }
            }}
          >
            <motion.div
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4), inset 0 2px 8px rgba(255,255,255,0.2)'
              }}
            >
              <motion.div
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.3, 1],
                  transition: { duration: 2, repeat: Infinity, ease: "linear" }
                }}
              >
                <svg width={baseSize * 0.6} height={baseSize * 0.6} viewBox="0 0 24 24" fill="none">
                  <motion.circle cx="12" cy="12" r="8" stroke="white" strokeWidth="2" fill="none" opacity="0.3" />
                  <motion.circle cx="12" cy="12" r="5" stroke="white" strokeWidth="1.5" fill="none" opacity="0.5" />
                  <motion.circle cx="12" cy="12" r="2" fill="white" />
                  <motion.path
                    d="M12 4 L12 12 L18 8"
                    stroke="#fbbf24"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </motion.div>
            </motion.div>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '100%',
                  height: '100%',
                  border: '2px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
                animate={{
                  scale: [1, 2, 1],
                  opacity: [0.8, 0, 0.8],
                  transition: { duration: 1.5, repeat: Infinity }
                }}
                transition={{ delay: i * 0.5 }}
              />
            ))}
          </motion.div>
        );

      case 'browsing':
        return (
          <motion.div
            style={{
              width: baseSize,
              height: baseSize,
              position: 'relative',
              transformStyle: 'preserve-3d'
            }}
            animate={{
              rotateX: [0, 10, -10, 0],
              scale: [1, 1.05, 1],
              transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <motion.div
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4), inset 0 2px 8px rgba(255,255,255,0.2)'
              }}
            >
              <motion.div
                style={{
                  width: baseSize * 0.7,
                  height: baseSize * 0.4,
                  background: 'white',
                  borderRadius: '50%',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                animate={{
                  scaleX: [1, 0.1, 1],
                  transition: { duration: 0.3, repeat: Infinity, repeatDelay: 2 }
                }}
              >
                <motion.div
                  style={{
                    width: baseSize * 0.3,
                    height: baseSize * 0.3,
                    background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                    borderRadius: '50%',
                    position: 'relative'
                  }}
                  animate={{
                    x: [-2, 2, -2],
                    y: [-1, 1, -1],
                    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '20%',
                      left: '30%',
                      width: '30%',
                      height: '30%',
                      background: 'white',
                      borderRadius: '50%',
                      opacity: 0.8
                    }}
                  />
                </motion.div>
              </motion.div>
            </motion.div>
            <motion.div
              style={{
                position: 'absolute',
                top: '10%',
                right: '15%',
                width: '6px',
                height: '6px',
                background: '#fbbf24',
                borderRadius: '50%'
              }}
              animate={{
                scale: [0, 1.5, 0],
                opacity: [0, 1, 0]
              }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />
          </motion.div>
        );

      case 'scraping':
        return (
          <motion.div
            style={{
              width: baseSize,
              height: baseSize,
              position: 'relative',
              transformStyle: 'preserve-3d'
            }}
            animate={{
              rotateZ: [0, 5, -5, 0],
              scale: [1, 1.08, 1],
              transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <motion.div
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(245, 158, 11, 0.4), inset 0 2px 8px rgba(255,255,255,0.2)'
              }}
            >
              <motion.div
                animate={{
                  rotate: [0, 15, -15, 0],
                  scale: [1, 1.2, 1],
                  transition: { duration: 1, repeat: Infinity, ease: "easeInOut" }
                }}
              >
                <svg width={baseSize * 0.6} height={baseSize * 0.6} viewBox="0 0 24 24" fill="none">
                  <motion.path
                    d="M8 2 L12 6 L16 2 M12 6 L12 14 M8 14 L12 18 L16 14"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <motion.circle cx="12" cy="10" r="2" fill="white" opacity="0.8" />
                </svg>
              </motion.div>
            </motion.div>
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  top: `${20 + i * 15}%`,
                  left: `${20 + i * 15}%`,
                  width: '4px',
                  height: '4px',
                  background: '#fbbf24',
                  borderRadius: '50%'
                }}
                animate={{
                  scale: [0, 1.5, 0],
                  opacity: [0, 1, 0],
                  rotate: [0, 180],
                  transition: { duration: 0.6, repeat: Infinity }
                }}
                transition={{ delay: i * 0.2 }}
              />
            ))}
          </motion.div>
        );

      case 'processing':
        return (
          <motion.div
            style={{
              width: baseSize,
              height: baseSize,
              position: 'relative',
              transformStyle: 'preserve-3d'
            }}
            animate={{
              rotateY: [0, 12, -12, 0],
              scale: [1, 1.08, 1],
              transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <motion.div
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(239, 68, 68, 0.4), inset 0 2px 8px rgba(255,255,255,0.2)',
                position: 'relative'
              }}
            >
              <motion.div
                style={{
                  position: 'absolute',
                  top: '28%',
                  left: '28%',
                  width: '8px',
                  height: '8px'
                }}
                animate={{
                  rotate: [0, 45, 90, 135, 180],
                  transition: { duration: 0.6, repeat: Infinity, ease: "linear" }
                }}
              >
                <div style={{ width: '100%', height: '2px', background: 'white', position: 'absolute', top: '50%', transform: 'translateY(-50%)' }} />
                <div style={{ width: '2px', height: '100%', background: 'white', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }} />
              </motion.div>
              <motion.div
                style={{
                  position: 'absolute',
                  top: '28%',
                  right: '28%',
                  width: '8px',
                  height: '8px'
                }}
                animate={{
                  rotate: [0, 45, 90, 135, 180],
                  transition: { duration: 0.6, repeat: Infinity, ease: "linear", delay: 0.2 }
                }}
              >
                <div style={{ width: '100%', height: '2px', background: 'white', position: 'absolute', top: '50%', transform: 'translateY(-50%)' }} />
                <div style={{ width: '2px', height: '100%', background: 'white', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }} />
              </motion.div>
              <motion.div
                style={{
                  position: 'absolute',
                  bottom: '30%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '14px',
                  height: '8px',
                  borderRadius: '14px',
                  background: 'white',
                  opacity: 0.9
                }}
                animate={{
                  scaleY: [1, 0.4, 1],
                  transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                }}
              />
            </motion.div>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: `${100 + i * 20}%`,
                  height: `${100 + i * 20}%`,
                  border: '2px solid rgba(251, 191, 36, 0.3)',
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.2, 1],
                  transition: { duration: 1.5, repeat: Infinity, ease: "linear" }
                }}
                transition={{ delay: i * 0.3 }}
              />
            ))}
          </motion.div>
        );

      default:
        return (
          <motion.div
            style={{
              width: baseSize,
              height: baseSize,
              background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
              borderRadius: '50%',
              boxShadow: '0 4px 16px rgba(107, 114, 128, 0.3)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            animate={{
              scale: [1, 1.02, 1],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <motion.div
              style={{
                position: 'absolute',
                top: '30%',
                left: '32%',
                width: '6px',
                height: '6px',
                background: 'white',
                borderRadius: '50%',
                opacity: 0.6
              }}
            />
            <motion.div
              style={{
                position: 'absolute',
                top: '30%',
                right: '32%',
                width: '6px',
                height: '6px',
                background: 'white',
                borderRadius: '50%',
                opacity: 0.6
              }}
            />
            <motion.div
              style={{
                position: 'absolute',
                bottom: '35%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '10px',
                height: '4px',
                borderRadius: '10px',
                background: 'white',
                opacity: 0.5
              }}
            />
          </motion.div>
        );
    }
  };

  if (state === 'idle') {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl border border-gray-700"
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{
          boxShadow: '0 10px 40px rgba(0,0,0,0.3), 0 0 20px rgba(59, 130, 246, 0.1)'
        }}
      >
        <motion.div
          initial={{ rotate: -180, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "backOut" }}
        >
          {renderAvatar()}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <motion.span 
            className="text-sm font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            {getStateMessage(state)}
          </motion.span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AnimatedAvatar;
