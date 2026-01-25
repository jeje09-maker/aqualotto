
// @ts-nocheck
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Crowd: React.FC<{ swimmersCount: number }> = ({ swimmersCount }) => {
  const laneWidth = 3;
  const poolWidth = swimmersCount * laneWidth + 2;
  const poolLength = 55;
  const poolCenterZ = -26;
  
  const tierCount = 8; 
  const spectatorsPerTierLong = 85; // 옆면 밀도 증가
  const spectatorsPerTierShort = 30; // 앞뒤면 밀도 증가
  
  const totalSpectators = (spectatorsPerTierLong * 2 + spectatorsPerTierShort * 2) * tierCount;
  
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colors = ["#ff5252", "#448aff", "#ffeb3b", "#4caf50", "#ff4081", "#ffffff", "#00e5ff", "#aa00ff"];
  
  const spectators = useMemo(() => {
    const data = [];
    for (let tier = 0; tier < tierCount; tier++) {
      const tierOffset = tier * 0.8;
      const tierHeight = tier * 0.6 + 0.5;
      
      // 1. 양 옆면 (Sides) - 범위를 -70까지 확장하여 빈틈 제거
      for (let side = 0; side < 2; side++) {
        const x = (poolWidth / 2 + 2 + tierOffset) * (side === 0 ? 1 : -1);
        for (let i = 0; i < spectatorsPerTierLong; i++) {
          const z = (i / (spectatorsPerTierLong - 1)) * 85 - 70;
          data.push({ x, y: tierHeight, z, ...getRandomBehavior() });
        }
      }
      
      // 2. 앞뒤면 (Front & Back) - 폭을 넓혀 모서리 결합
      for (let side = 0; side < 2; side++) {
        const z = (side === 0 ? 10 : -70) + (side === 0 ? tierOffset : -tierOffset);
        for (let i = 0; i < spectatorsPerTierShort; i++) {
          const x = ((i / (spectatorsPerTierShort - 1)) - 0.5) * (poolWidth + 18 + tierOffset * 2.2);
          data.push({ x, y: tierHeight, z, ...getRandomBehavior() });
        }
      }
    }
    return data;
  }, [poolWidth]);

  function getRandomBehavior() {
    return {
      phase: Math.random() * Math.PI * 2,
      jumpSpeed: 3 + Math.random() * 5,
      jumpHeight: 0.1 + Math.random() * 0.15,
      color: new THREE.Color(colors[Math.floor(Math.random() * colors.length)])
    };
  }

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    
    spectators.forEach((s, i) => {
      const jump = Math.sin(t * s.jumpSpeed + s.phase) * s.jumpHeight;
      dummy.position.set(s.x, s.y + Math.max(0, jump), s.z);
      dummy.scale.set(0.4, 0.5, 0.4);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, s.color);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      {/* 4면 계단형 스탠드 구조물 - 길이를 늘려 빈틈 없이 연결 */}
      {Array.from({ length: tierCount }).map((_, tier) => (
        <group key={`tier-box-${tier}`}>
          {/* 양 옆 - 길이 90으로 확장 */}
          <mesh position={[poolWidth/2 + 2 + tier * 0.8, tier * 0.6, -30]}>
            <boxGeometry args={[1, 0.6, 90]} />
            <meshStandardMaterial color="#1a242a" />
          </mesh>
          <mesh position={[-(poolWidth/2 + 2 + tier * 0.8), tier * 0.6, -30]}>
            <boxGeometry args={[1, 0.6, 90]} />
            <meshStandardMaterial color="#1a242a" />
          </mesh>
          {/* 앞 뒤 - 폭 확장 */}
          <mesh position={[0, tier * 0.6, 10 + tier * 0.8]}>
            <boxGeometry args={[poolWidth + 15 + tier * 1.6, 0.6, 1]} />
            <meshStandardMaterial color="#1a242a" />
          </mesh>
          <mesh position={[0, tier * 0.6, -70 - tier * 0.8]}>
            <boxGeometry args={[poolWidth + 15 + tier * 1.6, 0.6, 1]} />
            <meshStandardMaterial color="#1a242a" />
          </mesh>
        </group>
      ))}
      <instancedMesh ref={meshRef} args={[null, null, totalSpectators]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial metalness={0.1} roughness={0.5} />
      </instancedMesh>
    </group>
  );
};

export default Crowd;
