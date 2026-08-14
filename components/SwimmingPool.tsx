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
      {/* ================= 1. ELECTRIC NEON CYAN WATER SURFACE ================= */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.05, poolCenterZ]} receiveShadow>
        <planeGeometry args={[poolWidth, poolLength]} />
        <meshStandardMaterial 
          color="#00e5ff" 
          transparent 
          opacity={0.75} 
          metalness={0.95} 
          roughness={0.01}
          emissive="#00b0ff"
          emissiveIntensity={0.7}
        />
      </mesh>

      {/* ================= 2. UNDERWATER POOL BASIN ================= */}
      {/* Pool Bottom Tiles (Vivid Deep Cyan Blue) */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -poolDepth, poolCenterZ]} receiveShadow>
        <planeGeometry args={[poolWidth, poolLength]} />
        <meshStandardMaterial color="#00b0ff" roughness={0.1} metalness={0.2} />
      </mesh>

      {/* Black T-Markers on Pool Floor for each lane */}
      {Array.from({ length: count }).map((_, i) => {
        const laneX = getLaneX(i, count, laneWidth);
        return (
          <group key={`lane-floor-${i}`}>
            <mesh rotation-x={-Math.PI / 2} position={[laneX, -poolDepth + 0.01, poolCenterZ]}>
              <planeGeometry args={[0.35, poolLength - 2]} />
              <meshStandardMaterial color="#0b0f19" />
            </mesh>
            <mesh rotation-x={-Math.PI / 2} position={[laneX, -poolDepth + 0.01, 1.2]}>
              <planeGeometry args={[0.9, 0.35]} />
              <meshStandardMaterial color="#0b0f19" />
            </mesh>
            <mesh rotation-x={-Math.PI / 2} position={[laneX, -poolDepth + 0.01, -51.4]}>
              <planeGeometry args={[0.9, 0.35]} />
              <meshStandardMaterial color="#0b0f19" />
            </mesh>
          </group>
        );
      })}

      {/* ================= 3. PROMINENT POOL BOUNDARY WALLS (수영장 테두리 벽) ================= */}
      {/* Left Raised Side Wall */}
      <mesh position={[-poolWidth / 2 - 0.2, -poolDepth / 2 + 0.2, poolCenterZ]}>
        <boxGeometry args={[0.4, poolDepth + 0.4, poolLength]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} />
      </mesh>
      {/* Right Raised Side Wall */}
      <mesh position={[poolWidth / 2 + 0.2, -poolDepth / 2 + 0.2, poolCenterZ]}>
        <boxGeometry args={[0.4, poolDepth + 0.4, poolLength]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} />
      </mesh>
      {/* Start Pool Raised Deck Wall */}
      <mesh position={[0, -poolDepth / 2 + 0.2, 2.6]}>
        <boxGeometry args={[poolWidth + 0.8, poolDepth + 0.4, 0.5]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} />
      </mesh>

      {/* ================= 4. FINISH LINE END WALL & ELECTRONIC TOUCHPADS (결승 터치패드 & 결승 벽) ================= */}
      <group position={[0, 0, -52.4]}>
        {/* Solid White Pool End Wall (Standing from underwater Y=-3.2 up to Y=0.5 above water!) */}
        <mesh position={[0, -poolDepth / 2 + 0.2, 0]}>
          <boxGeometry args={[poolWidth + 0.8, poolDepth + 0.5, 0.5]} />
          <meshStandardMaterial color="#ffffff" roughness={0.1} />
        </mesh>
        {/* Blue Top Wall Coping Line */}
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[poolWidth + 0.8, 0.12, 0.52]} />
          <meshStandardMaterial color="#0284c7" roughness={0.1} />
        </mesh>

        {/* FINA Electronic Yellow Touchpads (1.6m tall, clearly visible above & below water!) */}
        {Array.from({ length: count }).map((_, i) => {
          const laneX = getLaneX(i, count, laneWidth);
          return (
            <group key={`pad-${i}`} position={[laneX, -0.3, 0.28]}>
              {/* Electric Yellow Touchpad Surface */}
              <mesh>
                <boxGeometry args={[Math.min(2.4, laneWidth * 0.85), 1.6, 0.08]} />
                <meshStandardMaterial color="#ffea00" metalness={0.7} roughness={0.1} />
              </mesh>
              {/* Black Outer Perimeter Frame */}
              <mesh position={[0, 0, -0.02]}>
                <boxGeometry args={[Math.min(2.5, laneWidth * 0.88), 1.7, 0.06]} />
                <meshStandardMaterial color="#0f172a" />
              </mesh>
              {/* Lane Number Mark on Touchpad Top */}
              <mesh position={[0, 0.65, 0.045]}>
                <boxGeometry args={[0.3, 0.2, 0.01]} />
                <meshStandardMaterial color="#000000" />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* ================= 5. ELECTRIC VIVID FINA LANE ROPES ================= */}
      {Array.from({ length: count + 1 }).map((_, i) => {
        const ropeX = getLaneX(i - 0.5, count, laneWidth);
        const color = (i === 0 || i === count) ? '#ff0044' : (i % 2 === 0 ? '#0055ff' : '#ffaa00');
        return (
          <group key={`rope-${i}`} position={[ropeX, 0.08, poolCenterZ]}>
            <mesh rotation-x={Math.PI / 2}>
              <cylinderGeometry args={[0.075, 0.075, poolLength, 16]} />
              <meshStandardMaterial color={color} roughness={0.1} metalness={0.4} />
            </mesh>
          </group>
        );
      })}

      {/* ================= 6. STARTING BLOCKS (Vivid Cyan Pedestal & Snow White Top) ================= */}
      {Array.from({ length: count }).map((_, i) => {
        const blockX = getLaneX(i, count, laneWidth);
        return (
          <group key={`block-${i}`} position={[blockX, 0.7, 3.6]}>
            <mesh castShadow>
              <boxGeometry args={[Math.min(1.8, laneWidth * 0.7), 1.4, 1.4]} />
              <meshStandardMaterial color="#0284c7" roughness={0.2} metalness={0.3} />
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

      {/* ================= 7. PURE SNOW WHITE INDOOR POOL DECK ================= */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, poolCenterZ]} receiveShadow>
        <planeGeometry args={[stadiumWidth, stadiumLength]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.1} />
      </mesh>

      {/* High Ceiling Trusses with Ultra-Bright Floodlights */}
      {Array.from({ length: 7 }).map((_, i) => {
        const trussZ = -50 + i * 16;
        return (
          <group key={`truss-${i}`} position={[0, roofHeight - 1, trussZ]}>
            <mesh>
              <boxGeometry args={[stadiumWidth - 4, 0.6, 0.6]} />
              <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[-stadiumWidth * 0.25, -0.6, 0]}>
              <cylinderGeometry args={[1.2, 1.8, 0.8, 16]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3.0} />
            </mesh>
            <mesh position={[0, -0.6, 0]}>
              <cylinderGeometry args={[1.2, 1.8, 0.8, 16]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3.0} />
            </mesh>
            <mesh position={[stadiumWidth * 0.25, -0.6, 0]}>
              <cylinderGeometry args={[1.2, 1.8, 0.8, 16]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3.0} />
            </mesh>
          </group>
        );
      })}

      <pointLight position={[0, -1.0, -10]} color="#00e5ff" intensity={5.5} distance={45} />
      <pointLight position={[0, -1.0, -35]} color="#00e5ff" intensity={5.5} distance={45} />
    </group>
  );
};

export default SwimmingPool;
