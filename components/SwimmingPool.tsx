
// @ts-nocheck
import React from 'react';
import * as THREE from 'three';

interface SwimmingPoolProps {
  count: number;
}

const SwimmingPool: React.FC<SwimmingPoolProps> = ({ count }) => {
  const laneWidth = count > 15 ? 2.2 : 3;
  const poolWidth = count * laneWidth + 2;
  const poolLength = 55;

  return (
    <group>
      {/* 수면 */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.05, -26]} receiveShadow>
        <planeGeometry args={[poolWidth, poolLength + 4]} />
        <meshStandardMaterial 
          color="#00bcd4" 
          transparent 
          opacity={0.45} 
          metalness={0.9} 
          roughness={0.02}
          emissive="#00838f"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* 수영장 바닥 */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -2, -26]} receiveShadow>
        <planeGeometry args={[poolWidth, poolLength + 4]} />
        <meshStandardMaterial color="#e0f7fa" />
      </mesh>
      
      {/* 레인 마커 */}
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={`marker-${i}`} rotation-x={-Math.PI / 2} position={[(i - (count - 1) / 2) * laneWidth, -1.99, -26]}>
          <planeGeometry args={[0.35, poolLength]} />
          <meshStandardMaterial color="#263238" />
        </mesh>
      ))}

      {/* 사이드 벽 */}
      <mesh position={[poolWidth / 2 + 0.25, -0.2, -26]}>
        <boxGeometry args={[0.5, 3.6, poolLength + 4]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-poolWidth / 2 - 0.25, -0.2, -26]}>
        <boxGeometry args={[0.5, 3.6, poolLength + 4]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* 출발 지점 벽 */}
      <mesh position={[0, -0.2, 3.5]}>
        <boxGeometry args={[poolWidth + 1, 3.6, 1]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>

      {/* 결승 지점 벽 및 터치패드 */}
      <group position={[0, -0.2, -53.5]}>
        <mesh>
          <boxGeometry args={[poolWidth + 1, 3.6, 0.4]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        {Array.from({ length: count }).map((_, i) => (
          <mesh key={`pad-${i}`} position={[(i - (count - 1) / 2) * laneWidth, 0.8, 0.3]}>
            <boxGeometry args={[Math.min(2.4, laneWidth * 0.85), 1.4, 0.1]} />
            <meshStandardMaterial color="#ffd600" metalness={0.3} roughness={0.5} />
          </mesh>
        ))}
      </group>

      {/* 출발대 (Starting Blocks) */}
      {Array.from({ length: count }).map((_, i) => (
        <group key={`block-${i}`} position={[(i - (count - 1) / 2) * laneWidth, 0.6, 2.2]}>
          <mesh castShadow>
            <boxGeometry args={[Math.min(1.8, laneWidth * 0.7), 1.2, 1.4]} />
            <meshStandardMaterial color="#263238" />
          </mesh>
          <mesh position={[0, 0.65, -0.1]} rotation={[-0.1, 0, 0]}>
            <boxGeometry args={[Math.min(1.9, laneWidth * 0.75), 0.1, 1.8]} />
            <meshStandardMaterial color="#fafafa" />
          </mesh>
          <mesh position={[0, 0.3, 0.71]}>
             <boxGeometry args={[Math.min(1.0, laneWidth * 0.5), 0.5, 0.05]} />
             <meshStandardMaterial color="white" />
          </mesh>
        </group>
      ))}
      
      <gridHelper args={[Math.max(300, poolWidth + 100), 50, 0x222222, 0x111111]} position={[0, -0.01, -26]} />
    </group>
  );
};

export default SwimmingPool;

