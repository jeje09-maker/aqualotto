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

    // ---- RACING (1등 선수를 항시 추적하며, 결승선 근처 도착 시 결승선 터치패드 정면샷으로 완벽 카메라 전환!) ----
    else if (appState === AppState.RACING) {
      if (swimmers.length === 0) return;
      const elapsed = t - raceStartRef.current;

      // Find Leader & Pack Center
      let centerX = 0;
      let leader = swimmers[0];
      let maxProgress = -1;

      swimmers.forEach(s => {
        const p = Math.min(elapsed * s.speed, 1);
        if (p > maxProgress) {
          maxProgress = p;
          leader = s;
        }
        centerX += getLaneX(s.lane, count, laneWidth);
      });
      centerX /= swimmers.length;

      const startZ = 3.6;
      const finishZ = -52.4;
      const leaderZ = startZ - maxProgress * Math.abs(startZ - finishZ);
      const leaderX = getLaneX(leader.lane, count, laneWidth);

      // 결승선 접근 시(maxProgress >= 0.70, 즉 Z <= -35m 지점부터):
      // 카메라는 결승선 터치패드 벽 앞(Z = -54.5m)에 딱 고정되어, 달려오는 선수들을 정면에서 직관적으로 와이드 촬영!
      if (maxProgress >= 0.70) {
        const finishCamX = centerX * 0.4;
        camPos.current.lerp(new THREE.Vector3(finishCamX, 4.5, -54.8), 0.08);
        camTarget.current.lerp(new THREE.Vector3(leaderX, 0.2, leaderZ), 0.1);
      } else {
        // 레이스 초/중반: 선두 선수의 측후방 대각선 트래킹 샷
        camPos.current.lerp(new THREE.Vector3(leaderX + poolSpan * 0.25 + 3.5, 5.5, leaderZ + 7.5), 0.08);
        camTarget.current.lerp(new THREE.Vector3(leaderX, 0.2, leaderZ - 2.5), 0.1);
      }
    }

    // ---- FINISHED (결승선 완주 후 터치패드 및 전광판 하이라이트 뷰) ----
    else if (appState === AppState.FINISHED) {
      camPos.current.lerp(new THREE.Vector3(0, 7.5, -42.0), 0.06);
      camTarget.current.lerp(new THREE.Vector3(0, -0.2, -52.4), 0.06);
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
