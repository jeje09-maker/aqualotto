// @ts-nocheck
import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AppState, Swimmer as SwimmerType } from '../types';
import Swimmer from './Swimmer';
import SwimmingPool, { getLaneX } from './SwimmingPool';
import SoundManager from './SoundManager';
import Crowd from './Crowd';

interface WorldProps {
  appState: AppState;
  swimmers: SwimmerType[];
  onFinish: (s: SwimmerType) => void;
  onStateTransition: (state: AppState) => void;
}

// Guaranteed 100% visible broadcast camera shots
const RACE_SHOTS = [
  { id: 'lead_chase',       dur: 4.5 },
  { id: 'side_tracking',    dur: 4.0 },
  { id: 'top_down_stadium', dur: 3.5 },
  { id: 'front_telephoto',  dur: 4.5 },
];

const World: React.FC<WorldProps> = ({ appState, swimmers, onFinish, onStateTransition }) => {
  const { camera } = useThree();
  const stateTimer = useRef(0);
  const raceStartRef = useRef(0);
  const finishedIds = useRef<Set<number>>(new Set());

  const count = swimmers.length;
  const laneWidth = count > 15 ? 2.2 : 3.0;

  const camPos = useRef(new THREE.Vector3(0, 20, 30));
  const camTarget = useRef(new THREE.Vector3(0, 0, 0));

  const shotTimer = useRef(0);
  const shotIdx = useRef(0);

  useEffect(() => {
    if (appState === AppState.RACING) {
      raceStartRef.current = performance.now() / 1000;
      shotTimer.current = 0;
      shotIdx.current = 0;
    }
    if (appState === AppState.IDLE) {
      finishedIds.current.clear();
      stateTimer.current = 0;
    }
    // Instantly skip any legacy GREETING or PREPARING states -> go straight to READY!
    if (appState === AppState.GREETING || appState === AppState.PREPARING) {
      onStateTransition(AppState.READY);
    }
  }, [appState, onStateTransition]);

  useFrame((state, delta) => {
    if (!camera) return;
    const t = state.clock.getElapsedTime();
    const poolSpan = count * laneWidth;

    // ---- IDLE ----
    if (appState === AppState.IDLE) {
      const angle = t * 0.1;
      const r = Math.max(36, poolSpan * 0.7);
      camPos.current.lerp(new THREE.Vector3(Math.sin(angle) * r, Math.max(20, poolSpan * 0.35), Math.cos(angle) * r - 10), 0.04);
      camTarget.current.lerp(new THREE.Vector3(0, 1, -15), 0.06);
    }

    // ---- READY (즉시 출발대 차렷 대기!) ----
    else if (appState === AppState.READY || appState === AppState.GREETING || appState === AppState.PREPARING) {
      camTarget.current.lerp(new THREE.Vector3(0, 0.5, 1.5), 0.1);
      camPos.current.lerp(new THREE.Vector3(0, Math.max(6, poolSpan * 0.18), Math.max(14, poolSpan * 0.35)), 0.05);
    }

    // ---- RACING ----
    else if (appState === AppState.RACING) {
      if (swimmers.length === 0) return;
      const elapsed = t - raceStartRef.current;

      // Find Leader & Pack Center
      let centerX = 0, centerZ = 0;
      let leader = swimmers[0];
      let maxProgress = -1;

      swimmers.forEach(s => {
        const p = Math.min(elapsed * s.speed, 1);
        if (p > maxProgress) {
          maxProgress = p;
          leader = s;
        }
        centerZ += 2.2 - p * 54.6;
        centerX += getLaneX(s.lane, count, laneWidth);
      });
      centerX /= swimmers.length;
      centerZ /= swimmers.length;

      const leaderP = Math.min(elapsed * leader.speed, 1);
      const leaderZ = Math.max(-50, 2.2 - leaderP * 54.6);
      const leaderX = getLaneX(leader.lane, count, laneWidth);

      shotTimer.current += delta;
      const curShot = RACE_SHOTS[shotIdx.current % RACE_SHOTS.length];
      if (shotTimer.current >= curShot.dur) {
        shotTimer.current = 0;
        shotIdx.current = (shotIdx.current + 1) % RACE_SHOTS.length;
      }
      const shot = RACE_SHOTS[shotIdx.current % RACE_SHOTS.length];
      const lerpSpeed = 0.08;

      switch (shot.id) {
        case 'lead_chase': {
          camPos.current.lerp(new THREE.Vector3(leaderX + poolSpan * 0.3 + 4, 6.5, leaderZ + 10), lerpSpeed);
          camTarget.current.lerp(new THREE.Vector3(leaderX, 0.2, leaderZ - 2), lerpSpeed);
          break;
        }
        case 'side_tracking': {
          const sideOffset = poolSpan * 0.5 + 8;
          camPos.current.lerp(new THREE.Vector3(sideOffset, 6.0, centerZ + 2), lerpSpeed);
          camTarget.current.lerp(new THREE.Vector3(centerX, 0.2, centerZ - 1), lerpSpeed);
          break;
        }
        case 'top_down_stadium': {
          camPos.current.lerp(new THREE.Vector3(0, Math.max(20, poolSpan * 0.55), centerZ + 8), lerpSpeed);
          camTarget.current.lerp(new THREE.Vector3(0, 0, centerZ - 4), lerpSpeed);
          break;
        }
        case 'front_telephoto': {
          camPos.current.lerp(new THREE.Vector3(0, 5.5, -55), lerpSpeed);
          camTarget.current.lerp(new THREE.Vector3(centerX, 0.2, centerZ), lerpSpeed);
          break;
        }
      }
    }

    // ---- FINISHED ----
    else if (appState === AppState.FINISHED) {
      camPos.current.lerp(new THREE.Vector3(0, 10, -42), 0.04);
      camTarget.current.lerp(new THREE.Vector3(0, 0, -53), 0.04);
    }

    camera.position.copy(camPos.current);
    camera.lookAt(camTarget.current);
  });

  return (
    <group>
      <SoundManager appState={appState} />
      <directionalLight position={[10, 25, 10]} intensity={1.5} castShadow />
      <pointLight position={[0, 8, -26]} intensity={0.8} color="#aadeff" />
      <SwimmingPool count={swimmers.length} />
      <Crowd swimmersCount={swimmers.length} />

      {swimmers.map((s) => (
        <Swimmer
          key={s.id}
          swimmer={s}
          totalSwimmers={count}
          appState={appState}
          laneWidth={laneWidth}
          isCurrentIntro={false}
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
