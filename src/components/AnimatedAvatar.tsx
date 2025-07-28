import React, { useRef, useMemo } from 'react';
// import { Canvas, useFrame } from '@react-three/fiber';
// import { Sphere, Box } from '@react-three/drei';
// import * as THREE from 'three';
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
      // Thinking eyes - vertical lines
      return (
        <div className="flex space-x-2">
          <motion.div
            className="w-4 h-5 rounded-full relative overflow-hidden"
            style={{
              background: 'radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.95) 0%, rgba(248,249,250,0.9) 40%, rgba(233,236,239,0.85) 100%)',
              boxShadow: 'inset -1px -1px 3px rgba(255,255,255,0.9), inset 1px 1px 3px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.1), 0 0 8px rgba(255,255,255,0.3)'
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
            className="w-4 h-5 rounded-full relative overflow-hidden"
            style={{
              background: 'radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.95) 0%, rgba(248,249,250,0.9) 40%, rgba(233,236,239,0.85) 100%)',
              boxShadow: 'inset -1px -1px 3px rgba(255,255,255,0.9), inset 1px 1px 3px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.1), 0 0 8px rgba(255,255,255,0.3)'
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
        <div className="flex space-x-2">
          <motion.div
            className="w-4 h-4 rounded-full"
            style={{
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95) 0%, rgba(248,249,250,0.9) 40%, rgba(233,236,239,0.85) 100%)',
              boxShadow: 'inset -1px -1px 3px rgba(255,255,255,0.9), inset 1px 1px 3px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.1), 0 0 8px rgba(255,255,255,0.3)'
            }}
            animate={{ scale: [1, 0.95, 1], rotateY: [0, 8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="w-4 h-4 rounded-full"
            style={{
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95) 0%, rgba(248,249,250,0.9) 40%, rgba(233,236,239,0.85) 100%)',
              boxShadow: 'inset -1px -1px 3px rgba(255,255,255,0.9), inset 1px 1px 3px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.1), 0 0 8px rgba(255,255,255,0.3)'
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
        <div className="flex space-x-2">
          <motion.div
            className="w-4 h-4 rounded-full relative overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95) 0%, rgba(248,249,250,0.9) 40%, rgba(233,236,239,0.85) 100%)',
              boxShadow: 'inset -1px -1px 3px rgba(255,255,255,0.9), inset 1px 1px 3px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.1), 0 0 8px rgba(255,255,255,0.3)'
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
            className="w-4 h-4 rounded-full relative overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95) 0%, rgba(248,249,250,0.9) 40%, rgba(233,236,239,0.85) 100%)',
              boxShadow: 'inset -1px -1px 3px rgba(255,255,255,0.9), inset 1px 1px 3px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.1), 0 0 8px rgba(255,255,255,0.3)'
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
        <div className="flex space-x-2">
          <motion.div
            className="w-4 h-4 rounded-full relative overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95) 0%, rgba(248,249,250,0.9) 40%, rgba(233,236,239,0.85) 100%)',
              boxShadow: 'inset -1px -1px 3px rgba(255,255,255,0.9), inset 1px 1px 3px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.1), 0 0 8px rgba(255,255,255,0.3)'
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
            className="w-4 h-4 rounded-full relative overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95) 0%, rgba(248,249,250,0.9) 40%, rgba(233,236,239,0.85) 100%)',
              boxShadow: 'inset -1px -1px 3px rgba(255,255,255,0.9), inset 1px 1px 3px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.1), 0 0 8px rgba(255,255,255,0.3)'
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
        <div className="flex space-x-2">
          <motion.div
            className="w-4 h-4 rounded-full relative overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95) 0%, rgba(248,249,250,0.9) 40%, rgba(233,236,239,0.85) 100%)',
              boxShadow: 'inset -1px -1px 3px rgba(255,255,255,0.9), inset 1px 1px 3px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.1), 0 0 8px rgba(255,255,255,0.3)'
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
            className="w-4 h-4 rounded-full relative overflow-hidden"
            style={{
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95) 0%, rgba(248,249,250,0.9) 40%, rgba(233,236,239,0.85) 100%)',
              boxShadow: 'inset -1px -1px 3px rgba(255,255,255,0.9), inset 1px 1px 3px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.1), 0 0 8px rgba(255,255,255,0.3)'
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



  return (
    <div className="flex flex-col items-center">
      <motion.div
        className="relative w-12 h-12 rounded-full flex items-center justify-center"
        style={{
          background: 'rgba(55, 65, 81, 0.9)',
          border: '2px solid rgba(75, 85, 99, 0.8)'
        }}
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
        <div className="relative z-10">
          {renderEyes()}
        </div>
      </motion.div>
      <div className="text-xs text-gray-400 mt-3 text-center max-w-40">
        {message}
      </div>
    </div>
  );
};

export default AnimatedAvatar;
