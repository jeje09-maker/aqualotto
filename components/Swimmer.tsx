
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

const Swimmer: React.FC<SwimmerProps> = ({ swimmer, appState, isCurrentIntro, onReachedEnd }) => {
  const group = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  
  const [progress, setProgress] = useState(0);
  const currentProgressRef = useRef(0);
  const startTime = useRef(0);
  
  const laneWidth = 3;
  const startZ = 2.2; 
  const finishZ = -52.4; 
  const poolLength = Math.abs(startZ - finishZ);
  const onBlockY = 2.42; 

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
      leftArm.current.rotation.set(0, 0, 0.2);
      rightArm.current.rotation.set(0, 0, -0.2);
      return;
    }

    if (appState === AppState.READY) {
      // 똑바로 서서 정면 주시 (구부리지 않는 당당한 자세)
      group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, onBlockY, 0.2);
      body.current.rotation.x = THREE.MathUtils.lerp(body.current.rotation.x, -0.05, 0.2);
      leftArm.current.rotation.x = THREE.MathUtils.lerp(leftArm.current.rotation.x, 0.2, 0.2);
      rightArm.current.rotation.x = THREE.MathUtils.lerp(rightArm.current.rotation.x, 0.2, 0.2);
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
        
        // --- 멀리 뛰는 초고속 다이빙 물리 (0~4% 구간) ---
        const diveThreshold = 0.04;
        if (nextProgress < diveThreshold) {
          const diveT = nextProgress / diveThreshold;
          
          // Z축 추진력 강화 (멀리 뛰기)
          const diveLeap = Math.sin(diveT * Math.PI) * 1.8;
          group.current.position.z = startZ - (nextProgress * poolLength) - diveLeap;
          
          // Y축: 살짝 떠올랐다가 바닥으로 빠르게 꽂힘
          const jumpHeight = Math.sin(diveT * Math.PI) * 0.9; 
          group.current.position.y = onBlockY + jumpHeight - (diveT * 4.2);
          
          // 회전: 서 있는 자세(0)에서 즉시 입수 각도(-PI/1.8)로 전환
          group.current.rotation.x = THREE.MathUtils.lerp(0, -Math.PI / 1.7, diveT);
          body.current.rotation.x = THREE.MathUtils.lerp(0, 0, diveT);
        } else {
          group.current.position.z = startZ - (nextProgress * poolLength);
          group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, -0.15, 0.3);
          group.current.rotation.set(-Math.PI / 2, 0, 0); 
          body.current.rotation.x = 0;
        }

        // 인간적인 수영 리듬 애니메이션
        const cycle = t * (4 + p_var * 5 + p_spurt * 20);
        leftArm.current.rotation.x = -cycle;
        rightArm.current.rotation.x = -cycle + Math.PI;
        leftLeg.current.rotation.x = Math.sin(t * 18) * 0.4;
        rightLeg.current.rotation.x = Math.sin(t * 18 + Math.PI) * 0.4;

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

  return (
    <group ref={group} position={[swimmer.lane * laneWidth, onBlockY, startZ]}>
      <group ref={body}>
        <mesh castShadow>
          <capsuleGeometry args={[0.22, 0.48, 8, 16]} />
          <meshStandardMaterial color={swimmer.color} roughness={0.3} metalness={0.2} />
        </mesh>
        <group position={[0, 0.55, 0]}>
          <mesh castShadow><sphereGeometry args={[0.2, 16, 16]} /><meshStandardMaterial color="#ffdbac" /></mesh>
          <mesh position={[0, 0.05, 0]} rotation={[-0.1, 0, 0]}>
             <sphereGeometry args={[0.205, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
             <meshStandardMaterial color={swimmer.capColor} roughness={0.4} />
          </mesh>
        </group>
        <group ref={leftArm} position={[-0.28, 0.25, 0]}>
          <mesh position={[0, 0.35, 0]} castShadow>
            <capsuleGeometry args={[0.08, 0.65, 4, 8]} /><meshStandardMaterial color="#ffdbac" />
          </mesh>
        </group>
        <group ref={rightArm} position={[0.28, 0.25, 0]}>
          <mesh position={[0, 0.35, 0]} castShadow>
            <capsuleGeometry args={[0.08, 0.65, 4, 8]} /><meshStandardMaterial color="#ffdbac" />
          </mesh>
        </group>
        <group ref={leftLeg} position={[-0.12, -0.22, 0]}>
          <mesh position={[0, -0.5, 0]} castShadow><capsuleGeometry args={[0.1, 0.9, 4, 8]} /><meshStandardMaterial color="#ffdbac" /></mesh>
        </group>
        <group ref={rightLeg} position={[0.12, -0.22, 0]}>
          <mesh position={[0, -0.5, 0]} castShadow><capsuleGeometry args={[0.1, 0.9, 4, 8]} /><meshStandardMaterial color="#ffdbac" /></mesh>
        </group>
      </group>
      {appState === AppState.RACING && progress > 0.03 && progress < 0.98 && (
        <Splash position={[0, 0.1, 0]} scale={2.2} rate={3.5} />
      )}
    </group>
  );
};

export default Swimmer;
