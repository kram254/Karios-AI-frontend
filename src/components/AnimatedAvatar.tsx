import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, RoundedBox } from '@react-three/drei';
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

const Avatar3D: React.FC<{ state: AnimatedAvatarProps['state'] }> = ({ state }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const matRef = useRef<THREE.MeshStandardMaterial>(null!);

  const eyeTex = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 256, 256);
    ctx.fillStyle = '#ffffff';
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
  });

  useFrame(() => {
    if (matRef.current) {
      const glow = 0.5 + 0.5 * Math.sin(Date.now() * 0.003);
      matRef.current.emissive.setScalar(glow * 0.25);
    }
  });

  return (
    <group ref={groupRef}>
      <RoundedBox args={[1.2, 1.2, 1.1]} radius={0.4} smoothness={4}>
        <meshStandardMaterial
          ref={matRef}
          color="#f0f9ff"
          metalness={0.1}
          roughness={0.25}
        />
      </RoundedBox>

      <group position={[0, 0.08, 0.56]}>
        {[-0.22, 0.22].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]}>
            <planeGeometry args={[0.32, 0.32]} />
            <meshBasicMaterial map={eyeTex} transparent />
          </mesh>
        ))}
      </group>

      {[-0.6, 0.6].map((x, i) => (
        <Sphere key={i} args={[0.18, 16, 16]} position={[x, -0.2, 0.45]}>
          <meshBasicMaterial color="#ff8fab" transparent opacity={0.5} />
        </Sphere>
      ))}

      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.4]} />
        <meshStandardMaterial color="#c084fc" emissive="#c084fc" emissiveIntensity={0.3} />
      </mesh>
      <Sphere args={[0.1]} position={[0, 0.95, 0]}>
        <meshStandardMaterial color="#c084fc" emissive="#c084fc" emissiveIntensity={0.7} />
      </Sphere>
    </group>
  );
};

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
