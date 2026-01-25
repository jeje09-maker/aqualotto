
// @ts-nocheck
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SplashProps {
  position: [number, number, number];
  scale?: number;
  rate?: number;
}

const Splash: React.FC<SplashProps> = ({ position, scale = 1, rate = 1 }) => {
  const count = 50;
  const mesh = useRef();
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 10;
      const factor = 1 + Math.random() * 2;
      const speed = 0.05 + Math.random() * 0.1;
      // Explosive upward burst
      const xVel = (Math.random() - 0.5) * 1.5;
      const yVel = Math.random() * 2.5;
      const zVel = (Math.random() - 0.5) * 1.5;
      temp.push({ t, factor, speed, xVel, yVel, zVel });
    }
    return temp;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!mesh.current) return;
    
    const time = state.clock.getElapsedTime() * rate;
    
    particles.forEach((particle, i) => {
      let { t, xVel, yVel, zVel } = particle;
      
      // Calculate individual particle life cycle
      const life = (time + particle.t) % 1.5;
      const progress = life / 1.5;
      
      // Physics: Position = initial + velocity*t - 0.5*g*t^2
      const x = xVel * life;
      const y = (yVel * life) - (4.9 * life * life); // Gravity
      const z = zVel * life;
      
      dummy.position.set(x, Math.max(0, y), z);
      
      // Scale down over time
      const s = Math.max(0, (1 - progress) * 0.25 * scale);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[null, null, count]} position={position}>
      <sphereGeometry args={[0.3, 6, 6]} />
      <meshStandardMaterial color="#ffffff" transparent opacity={0.7} />
    </instancedMesh>
  );
};

export default Splash;
