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
      raceStartRef.current = 0;
    }
    if (appState === AppState.IDLE) {
      finishedIds.current.clear();
      raceStartRef.current = 0;
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
      raceStartRef.current = 0;
      const angle = t * 0.1;
      const r = Math.max(36, poolSpan * 0.7);
      camPos.current.lerp(new THREE.Vector3(Math.sin(angle) * r, Math.max(20, poolSpan * 0.35), Math.cos(angle) * r - 10), 0.04);
      camTarget.current.lerp(new THREE.Vector3(0, 1, -15), 0.06);
    }

    // ---- READY (출발대 차렷 대기!) ----
    else if (appState === AppState.READY || appState === AppState.GREETING || appState === AppState.PREPARING) {
      raceStartRef.current = 0;
      camTarget.current.lerp(new THREE.Vector3(0, 0.5, 1.5), 0.1);
      camPos.current.lerp(new THREE.Vector3(0, Math.max(6, poolSpan * 0.18), Math.max(14, poolSpan * 0.35)), 0.05);
    }

    // ---- RACING (4단계 다이내믹 시네마틱 카메라 전환!) ----
    else if (appState === AppState.RACING) {
      if (swimmers.length === 0) return;
      if (raceStartRef.current === 0) {
        raceStartRef.current = t;
      }
      const elapsed = Math.max(0, t - raceStartRef.current);

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

      if (maxProgress < 0.20) {
        // 1단계: 경기 초반/다이빙 - 측면 트래킹 뷰 ("카메라가 처음에는 옆에서")
        camPos.current.lerp(new THREE.Vector3(leaderX + poolSpan * 0.45 + 5.0, 4.2, leaderZ + 2.0), 0.08);
        camTarget.current.lerp(new THREE.Vector3(leaderX, 0.2, leaderZ), 0.10);
      } else if (maxProgress < 0.50) {
        // 2단계: 경기 중반 1 - 선수들 뒤에서 따라가는 체이스 뷰 ("중간에서는 뒤에서 한 번")
        camPos.current.lerp(new THREE.Vector3(leaderX * 0.5, 3.8, leaderZ + 9.5), 0.08);
        camTarget.current.lerp(new THREE.Vector3(leaderX, 0.2, leaderZ - 5.0), 0.10);
      } else if (maxProgress < 0.80) {
        // 3단계: 경기 중반 2 - 선수들 앞에서 지켜보는 정면 뷰 ("앞에서 한번")
        camPos.current.lerp(new THREE.Vector3(centerX * 0.5, 3.2, leaderZ - 8.5), 0.08);
        camTarget.current.lerp(new THREE.Vector3(leaderX, 0.2, leaderZ), 0.10);
      } else {
        // 4단계: 결승선 완주 직전 - 뒤쪽 높이서 수영장 전체 및 결승선을 와이드 조망 ("마지막 결승선에서는 뒤에서 전체를 잡도록 해")
        camPos.current.lerp(new THREE.Vector3(0, 13.5, 12.0), 0.08);
        camTarget.current.lerp(new THREE.Vector3(0, -0.5, -50.0), 0.10);
      }
    }

    // ---- FINISHED (완주 후 뒤쪽 높이에서 수영장 전체 전경 와이드 뷰) ----
    else if (appState === AppState.FINISHED) {
      camPos.current.lerp(new THREE.Vector3(0, 13.5, 12.0), 0.08);
      camTarget.current.lerp(new THREE.Vector3(0, -0.5, -50.0), 0.10);
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
