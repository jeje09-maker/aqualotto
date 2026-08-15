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

const World: React.FC<WorldProps> = ({ appState, swimmers, onFinish, onStateTransition }) => {
  const { camera } = useThree();
  const raceStartRef = useRef(0);
  const finishedIds = useRef<Set<number>>(new Set());

  const count = swimmers.length;
  const laneWidth = count > 15 ? 2.2 : 3.0;

  const camPos = useRef(new THREE.Vector3(0, 20, 30));
  const camTarget = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (appState === AppState.RACING) {
      raceStartRef.current = performance.now() / 1000;
    }
    if (appState === AppState.IDLE) {
      finishedIds.current.clear();
    }
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

    // ---- READY (출발대 차렷 대기!) ----
    else if (appState === AppState.READY || appState === AppState.GREETING || appState === AppState.PREPARING) {
      camTarget.current.lerp(new THREE.Vector3(0, 0.5, 1.5), 0.1);
      camPos.current.lerp(new THREE.Vector3(0, Math.max(6, poolSpan * 0.18), Math.max(14, poolSpan * 0.35)), 0.05);
    }

    // ---- RACING (선두 선수를 추적하며, 결승선 다가올 시 터치패드 터치 순간 클로즈업 촬영!) ----
    else if (appState === AppState.RACING) {
      if (swimmers.length === 0) return;
      const elapsed = t - raceStartRef.current;

      // Find Leader & Pack Center
      let centerX = 0;
      let leader = swimmers[0];
      let maxProgress = -1;

      swimmers.forEach(s => {
        const p_base = elapsed * s.speed;
        let p_spurt = 0;
        if (p_base > s.spurtThreshold) {
          p_spurt = Math.pow((p_base - s.spurtThreshold) * 10, 2.2) * s.spurtStrength;
        }
        let diveBonus = 0;
        if (elapsed < 2.2) {
          diveBonus = (11.5 / 53.4) * Math.sin((elapsed / 2.2) * Math.PI * 0.5);
        }
        const p = Math.min(1, p_base + p_spurt + diveBonus);

        if (p > maxProgress) {
          maxProgress = p;
          leader = s;
        }
        centerX += getLaneX(s.lane, count, laneWidth);
      });
      centerX /= swimmers.length;

      const startZ = 3.6;
      const finishZ = -49.8;
      const leaderZ = startZ - maxProgress * Math.abs(startZ - finishZ);
      const leaderX = getLaneX(leader.lane, count, laneWidth);
      const touchpadZ = -52.04;

      if (maxProgress >= 0.65) {
        // 결승선 접근 시: 카메라는 선두 선수의 노란색 터치패드(Z = -52.04)를 정면/측면에서 정확히 클로즈업 조준!
        camPos.current.lerp(new THREE.Vector3(leaderX + 2.8, 2.2, leaderZ + 3.8), 0.10);
        camTarget.current.lerp(new THREE.Vector3(leaderX, -0.1, touchpadZ), 0.12);
      } else {
        // 레이스 초/중반: 선두 선수의 측후방 대각선 트래킹 샷
        camPos.current.lerp(new THREE.Vector3(leaderX + poolSpan * 0.25 + 3.5, 5.5, leaderZ + 7.5), 0.08);
        camTarget.current.lerp(new THREE.Vector3(leaderX, 0.2, leaderZ - 2.5), 0.10);
      }
    }

    // ---- FINISHED (결승선 터치 순간 및 완주 하이라이트 뷰) ----
    else if (appState === AppState.FINISHED) {
      const leader = swimmers[0];
      const leaderX = leader ? getLaneX(leader.lane, count, laneWidth) : 0;
      const touchpadZ = -52.04;
      camPos.current.lerp(new THREE.Vector3(leaderX + 2.4, 2.0, -45.5), 0.08);
      camTarget.current.lerp(new THREE.Vector3(leaderX, -0.1, touchpadZ), 0.10);
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
