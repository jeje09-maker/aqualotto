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
      {/* ================= 1. WATER SURFACE ================= */}
      {/* Water pool from Z = 2.4 to Z = -52.6 */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.05, poolCenterZ]} receiveShadow>
        <planeGeometry args={[poolWidth, poolLength]} />
        <meshStandardMaterial 
          color="#00b4d8" 
          transparent 
          opacity={0.65} 
          metalness={0.8} 
          roughness={0.05}
          emissive="#0077b6"
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* ================= 2. UNDERWATER POOL BASIN ================= */}
      {/* Pool Bottom Tiles */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -poolDepth, poolCenterZ]} receiveShadow>
        <planeGeometry args={[poolWidth, poolLength]} />
        <meshStandardMaterial color="#caf0f8" roughness={0.2} metalness={0.1} />
      </mesh>

      {/* Black T-Markers on Pool Floor for each lane */}
      {Array.from({ length: count }).map((_, i) => {
        const laneX = getLaneX(i, count, laneWidth);
        return (
          <group key={`lane-floor-${i}`}>
            {/* Long Lane Center Line */}
            <mesh rotation-x={-Math.PI / 2} position={[laneX, -poolDepth + 0.01, poolCenterZ]}>
              <planeGeometry args={[0.3, poolLength - 2]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            {/* End Cross Bar (T-Shape) at Start */}
            <mesh rotation-x={-Math.PI / 2} position={[laneX, -poolDepth + 0.01, 1.2]}>
              <planeGeometry args={[0.8, 0.3]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            {/* End Cross Bar (T-Shape) at Finish */}
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
        <meshStandardMaterial color="#90e0ef" roughness={0.3} />
      </mesh>
      <mesh position={[-poolWidth / 2, -poolDepth / 2, poolCenterZ]}>
        <boxGeometry args={[0.4, poolDepth, poolLength]} />
        <meshStandardMaterial color="#90e0ef" roughness={0.3} />
      </mesh>

      {/* Start Pool Wall (Separates water Z=2.4 from pool deck Z=2.6+) */}
      <mesh position={[0, -poolDepth / 2, 2.6]}>
        <boxGeometry args={[poolWidth + 0.4, poolDepth, 0.4]} />
        <meshStandardMaterial color="#e0f7fa" roughness={0.3} />
      </mesh>

      {/* Finish Wall with Yellow Touchpads at Z = -52.6 */}
      <group position={[0, -poolDepth / 2, -52.6]}>
        <mesh>
          <boxGeometry args={[poolWidth + 0.4, poolDepth, 0.4]} />
          <meshStandardMaterial color="#e0f7fa" roughness={0.3} />
        </mesh>
        {Array.from({ length: count }).map((_, i) => {
          const laneX = getLaneX(i, count, laneWidth);
          return (
            <mesh key={`pad-${i}`} position={[laneX, 0.8, 0.25]}>
              <boxGeometry args={[Math.min(2.4, laneWidth * 0.85), 1.5, 0.08]} />
              <meshStandardMaterial color="#ffcc00" metalness={0.4} roughness={0.4} />
            </mesh>
          );
        })}
      </group>

      {/* ================= 3. FINA LANE ROPES ================= */}
      {Array.from({ length: count + 1 }).map((_, i) => {
        const ropeX = getLaneX(i - 0.5, count, laneWidth);
        const color = (i === 0 || i === count) ? '#dc2626' : (i % 2 === 0 ? '#2563eb' : '#f59e0b');
        return (
          <group key={`rope-${i}`} position={[ropeX, 0.08, poolCenterZ]}>
            <mesh rotation-x={Math.PI / 2}>
              <cylinderGeometry args={[0.06, 0.06, poolLength, 12]} />
              <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
            </mesh>
          </group>
        );
      })}

      {/* ================= 4. STARTING BLOCKS (Pulled Back on Dry Deck Floor Z = 3.6!) ================= */}
      {Array.from({ length: count }).map((_, i) => {
        const blockX = getLaneX(i, count, laneWidth);
        return (
          <group key={`block-${i}`} position={[blockX, 0.7, 3.6]}>
            {/* Base Pedestal on Deck */}
            <mesh castShadow>
              <boxGeometry args={[Math.min(1.8, laneWidth * 0.7), 1.4, 1.4]} />
              <meshStandardMaterial color="#1e293b" roughness={0.5} />
            </mesh>
            {/* Inclined Top Platform */}
            <mesh position={[0, 0.75, -0.1]} rotation={[-0.15, 0, 0]}>
              <boxGeometry args={[Math.min(1.9, laneWidth * 0.75), 0.12, 1.8]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.2} />
            </mesh>
            {/* Lane Number Plate */}
            <mesh position={[0, 0.35, 0.72]}>
              <boxGeometry args={[Math.min(1.0, laneWidth * 0.5), 0.55, 0.05]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
          </group>
        );
      })}

      {/* ================= 5. INDOOR AQUATIC ARENA ================= */}
      {/* Tiled Pool Deck */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, poolCenterZ]} receiveShadow>
        <planeGeometry args={[stadiumWidth, stadiumLength]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* High Ceiling Trusses with Bright Indoor Floodlights */}
      {Array.from({ length: 7 }).map((_, i) => {
        const trussZ = -50 + i * 16;
        return (
          <group key={`truss-${i}`} position={[0, roofHeight - 1, trussZ]}>
            <mesh>
              <boxGeometry args={[stadiumWidth - 4, 0.6, 0.6]} />
              <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[-stadiumWidth * 0.25, -0.6, 0]}>
              <cylinderGeometry args={[1.2, 1.8, 0.8, 16]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.5} />
            </mesh>
            <mesh position={[0, -0.6, 0]}>
              <cylinderGeometry args={[1.2, 1.8, 0.8, 16]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.5} />
            </mesh>
            <mesh position={[stadiumWidth * 0.25, -0.6, 0]}>
              <cylinderGeometry args={[1.2, 1.8, 0.8, 16]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.5} />
            </mesh>
          </group>
        );
      })}

      {/* Underwater Pool Light */}
      <pointLight position={[0, -1.2, -10]} color="#48cae4" intensity={3.0} distance={35} />
      <pointLight position={[0, -1.2, -35]} color="#48cae4" intensity={3.0} distance={35} />
    </group>
  );
};

export default SwimmingPool;
