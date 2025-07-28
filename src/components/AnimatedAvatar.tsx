import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface AnimatedAvatarProps {
  state: 'thinking' | 'searching' | 'browsing' | 'scraping' | 'processing' | 'idle';
  message: string;
}

const glyphs: Record<AnimatedAvatarProps['state'], string> = {
  thinking: '|',
  searching: '+',
  browsing: '*',
  scraping: '+',
  processing: 'X',
  idle: 'O',
};

const Avatar3D = ({ state }: { state: AnimatedAvatarProps['state'] }) => {
  const groupRef = useRef<THREE.Group>(null!); const matRef = useRef<THREE.MeshStandardMaterial>(null!);

  const eyeTex = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 256, 256);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 220px/256px ui-sans-serif, system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(glyphs[state], 128, 128);
    return new THREE.CanvasTexture(canvas);
  }, [state]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.7) * 0.15;
      groupRef.current.position.y = Math.sin(t * 1.8) * 0.08;
      groupRef.current.scale.setScalar(1 + Math.sin(t * 2.2) * 0.03);
    }
    if (matRef.current) {
      const glow = 0.5 + 0.5 * Math.sin(Date.now() * 0.003);
      matRef.current.emissive.setScalar(glow * 0.25);
    }
  });

  return (
    <group ref={groupRef}>
      <Sphere args={[1.2, 64, 64]}>
        <meshStandardMaterial
          ref={matRef}
          color="#1d6fa5"
          metalness={0.1}
          roughness={0.25}
          emissive="#1d6fa5"
        />
      </Sphere>
      <group position={[0, 0, 0.85]}>
        <mesh position={[-0.35, 0.1, 0]}>
          <planeGeometry args={[0.3, 0.3]} />
          <meshBasicMaterial map={eyeTex} transparent />
        </mesh>
        <mesh position={[0.35, 0.1, 0]}>
          <planeGeometry args={[0.3, 0.3]} />
          <meshBasicMaterial map={eyeTex} transparent />
        </mesh>
      </group>
    </group>
  );
};

const AnimatedAvatar: React.FC<AnimatedAvatarProps> = ({ state, message }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="w-24 h-24">
        <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <pointLight position={[10, 10, 10]} intensity={0.8} />
          <Avatar3D state={state} />
        </Canvas>
      </div>
      <div className="text-xs text-gray-400 mt-3 text-center max-w-40">
        {message}
      </div>
    </div>
  );
};

export default AnimatedAvatar;
