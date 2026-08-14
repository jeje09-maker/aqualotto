// @ts-nocheck
import React from 'react';
import * as THREE from 'three';

interface SwimmingPoolProps {
  count: number;
}

export const getLaneX = (laneIndex: number, totalCount: number, laneWidth: number) => {
  return (laneIndex - (totalCount - 1) / 2) * laneWidth;
};

const SwimmingPool: React.FC<SwimmingPoolProps> = ({ count }) => {
  const laneWidth = count > 15 ? 2.2 : 3.0;
  const poolWidth = count * laneWidth + 2.0;
  const poolLength = 55;
  const poolCenterZ = -25.1;
  const poolDepth = 3.2;

  const stadiumWidth = Math.max(70, poolWidth + 30);
  const stadiumLength = poolLength + 30;
  const roofHeight = 22;

  return (
    <group>
      {/* ================= 1. VIVID TURQUOISE WATER SURFACE ================= */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.05, poolCenterZ]} receiveShadow>
        <planeGeometry args={[poolWidth, poolLength]} />
        <meshStandardMaterial 
          color="#00f2fe" 
          transparent 
          opacity={0.72} 
          metalness={0.9} 
          roughness={0.02}
          emissive="#00c6ff"
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* ================= 2. UNDERWATER POOL BASIN ================= */}
      {/* Pool Bottom Tiles (Vivid Clean White/Cyan) */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -poolDepth, poolCenterZ]} receiveShadow>
        <planeGeometry args={[poolWidth, poolLength]} />
        <meshStandardMaterial color="#e0f2fe" roughness={0.15} metalness={0.2} />
      </mesh>

      {/* Black T-Markers on Pool Floor for each lane */}
      {Array.from({ length: count }).map((_, i) => {
        const laneX = getLaneX(i, count, laneWidth);
        return (
          <group key={`lane-floor-${i}`}>
            <mesh rotation-x={-Math.PI / 2} position={[laneX, -poolDepth + 0.01, poolCenterZ]}>
              <planeGeometry args={[0.3, poolLength - 2]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            <mesh rotation-x={-Math.PI / 2} position={[laneX, -poolDepth + 0.01, 1.2]}>
              <planeGeometry args={[0.8, 0.3]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            <mesh rotation-x={-Math.PI / 2} position={[laneX, -poolDepth + 0.01, -51.4]}>
              <planeGeometry args={[0.8, 0.3]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
          </group>
        );
      })}

      {/* Pool Basin Side Walls */}
      <mesh position={[poolWidth / 2, -poolDepth / 2, poolCenterZ]}>
        <boxGeometry args={[0.4, poolDepth, poolLength]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.2} />
      </mesh>
      <mesh position={[-poolWidth / 2, -poolDepth / 2, poolCenterZ]}>
        <boxGeometry args={[0.4, poolDepth, poolLength]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.2} />
      </mesh>

      {/* Start Pool Wall */}
      <mesh position={[0, -poolDepth / 2, 2.6]}>
        <boxGeometry args={[poolWidth + 0.4, poolDepth, 0.4]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} />
      </mesh>

      {/* Finish Wall with Vivid Yellow Touchpads at Z = -52.6 */}
      <group position={[0, -poolDepth / 2, -52.6]}>
        <mesh>
          <boxGeometry args={[poolWidth + 0.4, poolDepth, 0.4]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.2} />
        </mesh>
        {Array.from({ length: count }).map((_, i) => {
          const laneX = getLaneX(i, count, laneWidth);
          return (
            <mesh key={`pad-${i}`} position={[laneX, 0.8, 0.25]}>
              <boxGeometry args={[Math.min(2.4, laneWidth * 0.85), 1.5, 0.08]} />
              <meshStandardMaterial color="#ffcc00" metalness={0.6} roughness={0.2} />
            </mesh>
          );
        })}
      </group>

      {/* ================= 3. VIVID HIGH-CONTRAST FINA LANE ROPES ================= */}
      {Array.from({ length: count + 1 }).map((_, i) => {
        const ropeX = getLaneX(i - 0.5, count, laneWidth);
        const color = (i === 0 || i === count) ? '#ff0055' : (i % 2 === 0 ? '#0066ff' : '#ffcc00');
        return (
          <group key={`rope-${i}`} position={[ropeX, 0.08, poolCenterZ]}>
            <mesh rotation-x={Math.PI / 2}>
              <cylinderGeometry args={[0.07, 0.07, poolLength, 16]} />
              <meshStandardMaterial color={color} roughness={0.2} metalness={0.3} />
            </mesh>
          </group>
        );
      })}

      {/* ================= 4. STARTING BLOCKS (Vivid Cyan & White on Deck Z = 3.6) ================= */}
      {Array.from({ length: count }).map((_, i) => {
        const blockX = getLaneX(i, count, laneWidth);
        return (
          <group key={`block-${i}`} position={[blockX, 0.7, 3.6]}>
            <mesh castShadow>
              <boxGeometry args={[Math.min(1.8, laneWidth * 0.7), 1.4, 1.4]} />
              <meshStandardMaterial color="#0284c7" roughness={0.3} metalness={0.2} />
            </mesh>
            <mesh position={[0, 0.75, -0.1]} rotation={[-0.15, 0, 0]}>
              <boxGeometry args={[Math.min(1.9, laneWidth * 0.75), 0.12, 1.8]} />
              <meshStandardMaterial color="#ffffff" roughness={0.1} />
            </mesh>
            <mesh position={[0, 0.35, 0.72]}>
              <boxGeometry args={[Math.min(1.0, laneWidth * 0.5), 0.55, 0.05]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
          </group>
        );
      })}

      {/* ================= 5. BRIGHT CLEAN INDOOR POOL DECK ================= */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, poolCenterZ]} receiveShadow>
        <planeGeometry args={[stadiumWidth, stadiumLength]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* High Ceiling Trusses with Ultra-Bright Floodlights */}
      {Array.from({ length: 7 }).map((_, i) => {
        const trussZ = -50 + i * 16;
        return (
          <group key={`truss-${i}`} position={[0, roofHeight - 1, trussZ]}>
            <mesh>
              <boxGeometry args={[stadiumWidth - 4, 0.6, 0.6]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[-stadiumWidth * 0.25, -0.6, 0]}>
              <cylinderGeometry args={[1.2, 1.8, 0.8, 16]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2.5} />
            </mesh>
            <mesh position={[0, -0.6, 0]}>
              <cylinderGeometry args={[1.2, 1.8, 0.8, 16]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2.5} />
            </mesh>
            <mesh position={[stadiumWidth * 0.25, -0.6, 0]}>
              <cylinderGeometry args={[1.2, 1.8, 0.8, 16]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2.5} />
            </mesh>
          </group>
        );
      })}

      <pointLight position={[0, -1.2, -10]} color="#00f2fe" intensity={4.5} distance={40} />
      <pointLight position={[0, -1.2, -35]} color="#00f2fe" intensity={4.5} distance={40} />
    </group>
  );
};

export default SwimmingPool;
