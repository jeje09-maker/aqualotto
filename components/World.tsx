
// @ts-nocheck
import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AppState, Swimmer as SwimmerType } from '../types';
import Swimmer from './Swimmer';
import SwimmingPool from './SwimmingPool';
import SoundManager from './SoundManager';
import Crowd from './Crowd';

interface WorldProps {
  appState: AppState;
  swimmers: SwimmerType[];
  onFinish: (s: SwimmerType) => void;
  onStateTransition: (state: AppState) => void;
}

const World: React.FC<WorldProps> = ({ appState, swimmers, onFinish, onStateTransition }) => {
  const { camera } = useThree();
  const stateTimer = useRef(0);
  const raceStartRef = useRef(0);
  const finishedIds = useRef<Set<number>>(new Set());
  const [currentIntroIdx, setCurrentIntroIdx] = useState(-1);
  
  const camPos = useRef(new THREE.Vector3(30, 20, 30));
  const camTarget = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (appState === AppState.RACING) {
      raceStartRef.current = performance.now() / 1000;
    }
    if (appState === AppState.IDLE) {
      finishedIds.current.clear();
      stateTimer.current = 0;
      setCurrentIntroIdx(-1);
    }
  }, [appState]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    if (appState === AppState.IDLE) {
      camPos.current.lerp(new THREE.Vector3(35, 25, 35), 0.05);
      camTarget.current.lerp(new THREE.Vector3(0, 0, 0), 0.05);
    }
    else if (appState === AppState.GREETING) {
      stateTimer.current += delta;
      const introDuration = 2.5; 
      const idx = Math.floor(stateTimer.current / introDuration);
      
      if (idx < swimmers.length) {
        if (idx !== currentIntroIdx) setCurrentIntroIdx(idx);
        const s = swimmers[idx];
        const targetX = s.lane * 3;
        camTarget.current.lerp(new THREE.Vector3(targetX, 2.5, 2.2), 0.1);
        camPos.current.lerp(new THREE.Vector3(targetX, 3.5, 6), 0.05);
      } else {
        onStateTransition(AppState.PREPARING);
        stateTimer.current = 0;
      }
    } 
    else if (appState === AppState.PREPARING) {
      stateTimer.current += delta;
      camTarget.current.lerp(new THREE.Vector3(0, 1, 0), 0.05);
      camPos.current.lerp(new THREE.Vector3(15, 10, 15), 0.03);
      if (stateTimer.current > 2.0) onStateTransition(AppState.READY);
    }
    else if (appState === AppState.READY) {
      camTarget.current.lerp(new THREE.Vector3(0, 0.5, 1.5), 0.1);
      camPos.current.lerp(new THREE.Vector3(0, 5, 12), 0.05);
    }
    else if (appState === AppState.RACING) {
      const elapsed = t - raceStartRef.current;
      let centerX = 0, centerZ = 0;
      let maxProgress = 0;

      swimmers.forEach(s => {
        const p = Math.min(elapsed * s.speed, 1);
        maxProgress = Math.max(maxProgress, p);
        const z = 2.2 - (p * 54.6);
        centerX += s.lane * 3; centerZ += z;
      });
      
      centerX /= swimmers.length; centerZ /= swimmers.length;
      const zoom = 20 + (1 - maxProgress) * 10;
      camTarget.current.lerp(new THREE.Vector3(centerX, 0, centerZ), 0.1);
      camPos.current.lerp(new THREE.Vector3(centerX + zoom, 12, centerZ + zoom * 0.5), 0.07);
    } 
    else if (appState === AppState.FINISHED) {
      camPos.current.lerp(new THREE.Vector3(15, 12, -45), 0.04);
      camTarget.current.lerp(new THREE.Vector3(0, 0, -53), 0.04);
    }

    camera.position.copy(camPos.current);
    camera.lookAt(camTarget.current);
  });

  return (
    <group>
      <SoundManager appState={appState} />
      <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
      <SwimmingPool count={swimmers.length} />
      <Crowd swimmersCount={swimmers.length} />
      
      {swimmers.map((s, idx) => (
        <Swimmer 
          key={s.id} 
          swimmer={s} 
          appState={appState} 
          isCurrentIntro={idx === currentIntroIdx}
          onReachedEnd={() => {
            if (!finishedIds.current.has(s.id)) {
              finishedIds.current.add(s.id);
              onFinish(s);
            }
          }}
        />
      ))}
    </group>
  );
};

export default World;
