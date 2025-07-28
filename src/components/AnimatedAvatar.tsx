import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface AnimatedAvatarProps {
  state: 'thinking' | 'searching' | 'browsing' | 'scraping' | 'processing' | 'idle';
  message: string;
}

// Eye state definitions for five avatar states
const eyeStates = {
  thinking: { open: true, leftOffset: 0, rightOffset: 0, scale: 1, blink: false }, // normal open eyes
  searching: { open: true, leftOffset: -0.04, rightOffset: 0.04, scale: 1.1, blink: false }, // eyes looking to sides
  browsing: { open: true, leftOffset: 0, rightOffset: 0, scale: 1, blink: true }, // blinking
  scraping: { open: true, leftOffset: 0, rightOffset: 0, scale: 1, blink: false }, // normal open eyes
  processing: { open: false, leftOffset: 0, rightOffset: 0, scale: 1, blink: false }, // closed eyes
  idle: { open: true, leftOffset: 0, rightOffset: 0, scale: 1, blink: false }, // normal open eyes
};

interface Avatar3DProps {
  state: 'thinking' | 'searching' | 'browsing' | 'scraping' | 'processing' | 'idle';
}

const Avatar3D = React.forwardRef<THREE.Group, Avatar3DProps>(({ state }, _ref) => {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  // Animation and state
  const currentEyeState = eyeStates[state as keyof typeof eyeStates] || eyeStates.idle;
  const [blink, setBlink] = React.useState(false);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.7) * 0.15;
      groupRef.current.position.y = Math.sin(t * 1.8) * 0.08;
      groupRef.current.scale.setScalar(1 + Math.sin(t * 2.2) * 0.03);
    }
    // Blinking logic for 'browsing' state
    if (currentEyeState.blink) {
      const blinkNow = Math.sin(t * 3.5) > 0.95;
      if (blink !== blinkNow) setBlink(blinkNow);
    } else if (blink) {
      setBlink(false);
    }
  });

  useFrame(() => {
    if (matRef.current) {
      const glow = 0.5 + 0.5 * Math.sin(Date.now() * 0.003);
      matRef.current.emissive.setScalar(glow * 0.1);
    }
  });

  // Eye rendering helper
  const renderEye = (side = 'left') => {
    const x = side === 'left' ? -0.28 + currentEyeState.leftOffset : 0.28 + currentEyeState.rightOffset;
    const y = 0.22;
    const scale = currentEyeState.scale;
    const isOpen = currentEyeState.open && !(blink && currentEyeState.blink) && state !== 'processing';
    return (
      <group position={[x, y, 0.7]}>
        {/* Eye white */}
        <mesh scale={[0.17 * scale, 0.17 * scale, 0.12]}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshStandardMaterial color="#fff" roughness={0.3} metalness={0.05} />
        </mesh>
        {/* Pupil */}
        {isOpen && (
          <mesh position={[0, 0, 0.09]} scale={[0.33, 0.33, 1]}>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshStandardMaterial color="#222" />
          </mesh>
        )}
        {/* Closed eye (lid) */}
        {!isOpen && (
          <mesh position={[0, 0.01, 0.11]}>
            <planeGeometry args={[0.14, 0.03]} />
            <meshStandardMaterial color="#bbb" />
          </mesh>
        )}
      </group>
    );
  };

  return (
    <group ref={groupRef}>
      {/* Head sphere */}
      <Sphere args={[0.8, 32, 32]}>
        <meshStandardMaterial
          ref={matRef}
          color="#f6f8fa"
          metalness={0.08}
          roughness={0.18}
        />
      </Sphere>
      {/* Eyes */}
      {renderEye('left')}
      {renderEye('right')}

    </group>
  );
});

const AnimatedAvatar: React.FC<AnimatedAvatarProps> = ({ state, message }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="w-24 h-24">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Avatar3D state={state} />
          <ambientLight intensity={0.6} />
          <pointLight position={[10, 10, 10]} intensity={0.8} />
        </Canvas>
      </div>
      <div className="text-xs text-gray-400 mt-3 text-center max-w-40">
        {message}
      </div>
    </div>
  );
};

export default AnimatedAvatar;
