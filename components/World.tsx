
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

// Cinematic camera shots during race
const RACE_SHOTS = [
  { id: 'side_high',    dur: 4.5 },
  { id: 'in_water',     dur: 3.5 },
  { id: 'top_down',     dur: 3.0 },
  { id: 'lead_follow',  dur: 4.0 },
  { id: 'side_low',     dur: 3.0 },
  { id: 'front_head',   dur: 3.5 },
  { id: 'behind',       dur: 3.5 },
];

const World: React.FC<WorldProps> = ({ appState, swimmers, onFinish, onStateTransition }) => {
  const { camera } = useThree();
  const stateTimer = useRef(0);
  const raceStartRef = useRef(0);
  const finishedIds = useRef<Set<number>>(new Set());
  const [currentIntroIdx, setCurrentIntroIdx] = useState(-1);

  const count = swimmers.length;
  const laneWidth = count > 15 ? 2.2 : 3;

  const camPos = useRef(new THREE.Vector3(30, 20, 30));
  const camTarget = useRef(new THREE.Vector3(0, 0, 0));

  // Cinematic cut tracking
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
      setCurrentIntroIdx(-1);
    }
  }, [appState]);

  useFrame((state, delta) => {
    if (!camera) return;
    const t = state.clock.getElapsedTime();
    const poolSpan = Math.max(12, count * laneWidth);

    // ---- IDLE ----
    if (appState === AppState.IDLE) {
      const angle = t * 0.1;
      const r = Math.max(36, poolSpan * 0.7);
      camPos.current.lerp(new THREE.Vector3(Math.sin(angle) * r, Math.max(20, poolSpan * 0.35), Math.cos(angle) * r - 10), 0.04);
      camTarget.current.lerp(new THREE.Vector3(0, 1, -15), 0.06);
    }

    // ---- GREETING ----
    else if (appState === AppState.GREETING) {
      stateTimer.current += delta;
      const introDuration = count > 10 ? 1.0 : 2.5;
      const idx = Math.floor(stateTimer.current / introDuration);
      if (idx < count && (count <= 10 || idx < 6)) {
        if (idx !== currentIntroIdx) setCurrentIntroIdx(idx);
        const s = swimmers[idx];
        const targetX = s.lane * laneWidth;
        camTarget.current.lerp(new THREE.Vector3(targetX, 2.5, 2.2), 0.15);
        camPos.current.lerp(new THREE.Vector3(targetX + 3, 4.0, 7), 0.08);
      } else {
        onStateTransition(AppState.PREPARING);
        stateTimer.current = 0;
      }
    }

    // ---- PREPARING ----
    else if (appState === AppState.PREPARING) {
      stateTimer.current += delta;
      camTarget.current.lerp(new THREE.Vector3(0, 1, 0), 0.05);
      camPos.current.lerp(new THREE.Vector3(Math.max(15, poolSpan * 0.4), Math.max(12, poolSpan * 0.25), 18), 0.03);
      if (stateTimer.current > 2.0) onStateTransition(AppState.READY);
    }

    // ---- READY ----
    else if (appState === AppState.READY) {
      camTarget.current.lerp(new THREE.Vector3(0, 0.5, 1.5), 0.1);
      camPos.current.lerp(new THREE.Vector3(0, Math.max(6, poolSpan * 0.18), Math.max(14, poolSpan * 0.35)), 0.05);
    }

    // ---- RACING — cinematic multi-angle cuts ----
    else if (appState === AppState.RACING) {
      if (swimmers.length === 0) return;
      const elapsed = t - raceStartRef.current;

      // Compute swimmer center
      let centerX = 0, centerZ = 0, maxProgress = 0;
      swimmers.forEach(s => {
        const p = Math.min(elapsed * s.speed, 1);
        maxProgress = Math.max(maxProgress, p);
        centerZ += 2.2 - p * 54.6;
        centerX += s.lane * laneWidth;
      });
      centerX /= swimmers.length;
      centerZ /= swimmers.length;
      centerZ = Math.max(-52, Math.min(3, centerZ));

      // Advance shot timer
      shotTimer.current += delta;
      const curShot = RACE_SHOTS[shotIdx.current % RACE_SHOTS.length];
      if (shotTimer.current >= curShot.dur) {
        shotTimer.current = 0;
        shotIdx.current = (shotIdx.current + 1) % RACE_SHOTS.length;
      }
      const shot = RACE_SHOTS[shotIdx.current % RACE_SHOTS.length];
      const ls = 0.055;
      const width = Math.max(6, poolSpan * 0.5);

      switch (shot.id) {
        case 'side_high': {
          camPos.current.lerp(new THREE.Vector3(centerX + width + 14, Math.max(14, poolSpan * 0.25), centerZ + 4), ls);
          camTarget.current.lerp(new THREE.Vector3(centerX, 0, centerZ), ls * 1.4);
          break;
        }
        case 'in_water': {
          const lane0X = swimmers[0] ? swimmers[0].lane * laneWidth : 0;
          camPos.current.lerp(new THREE.Vector3(lane0X + 1.5, 0.8, centerZ + 8), ls);
          camTarget.current.lerp(new THREE.Vector3(centerX, 0.2, centerZ - 5), ls * 1.6);
          break;
        }
        case 'top_down': {
          camPos.current.lerp(new THREE.Vector3(centerX, Math.max(24, poolSpan * 0.6), centerZ), ls);
          camTarget.current.lerp(new THREE.Vector3(centerX, 0, centerZ - 2), ls * 1.2);
          break;
        }
        case 'lead_follow': {
          const leader = swimmers.reduce((best, s) => {
            const p = Math.min(elapsed * s.speed, 1);
            const bp = Math.min(elapsed * best.speed, 1);
            return p > bp ? s : best;
          }, swimmers[0]);
          const leaderP = Math.min(elapsed * leader.speed, 1);
          const leaderZ = Math.max(-50, 2.2 - leaderP * 54.6);
          const leaderX = leader.lane * laneWidth;
          camPos.current.lerp(new THREE.Vector3(leaderX + 3, 5, leaderZ + 12), ls * 0.9);
          camTarget.current.lerp(new THREE.Vector3(leaderX, 0.2, leaderZ - 4), ls * 1.5);
          break;
        }
        case 'side_low': {
          camPos.current.lerp(new THREE.Vector3(centerX - (width + 8), 3.5, centerZ), ls);
          camTarget.current.lerp(new THREE.Vector3(centerX, 0.2, centerZ), ls * 1.4);
          break;
        }
        case 'front_head': {
          camPos.current.lerp(new THREE.Vector3(centerX, Math.max(8, poolSpan * 0.18), centerZ - 18), ls);
          camTarget.current.lerp(new THREE.Vector3(centerX, 0.2, centerZ + 6), ls * 1.2);
          break;
        }
        case 'behind': {
          camPos.current.lerp(new THREE.Vector3(centerX, Math.max(10, poolSpan * 0.2), centerZ + 18), ls);
          camTarget.current.lerp(new THREE.Vector3(centerX, 0.2, centerZ - 4), ls * 1.2);
          break;
        }
      }
    }

    // ---- FINISHED ----
    else if (appState === AppState.FINISHED) {
      camPos.current.lerp(new THREE.Vector3(Math.max(16, poolSpan * 0.3), 14, -43), 0.04);
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

      {swimmers.map((s, idx) => (
        <Swimmer
          key={s.id}
          swimmer={s}
          appState={appState}
          laneWidth={laneWidth}
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

