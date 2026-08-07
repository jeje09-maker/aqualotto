
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
  // id, duration (s), getPos(cx,cz,t), getTarget(cx,cz,t)
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
    const t = state.clock.getElapsedTime();

    // ---- IDLE ----
    if (appState === AppState.IDLE) {
      // Slow orbit around pool
      const angle = t * 0.12;
      const r = 38;
      camPos.current.lerp(new THREE.Vector3(Math.sin(angle) * r, 18, Math.cos(angle) * r - 20), 0.04);
      camTarget.current.lerp(new THREE.Vector3(0, 0, -18), 0.06);
    }

    // ---- GREETING ----
    else if (appState === AppState.GREETING) {
      stateTimer.current += delta;
      const introDuration = 2.5;
      const idx = Math.floor(stateTimer.current / introDuration);
      if (idx < swimmers.length) {
        if (idx !== currentIntroIdx) setCurrentIntroIdx(idx);
        const s = swimmers[idx];
        const targetX = s.lane * 3;
        camTarget.current.lerp(new THREE.Vector3(targetX, 2.5, 2.2), 0.12);
        camPos.current.lerp(new THREE.Vector3(targetX + 3, 4.0, 7), 0.06);
      } else {
        onStateTransition(AppState.PREPARING);
        stateTimer.current = 0;
      }
    }

    // ---- PREPARING ----
    else if (appState === AppState.PREPARING) {
      stateTimer.current += delta;
      camTarget.current.lerp(new THREE.Vector3(0, 1, 0), 0.05);
      camPos.current.lerp(new THREE.Vector3(15, 10, 15), 0.03);
      if (stateTimer.current > 2.0) onStateTransition(AppState.READY);
    }

    // ---- READY ----
    else if (appState === AppState.READY) {
      camTarget.current.lerp(new THREE.Vector3(0, 0.5, 1.5), 0.1);
      camPos.current.lerp(new THREE.Vector3(0, 5, 12), 0.05);
    }

    // ---- RACING — cinematic multi-angle cuts ----
    else if (appState === AppState.RACING) {
      const elapsed = t - raceStartRef.current;

      // Compute swimmer center
      let centerX = 0, centerZ = 0, maxProgress = 0;
      swimmers.forEach(s => {
        const p = Math.min(elapsed * s.speed, 1);
        maxProgress = Math.max(maxProgress, p);
        centerZ += 2.2 - p * 54.6;
        centerX += s.lane * 3;
      });
      centerX /= swimmers.length;
      centerZ /= swimmers.length;

      // Advance shot timer
      shotTimer.current += delta;
      const curShot = RACE_SHOTS[shotIdx.current % RACE_SHOTS.length];
      if (shotTimer.current >= curShot.dur) {
        shotTimer.current = 0;
        shotIdx.current = (shotIdx.current + 1) % RACE_SHOTS.length;
      }
      const shot = RACE_SHOTS[shotIdx.current % RACE_SHOTS.length];
      const lerpSpeed = 0.055;

      switch (shot.id) {
        case 'side_high': {
          // Classic elevated side view following swimmers
          const width = swimmers.length * 3;
          camPos.current.lerp(new THREE.Vector3(centerX + width + 14, 14, centerZ + 4), lerpSpeed);
          camTarget.current.lerp(new THREE.Vector3(centerX, 0, centerZ), lerpSpeed * 1.4);
          break;
        }
        case 'in_water': {
          // Camera between lanes — low, dramatic
          const lane0X = swimmers[0] ? swimmers[0].lane * 3 : 0;
          camPos.current.lerp(new THREE.Vector3(lane0X + 1.5, -0.3, centerZ + 6), lerpSpeed);
          camTarget.current.lerp(new THREE.Vector3(centerX, -0.2, centerZ - 6), lerpSpeed * 1.6);
          break;
        }
        case 'top_down': {
          // Overhead bird's-eye view straight down
          camPos.current.lerp(new THREE.Vector3(centerX, 20, centerZ), lerpSpeed);
          camTarget.current.lerp(new THREE.Vector3(centerX, 0, centerZ - 3), lerpSpeed * 1.2);
          break;
        }
        case 'lead_follow': {
          // Chasing the leader from behind
          const leader = swimmers.reduce((best, s) => {
            const p = Math.min(elapsed * s.speed, 1);
            const bp = Math.min(elapsed * best.speed, 1);
            return p > bp ? s : best;
          }, swimmers[0] || { speed: 0.04, lane: 0 });
          const leaderP = Math.min(elapsed * leader.speed, 1);
          const leaderZ = 2.2 - leaderP * 54.6;
          const leaderX = leader.lane * 3;
          camPos.current.lerp(new THREE.Vector3(leaderX + 2, 3, leaderZ + 9), lerpSpeed * 0.9);
          camTarget.current.lerp(new THREE.Vector3(leaderX, 0.2, leaderZ - 5), lerpSpeed * 1.5);
          break;
        }
        case 'side_low': {
          // Low side angle, very close to water surface
          camPos.current.lerp(new THREE.Vector3(centerX - (swimmers.length * 1.5 + 8), 1.5, centerZ), lerpSpeed);
          camTarget.current.lerp(new THREE.Vector3(centerX, 0, centerZ), lerpSpeed * 1.4);
          break;
        }
        case 'front_head': {
          // Head-on view — camera at finish end looking at swimmers coming toward it
          camPos.current.lerp(new THREE.Vector3(centerX, 6, centerZ - 18), lerpSpeed);
          camTarget.current.lerp(new THREE.Vector3(centerX, 0, centerZ + 5), lerpSpeed * 1.2);
          break;
        }
        case 'behind': {
          // From the start block, watching swimmers race away
          camPos.current.lerp(new THREE.Vector3(centerX, 8, centerZ + 18), lerpSpeed);
          camTarget.current.lerp(new THREE.Vector3(centerX, 0, centerZ - 4), lerpSpeed * 1.2);
          break;
        }
      }
    }

    // ---- FINISHED ----
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
      <pointLight position={[0, 8, -26]} intensity={0.8} color="#aadeff" />
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
