import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface AnimatedAvatarProps {
  state: 'thinking' | 'searching' | 'browsing' | 'scraping' | 'processing' | 'idle';
  message: string;
}

const glyphs: Record<AnimatedAvatarProps['state'], string> = {
  thinking: '||',
  searching: '++',
  browsing: '**',
  scraping: '++',
  processing: 'XX',
  idle: 'OO',
};

const Avatar3D = ({ state }: { state: AnimatedAvatarProps['state'] }) => {
  const groupRef = useRef<THREE.Group>(null!);

  const eyeTex = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 512, 512);
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 8;
    ctx.font = 'bold 400px/512px ui-sans-serif, system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(glyphs[state], 256, 256);
    ctx.strokeText(glyphs[state], 256, 256);
    return new THREE.CanvasTexture(canvas);
  }, [state]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.7) * 0.15;
      groupRef.current.position.y = Math.sin(t * 1.8) * 0.08;
      groupRef.current.scale.setScalar(1 + Math.sin(t * 2.2) * 0.03);
    }
  });

  return (
    <group ref={groupRef}>
      <Sphere args={[1.2, 64, 64]}>
        <meshStandardMaterial
          color="#2563eb"
          metalness={0.3}
          roughness={0.1}
          emissive="#1e40af"
          emissiveIntensity={0.1}
        />
      </Sphere>
      <group position={[0, 0.1, 1.0]}>
        <mesh position={[-0.4, 0, 0]}>
          <planeGeometry args={[0.4, 0.4]} />
          <meshBasicMaterial map={eyeTex} transparent />
        </mesh>
        <mesh position={[0.4, 0, 0]}>
          <planeGeometry args={[0.4, 0.4]} />
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
