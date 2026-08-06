
// @ts-nocheck
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AppState, Swimmer as SwimmerType } from '../types';
import Splash from './Splash';

interface SwimmerProps {
  swimmer: SwimmerType;
  appState: AppState;
  isCurrentIntro: boolean;
  onReachedEnd: () => void;
}

// 관절이 있는 팔 컴포넌트: 상완 + 하완 (elbow bend)
const ArmSegment: React.FC<{ color: string; side: 'left' | 'right' }> = ({ color, side }) => {
  return (
    <group>
      {/* 상완 (upper arm) */}
      <mesh position={[0, -0.22, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.38, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      {/* 팔꿈치 관절 */}
      <group position={[0, -0.44, 0]}>
        {/* 하완 (forearm) */}
        <mesh position={[0, -0.18, 0]} castShadow>
          <capsuleGeometry args={[0.055, 0.32, 4, 8]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
        {/* 손 */}
        <mesh position={[0, -0.35, 0]} castShadow>
          <boxGeometry args={[0.1, 0.08, 0.15]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
};

// 관절이 있는 다리 컴포넌트: 허벅지 + 종아리 (knee bend)
const LegSegment: React.FC<{ color: string }> = ({ color }) => {
  return (
    <group>
      {/* 허벅지 (thigh) */}
      <mesh position={[0, -0.26, 0]} castShadow>
        <capsuleGeometry args={[0.09, 0.45, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      {/* 무릎 관절 */}
      <group position={[0, -0.52, 0]}>
        {/* 종아리 (calf) */}
        <mesh position={[0, -0.22, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.38, 4, 8]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
        {/* 발 */}
        <mesh position={[0, -0.42, 0.05]} castShadow>
          <boxGeometry args={[0.1, 0.07, 0.22]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
};

const Swimmer: React.FC<SwimmerProps> = ({ swimmer, appState, isCurrentIntro, onReachedEnd }) => {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);

  // 팔 관절 refs (상완 회전)
  const leftUpperArm = useRef<THREE.Group>(null);
  const rightUpperArm = useRef<THREE.Group>(null);
  // 팔 하완 refs (팔꿈치 굽힘)
  const leftForearmGroup = useRef<THREE.Group>(null);
  const rightForearmGroup = useRef<THREE.Group>(null);
  // 다리 관절 refs (허벅지 회전)
  const leftUpperLeg = useRef<THREE.Group>(null);
  const rightUpperLeg = useRef<THREE.Group>(null);
  // 다리 하완 refs (무릎 굽힘)
  const leftCalfGroup = useRef<THREE.Group>(null);
  const rightCalfGroup = useRef<THREE.Group>(null);

  const [progress, setProgress] = useState(0);
  const currentProgressRef = useRef(0);
  const startTime = useRef(0);

  const laneWidth = 3;
  const startZ = 2.2;
  const finishZ = -52.4;
  const poolLength = Math.abs(startZ - finishZ);
  const onBlockY = 2.42;

  // 선수별 애니메이션 속도 랜덤 변화량
  const animSpeedMult = useRef(0.85 + Math.random() * 0.3);

  useEffect(() => {
    if (appState === AppState.RACING) {
      startTime.current = performance.now() / 1000;
      currentProgressRef.current = 0;
      setProgress(0);
    }
  }, [appState]);

  useFrame((state, delta) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();

    if (appState === AppState.IDLE) {
      group.current.position.set(swimmer.lane * laneWidth, onBlockY, startZ);
      group.current.rotation.set(0, 0, 0);
      body.current.rotation.x = 0;
      if (leftUpperArm.current) leftUpperArm.current.rotation.set(0, 0, 0.25);
      if (rightUpperArm.current) rightUpperArm.current.rotation.set(0, 0, -0.25);
      if (leftForearmGroup.current) leftForearmGroup.current.rotation.set(0, 0, 0);
      if (rightForearmGroup.current) rightForearmGroup.current.rotation.set(0, 0, 0);
      if (leftUpperLeg.current) leftUpperLeg.current.rotation.set(0, 0, 0);
      if (rightUpperLeg.current) rightUpperLeg.current.rotation.set(0, 0, 0);
      return;
    }

    if (appState === AppState.READY) {
      group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, onBlockY, 0.2);
      body.current.rotation.x = THREE.MathUtils.lerp(body.current.rotation.x, -0.05, 0.2);
      if (leftUpperArm.current) leftUpperArm.current.rotation.x = THREE.MathUtils.lerp(leftUpperArm.current.rotation.x, 0.3, 0.2);
      if (rightUpperArm.current) rightUpperArm.current.rotation.x = THREE.MathUtils.lerp(rightUpperArm.current.rotation.x, 0.3, 0.2);
    }

    if (appState === AppState.RACING) {
      if (currentProgressRef.current < 1) {
        const elapsed = t - startTime.current;
        const p_base = elapsed * swimmer.speed;
        const p_var = Math.sin(elapsed * swimmer.frequency + swimmer.phase) * swimmer.surge;
        let p_spurt = 0;
        if (p_base > swimmer.spurtThreshold) {
          p_spurt = Math.pow((p_base - swimmer.spurtThreshold) * 10, 2.2) * swimmer.spurtStrength;
        }

        const nextProgress = Math.max(currentProgressRef.current + (delta * 0.02), Math.min(p_base + p_var + p_spurt, 1));
        currentProgressRef.current = nextProgress;
        setProgress(nextProgress);

        // 다이빙 구간 (0~4%)
        const diveThreshold = 0.04;
        if (nextProgress < diveThreshold) {
          const diveT = nextProgress / diveThreshold;
          const diveLeap = Math.sin(diveT * Math.PI) * 1.8;
          group.current.position.z = startZ - (nextProgress * poolLength) - diveLeap;
          const jumpHeight = Math.sin(diveT * Math.PI) * 0.9;
          group.current.position.y = onBlockY + jumpHeight - (diveT * 4.2);
          group.current.rotation.x = THREE.MathUtils.lerp(0, -Math.PI / 1.7, diveT);
          body.current.rotation.x = 0;
          // 다이빙 시 팔을 앞으로 쭉 뻗음
          if (leftUpperArm.current) leftUpperArm.current.rotation.set(-Math.PI * 0.9 * diveT, 0, -0.1);
          if (rightUpperArm.current) rightUpperArm.current.rotation.set(-Math.PI * 0.9 * diveT, 0, 0.1);
          if (leftForearmGroup.current) leftForearmGroup.current.rotation.set(0, 0, 0);
          if (rightForearmGroup.current) rightForearmGroup.current.rotation.set(0, 0, 0);
        } else {
          // 수영 구간: 몸통 수평
          group.current.position.z = startZ - (nextProgress * poolLength);
          group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, -0.15, 0.3);
          group.current.rotation.set(-Math.PI / 2, 0, 0);
          body.current.rotation.x = 0;

          // 수영 사이클 - 선수별 속도 다름
          const swimSpeed = (4.5 + p_var * 4 + p_spurt * 15) * animSpeedMult.current;
          const cycle = t * swimSpeed;

          // === 팔 애니메이션: 자유형 크롤 (프리스타일) ===
          // 왼팔: 0 ~ 2π 사이클
          // 물 위로 나오는 구간(recovery): 팔이 외부로 회전, 팔꿈치 구부러짐
          // 물 속으로 당기는 구간(pull): 팔이 쭉 뻗고 아래로 내려옴
          const leftCycle = cycle % (Math.PI * 2);
          const rightCycle = (cycle + Math.PI) % (Math.PI * 2); // 반대 위상

          const getArmRotation = (c: number) => {
            // c: 0~2π
            // 0~π: 물 위로 나오는 회전 (recovery phase)
            // π~2π: 물 속으로 당기는 회전 (pull phase)
            return -c; // 기본 순환
          };

          const getElbowBend = (c: number) => {
            // recovery 구간(물 위)에서 팔꿈치를 많이 굽힘
            // pull 구간(물 속)에서 팔꿈치 펴짐
            const normalized = c / (Math.PI * 2); // 0~1
            if (normalized < 0.5) {
              // recovery: 팔꿈치 굽힘 (0 → max → 0)
              return Math.sin(normalized * Math.PI * 2) * 1.2;
            } else {
              // pull: 팔꿈치 약간만 굽힘 (물 속에서 당기기)
              return Math.sin((normalized - 0.5) * Math.PI) * 0.4;
            }
          };

          if (leftUpperArm.current) {
            leftUpperArm.current.rotation.x = getArmRotation(leftCycle);
            leftUpperArm.current.rotation.z = Math.sin(leftCycle * 0.5) * 0.15; // 측면 흔들림
          }
          if (rightUpperArm.current) {
            rightUpperArm.current.rotation.x = getArmRotation(rightCycle);
            rightUpperArm.current.rotation.z = -Math.sin(rightCycle * 0.5) * 0.15;
          }
          if (leftForearmGroup.current) {
            leftForearmGroup.current.rotation.x = getElbowBend(leftCycle);
          }
          if (rightForearmGroup.current) {
            rightForearmGroup.current.rotation.x = getElbowBend(rightCycle);
          }

          // === 다리 애니메이션: 플러터 킥 ===
          // 다리가 교대로 올라갔다 내려오며 킥
          const kickSpeed = swimSpeed * 1.6; // 팔보다 빠르게
          const kickAmp = 0.45;

          if (leftUpperLeg.current) {
            const lKick = Math.sin(t * kickSpeed) * kickAmp;
            leftUpperLeg.current.rotation.x = lKick;
            // 무릎 굽힘: 다리가 위로 올라올 때 무릎이 굽힘
            if (leftCalfGroup.current) {
              const lKnee = Math.max(0, Math.sin(t * kickSpeed - 0.4)) * 0.6;
              leftCalfGroup.current.rotation.x = lKnee;
            }
          }
          if (rightUpperLeg.current) {
            const rKick = Math.sin(t * kickSpeed + Math.PI) * kickAmp;
            rightUpperLeg.current.rotation.x = rKick;
            if (rightCalfGroup.current) {
              const rKnee = Math.max(0, Math.sin(t * kickSpeed + Math.PI - 0.4)) * 0.6;
              rightCalfGroup.current.rotation.x = rKnee;
            }
          }

          // 몸통 롤링 (실제 자유형처럼 좌우로 살짝 기울기)
          body.current.rotation.z = Math.sin(cycle * 0.5) * 0.2;
        }

        if (nextProgress >= 1) onReachedEnd();
      } else {
        group.current.position.y = -0.12;
      }
    }

    if (appState === AppState.FINISHED) {
      group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, 0.4, 0.05);
      group.current.rotation.set(-0.2, Math.PI, 0);
    }
  });

  const skinColor = '#ffdbac';

  return (
    <group ref={group} position={[swimmer.lane * laneWidth, onBlockY, startZ]}>
      <group ref={body}>
        {/* 몸통 */}
        <mesh castShadow>
          <capsuleGeometry args={[0.22, 0.5, 8, 16]} />
          <meshStandardMaterial color={swimmer.color} roughness={0.3} metalness={0.2} />
        </mesh>

        {/* 머리 */}
        <group position={[0, 0.56, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial color={skinColor} />
          </mesh>
          {/* 수영모 */}
          <mesh position={[0, 0.05, 0]} rotation={[-0.1, 0, 0]}>
            <sphereGeometry args={[0.205, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
            <meshStandardMaterial color={swimmer.capColor} roughness={0.4} />
          </mesh>
          {/* 수경 */}
          <mesh position={[0, -0.04, 0.18]}>
            <torusGeometry args={[0.07, 0.025, 8, 20]} />
            <meshStandardMaterial color="#222" metalness={0.5} roughness={0.2} />
          </mesh>
        </group>

        {/* 왼팔 - 상완 그룹 (어깨에서 회전) */}
        <group ref={leftUpperArm} position={[-0.28, 0.28, 0]}>
          {/* 상완 */}
          <mesh position={[0, -0.2, 0]} castShadow>
            <capsuleGeometry args={[0.075, 0.35, 4, 8]} />
            <meshStandardMaterial color={skinColor} roughness={0.4} />
          </mesh>
          {/* 팔꿈치 관절 위치에 하완 그룹 */}
          <group ref={leftForearmGroup} position={[0, -0.42, 0]}>
            {/* 하완 */}
            <mesh position={[0, -0.17, 0]} castShadow>
              <capsuleGeometry args={[0.06, 0.3, 4, 8]} />
              <meshStandardMaterial color={skinColor} roughness={0.4} />
            </mesh>
            {/* 손 */}
            <mesh position={[0, -0.34, 0.04]} castShadow>
              <boxGeometry args={[0.11, 0.07, 0.16]} />
              <meshStandardMaterial color={skinColor} roughness={0.5} />
            </mesh>
          </group>
        </group>

        {/* 오른팔 */}
        <group ref={rightUpperArm} position={[0.28, 0.28, 0]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <capsuleGeometry args={[0.075, 0.35, 4, 8]} />
            <meshStandardMaterial color={skinColor} roughness={0.4} />
          </mesh>
          <group ref={rightForearmGroup} position={[0, -0.42, 0]}>
            <mesh position={[0, -0.17, 0]} castShadow>
              <capsuleGeometry args={[0.06, 0.3, 4, 8]} />
              <meshStandardMaterial color={skinColor} roughness={0.4} />
            </mesh>
            <mesh position={[0, -0.34, 0.04]} castShadow>
              <boxGeometry args={[0.11, 0.07, 0.16]} />
              <meshStandardMaterial color={skinColor} roughness={0.5} />
            </mesh>
          </group>
        </group>

        {/* 왼다리 - 허벅지 그룹 (엉덩이에서 회전) */}
        <group ref={leftUpperLeg} position={[-0.12, -0.24, 0]}>
          {/* 허벅지 */}
          <mesh position={[0, -0.24, 0]} castShadow>
            <capsuleGeometry args={[0.095, 0.42, 4, 8]} />
            <meshStandardMaterial color={swimmer.color} roughness={0.4} />
          </mesh>
          {/* 무릎 관절 위치에 종아리 그룹 */}
          <group ref={leftCalfGroup} position={[0, -0.5, 0]}>
            {/* 종아리 */}
            <mesh position={[0, -0.2, 0]} castShadow>
              <capsuleGeometry args={[0.075, 0.36, 4, 8]} />
              <meshStandardMaterial color={skinColor} roughness={0.4} />
            </mesh>
            {/* 발 */}
            <mesh position={[0, -0.39, 0.08]} castShadow rotation={[0.3, 0, 0]}>
              <boxGeometry args={[0.1, 0.07, 0.22]} />
              <meshStandardMaterial color={skinColor} roughness={0.5} />
            </mesh>
          </group>
        </group>

        {/* 오른다리 */}
        <group ref={rightUpperLeg} position={[0.12, -0.24, 0]}>
          <mesh position={[0, -0.24, 0]} castShadow>
            <capsuleGeometry args={[0.095, 0.42, 4, 8]} />
            <meshStandardMaterial color={swimmer.color} roughness={0.4} />
          </mesh>
          <group ref={rightCalfGroup} position={[0, -0.5, 0]}>
            <mesh position={[0, -0.2, 0]} castShadow>
              <capsuleGeometry args={[0.075, 0.36, 4, 8]} />
              <meshStandardMaterial color={skinColor} roughness={0.4} />
            </mesh>
            <mesh position={[0, -0.39, 0.08]} castShadow rotation={[0.3, 0, 0]}>
              <boxGeometry args={[0.1, 0.07, 0.22]} />
              <meshStandardMaterial color={skinColor} roughness={0.5} />
            </mesh>
          </group>
        </group>

      </group>

      {appState === AppState.RACING && progress > 0.03 && progress < 0.98 && (
        <Splash position={[0, 0.1, 0]} scale={2.2} rate={3.5} />
      )}
    </group>
  );
};

export default Swimmer;
