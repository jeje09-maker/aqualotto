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
  const poolLength = 56;
  const poolCenterZ = -25;
  const poolDepth = 3.2;

  const stadiumWidth = Math.max(60, poolWidth + 20);
  const stadiumLength = poolLength + 20;
  const roofHeight = 18;

  return (
    <group>
      {/* ================= 1. WATER SURFACE ================= */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.05, poolCenterZ]} receiveShadow>
        <planeGeometry args={[poolWidth, poolLength + 4]} />
        <meshStandardMaterial 
          color="#00a8e8" 
          transparent 
          opacity={0.6} 
          metalness={0.8} 
          roughness={0.05}
          emissive="#005b96"
          emissiveIntensity={0.35}
        />
      </mesh>

      {/* ================= 2. UNDERWATER POOL BASIN ================= */}
      {/* Pool Bottom Tiles */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -poolDepth, poolCenterZ]} receiveShadow>
        <planeGeometry args={[poolWidth, poolLength + 4]} />
        <meshStandardMaterial color="#cbeeff" roughness={0.2} metalness={0.1} />
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
            <mesh rotation-x={-Math.PI / 2} position={[laneX, -poolDepth + 0.01, 1.0]}>
              <planeGeometry args={[0.8, 0.3]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            {/* End Cross Bar (T-Shape) at Finish */}
            <mesh rotation-x={-Math.PI / 2} position={[laneX, -poolDepth + 0.01, -51.0]}>
              <planeGeometry args={[0.8, 0.3]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
          </group>
        );
      })}

      {/* Pool Basin Walls (Side & End Walls) */}
      <mesh position={[poolWidth / 2, -poolDepth / 2, poolCenterZ]}>
        <boxGeometry args={[0.4, poolDepth, poolLength + 4]} />
        <meshStandardMaterial color="#b3e5fc" roughness={0.3} />
      </mesh>
      <mesh position={[-poolWidth / 2, -poolDepth / 2, poolCenterZ]}>
        <boxGeometry args={[0.4, poolDepth, poolLength + 4]} />
        <meshStandardMaterial color="#b3e5fc" roughness={0.3} />
      </mesh>

      {/* Start Pool Wall */}
      <mesh position={[0, -poolDepth / 2, 3.5]}>
        <boxGeometry args={[poolWidth + 0.4, poolDepth, 0.6]} />
        <meshStandardMaterial color="#e0f7fa" roughness={0.3} />
      </mesh>

      {/* Finish Wall with Electronic Touchpads */}
      <group position={[0, -poolDepth / 2, -53.5]}>
        <mesh>
          <boxGeometry args={[poolWidth + 0.4, poolDepth, 0.6]} />
          <meshStandardMaterial color="#e0f7fa" roughness={0.3} />
        </mesh>
        {Array.from({ length: count }).map((_, i) => {
          const laneX = getLaneX(i, count, laneWidth);
          return (
            <mesh key={`pad-${i}`} position={[laneX, 0.8, 0.35]}>
              <boxGeometry args={[Math.min(2.4, laneWidth * 0.85), 1.5, 0.08]} />
              <meshStandardMaterial color="#ffcc00" metalness={0.4} roughness={0.4} />
            </mesh>
          );
        })}
      </group>

      {/* ================= 3. FINA LANE ROPES (FLOAT STRINGS) ================= */}
      {Array.from({ length: count + 1 }).map((_, i) => {
        const ropeX = getLaneX(i - 0.5, count, laneWidth);
        const color = (i === 0 || i === count) ? '#dc2626' : (i % 2 === 0 ? '#2563eb' : '#f59e0b');
        return (
          <group key={`rope-${i}`} position={[ropeX, 0.08, poolCenterZ]}>
            <mesh rotation-x={Math.PI / 2}>
              <cylinderGeometry args={[0.06, 0.06, poolLength + 4, 12]} />
              <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
            </mesh>
          </group>
        );
      })}

      {/* ================= 4. STARTING BLOCKS (PRO GRADE) ================= */}
      {Array.from({ length: count }).map((_, i) => {
        const blockX = getLaneX(i, count, laneWidth);
        return (
          <group key={`block-${i}`} position={[blockX, 0.7, 2.3]}>
            {/* Base Pedestal */}
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

      {/* ================= 5. INDOOR AQUATIC ARENA STRUCTURE ================= */}
      {/* Tiled Pool Deck (Floor around pool) */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, poolCenterZ]} receiveShadow>
        <planeGeometry args={[stadiumWidth, stadiumLength]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Arena Side Walls */}
      <mesh position={[stadiumWidth / 2, roofHeight / 2, poolCenterZ]}>
        <boxGeometry args={[1, roofHeight, stadiumLength]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>
      <mesh position={[-stadiumWidth / 2, roofHeight / 2, poolCenterZ]}>
        <boxGeometry args={[1, roofHeight, stadiumLength]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>

      {/* Back Wall behind Starting Blocks */}
      <mesh position={[0, roofHeight / 2, stadiumLength / 2 - 10]}>
        <boxGeometry args={[stadiumWidth, roofHeight, 1]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>

      {/* Front Wall behind Finish Line */}
      <mesh position={[0, roofHeight / 2, -stadiumLength / 2 - 10]}>
        <boxGeometry args={[stadiumWidth, roofHeight, 1]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>

      {/* High Arched Roof Ceiling */}
      <mesh position={[0, roofHeight, poolCenterZ]}>
        <boxGeometry args={[stadiumWidth, 1, stadiumLength]} />
        <meshStandardMaterial color="#020617" roughness={0.9} />
      </mesh>

      {/* Steel Roof Trusses & Ceiling Beams */}
      {Array.from({ length: 9 }).map((_, i) => {
        const trussZ = -55 + i * 14;
        return (
          <group key={`truss-${i}`} position={[0, roofHeight - 1, trussZ]}>
            <mesh>
              <boxGeometry args={[stadiumWidth - 2, 0.6, 0.6]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* Hanging LED Floodlights */}
            <mesh position={[-stadiumWidth * 0.25, -0.6, 0]}>
              <cylinderGeometry args={[1.2, 1.8, 0.8, 16]} />
              <meshStandardMaterial color="#f8fafc" emissive="#ffffff" emissiveIntensity={1.2} />
            </mesh>
            <mesh position={[0, -0.6, 0]}>
              <cylinderGeometry args={[1.2, 1.8, 0.8, 16]} />
              <meshStandardMaterial color="#f8fafc" emissive="#ffffff" emissiveIntensity={1.2} />
            </mesh>
            <mesh position={[stadiumWidth * 0.25, -0.6, 0]}>
              <cylinderGeometry args={[1.2, 1.8, 0.8, 16]} />
              <meshStandardMaterial color="#f8fafc" emissive="#ffffff" emissiveIntensity={1.2} />
            </mesh>
          </group>
        );
      })}

      {/* Arena Banner */}
      <mesh position={[0, roofHeight - 3.5, 3.4]} rotation={[0, 0, 0]}>
        <planeGeometry args={[Math.min(36, poolWidth * 0.9), 3.2]} />
        <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={0.6} />
      </mesh>

      {/* Underwater Pool Glow */}
      <pointLight position={[0, -1.2, -10]} color="#38bdf8" intensity={2.5} distance={30} />
      <pointLight position={[0, -1.2, -35]} color="#38bdf8" intensity={2.5} distance={30} />
    </group>
  );
};

export default SwimmingPool;
