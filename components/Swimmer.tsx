
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
  laneWidth?: number;
}

const Swimmer: React.FC<SwimmerProps> = ({ swimmer, appState, isCurrentIntro, onReachedEnd, laneWidth = 3 }) => {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);

  // Upper arm groups (rotate at shoulder)
  const leftUpperArm = useRef<THREE.Group>(null);
  const rightUpperArm = useRef<THREE.Group>(null);
  // Forearm groups (rotate at elbow — child of upper arm)
  const leftForearm = useRef<THREE.Group>(null);
  const rightForearm = useRef<THREE.Group>(null);
  // Upper leg groups (rotate at hip)
  const leftUpperLeg = useRef<THREE.Group>(null);
  const rightUpperLeg = useRef<THREE.Group>(null);
  // Calf groups (rotate at knee — child of upper leg)
  const leftCalf = useRef<THREE.Group>(null);
  const rightCalf = useRef<THREE.Group>(null);

  const [progress, setProgress] = useState(0);
  const currentProgressRef = useRef(0);
  const startTime = useRef(0);
  const collapseAnimProgress = useRef(0);

  const startZ = 2.2;
  const finishZ = -52.4;
  const poolLength = Math.abs(startZ - finishZ);
  const onBlockY = 2.42;

  // Per-swimmer random animation speed multiplier for variety
  const animMult = useRef(0.8 + Math.random() * 0.4);

  const skinColor = '#f5c99a';
  const swimColor = swimmer.color;

  useEffect(() => {
    if (appState === AppState.RACING) {
      startTime.current = performance.now() / 1000;
      currentProgressRef.current = 0;
      collapseAnimProgress.current = 0;
      setProgress(0);
    }
  }, [appState]);

  useFrame((state, delta) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();

    // ---- IDLE ----
    if (appState === AppState.IDLE) {
      group.current.position.set(swimmer.lane * laneWidth, onBlockY, startZ);
      group.current.rotation.set(0, Math.PI, 0);
      if (body.current) body.current.rotation.set(0, 0, 0);
      if (leftUpperArm.current) leftUpperArm.current.rotation.set(0, 0, 0.3);
      if (rightUpperArm.current) rightUpperArm.current.rotation.set(0, 0, -0.3);
      if (leftForearm.current) leftForearm.current.rotation.set(0, 0, 0);
      if (rightForearm.current) rightForearm.current.rotation.set(0, 0, 0);
      if (leftUpperLeg.current) leftUpperLeg.current.rotation.set(0, 0, 0);
      if (rightUpperLeg.current) rightUpperLeg.current.rotation.set(0, 0, 0);
      if (leftCalf.current) leftCalf.current.rotation.set(0, 0, 0);
      if (rightCalf.current) rightCalf.current.rotation.set(0, 0, 0);
      return;
    }

    // ---- GREETING ----
    if (appState === AppState.GREETING) {
      group.current.position.set(swimmer.lane * laneWidth, onBlockY, startZ);
      if (isCurrentIntro) {
        group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, 0, 0.15); // face camera
        if (rightUpperArm.current) rightUpperArm.current.rotation.z = THREE.MathUtils.lerp(rightUpperArm.current.rotation.z, -2.2 + Math.sin(t * 8) * 0.4, 0.2); // wave
      } else {
        group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, Math.PI, 0.1);
        if (rightUpperArm.current) rightUpperArm.current.rotation.z = THREE.MathUtils.lerp(rightUpperArm.current.rotation.z, -0.3, 0.1);
      }
      return;
    }

    // ---- READY ----
    if (appState === AppState.READY) {
      group.current.position.set(swimmer.lane * laneWidth, onBlockY, startZ);
      group.current.rotation.y = Math.PI;
      group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, onBlockY, 0.2);
      if (body.current) body.current.rotation.x = THREE.MathUtils.lerp(body.current.rotation.x, -0.08, 0.15);
      if (leftUpperArm.current) leftUpperArm.current.rotation.x = THREE.MathUtils.lerp(leftUpperArm.current.rotation.x, -0.4, 0.15);
      if (rightUpperArm.current) rightUpperArm.current.rotation.x = THREE.MathUtils.lerp(rightUpperArm.current.rotation.x, -0.4, 0.15);
      return;
    }

    // ---- RACING & FINISHED (with Fall Down / Collapse logic) ----
    if (appState === AppState.RACING || appState === AppState.FINISHED) {
      // If swimmer is collapsed (fell down on the spot)
      if (swimmer.isCollapsed) {
        collapseAnimProgress.current = Math.min(1, collapseAnimProgress.current + delta * 3);
        const colT = collapseAnimProgress.current;

        // Position stays locked at the progress point where they collapsed
        group.current.position.x = swimmer.lane * laneWidth;
        group.current.position.z = startZ - currentProgressRef.current * poolLength;
        // Sinks into the water and rolls over/flops
        group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, -0.65, 0.1);
        
        // Dramatic flop rotation: rolls forward and tilts upside down / exhausted
        group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, Math.PI * 0.95, 0.1);
        group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, Math.PI + 0.3, 0.1);
        group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, 0.6, 0.1);

        // Limbs go completely limp / sprawled
        if (leftUpperArm.current) leftUpperArm.current.rotation.set(0.6 * colT, 0, -0.7 * colT);
        if (rightUpperArm.current) rightUpperArm.current.rotation.set(0.6 * colT, 0, 0.7 * colT);
        if (leftForearm.current) leftForearm.current.rotation.set(0.4 * colT, 0, 0);
        if (rightForearm.current) rightForearm.current.rotation.set(0.4 * colT, 0, 0);
        if (leftUpperLeg.current) leftUpperLeg.current.rotation.set(-0.3 * colT, 0, -0.3 * colT);
        if (rightUpperLeg.current) rightUpperLeg.current.rotation.set(-0.3 * colT, 0, 0.3 * colT);
        if (leftCalf.current) leftCalf.current.rotation.set(0.2 * colT, 0, 0);
        if (rightCalf.current) rightCalf.current.rotation.set(0.2 * colT, 0, 0);
        return;
      }

      if (appState === AppState.FINISHED && currentProgressRef.current >= 1) {
        // Winner celebratory float at the finish wall
        group.current.position.set(swimmer.lane * laneWidth, 0.4, finishZ + 0.5);
        group.current.rotation.set(-0.2, Math.PI, 0);
        if (rightUpperArm.current) rightUpperArm.current.rotation.z = -2.0 + Math.sin(t * 6) * 0.3; // Winner fist pump
        return;
      }

      if (appState === AppState.RACING && currentProgressRef.current < 1) {
        const elapsed = t - startTime.current;
        const p_base = elapsed * swimmer.speed;
        const p_var = Math.sin(elapsed * swimmer.frequency + swimmer.phase) * swimmer.surge;
        let p_spurt = 0;
        if (p_base > swimmer.spurtThreshold) {
          p_spurt = Math.pow((p_base - swimmer.spurtThreshold) * 10, 2.2) * swimmer.spurtStrength;
        }
        const nextProgress = Math.max(currentProgressRef.current + delta * 0.02, Math.min(p_base + p_var + p_spurt, 1));
        currentProgressRef.current = nextProgress;
        setProgress(nextProgress);

        // DIVE phase (0–6%): parabolic arc
        const diveThreshold = 0.06;
        if (nextProgress < diveThreshold) {
          const diveT = nextProgress / diveThreshold;
          group.current.position.x = swimmer.lane * laneWidth;
          group.current.position.z = startZ - nextProgress * poolLength;
          const jumpHeight = Math.sin(diveT * Math.PI) * 2.2;
          group.current.position.y = onBlockY + jumpHeight - diveT * (onBlockY + 0.5);
          group.current.rotation.set(
            THREE.MathUtils.lerp(0, Math.PI * 0.65, diveT),
            Math.PI,
            0
          );
          if (body.current) body.current.rotation.set(0, 0, 0);
          if (leftUpperArm.current) leftUpperArm.current.rotation.set(-Math.PI * 0.8 * diveT, 0, -0.06);
          if (rightUpperArm.current) rightUpperArm.current.rotation.set(-Math.PI * 0.8 * diveT, 0, 0.06);
          if (leftForearm.current) leftForearm.current.rotation.set(0, 0, 0);
          if (rightForearm.current) rightForearm.current.rotation.set(0, 0, 0);
          if (leftUpperLeg.current) leftUpperLeg.current.rotation.set(0, 0, 0);
          if (rightUpperLeg.current) rightUpperLeg.current.rotation.set(0, 0, 0);
          if (leftCalf.current) leftCalf.current.rotation.set(0, 0, 0);
          if (rightCalf.current) rightCalf.current.rotation.set(0, 0, 0);
        } else {
          // SWIM phase
          group.current.position.x = swimmer.lane * laneWidth;
          group.current.position.z = startZ - nextProgress * poolLength;
          group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, -0.15, 0.3);
          group.current.rotation.set(Math.PI / 2, Math.PI, 0);
          if (body.current) body.current.rotation.x = 0;

          const swimSpeed = Math.max(2.5, Math.min(14, (4.2 + p_var * 3 + p_spurt * 12) * animMult.current));
          const cycle = t * swimSpeed;

          // Freestyle arm strokes
          const computeArm = (phaseOffset: number, armUpperRef, armForearmRef, zSign: number) => {
            if (!armUpperRef.current || !armForearmRef.current) return;
            const ph = (cycle + phaseOffset) % (Math.PI * 2);
            const norm = ph / (Math.PI * 2);

            let armX: number;
            if (norm < 0.5) {
              armX = Math.PI * (1 - 4 * norm);
            } else {
              armX = -Math.PI + Math.PI * 2 * (norm - 0.5) * 2;
            }
            armUpperRef.current.rotation.x = -armX * 0.6;
            armUpperRef.current.rotation.z = zSign * (0.15 + Math.sin(ph) * 0.08);

            let elbowBend: number;
            if (norm < 0.5) {
              elbowBend = Math.sin(norm * Math.PI * 2) * (Math.PI / 2);
            } else {
              elbowBend = Math.sin((norm - 0.5) * Math.PI) * 0.5;
            }
            armForearmRef.current.rotation.x = elbowBend;
          };

          computeArm(0, leftUpperArm, leftForearm, -1);
          computeArm(Math.PI, rightUpperArm, rightForearm, 1);

          // Flutter kick
          const kickSpeed = Math.max(5.0, swimSpeed * 1.65);
          const kickAmp = 0.44;

          const computeLeg = (phaseOffset: number, legUpperRef, legCalfRef) => {
            if (!legUpperRef.current || !legCalfRef.current) return;
            const legSin = -Math.sin(t * kickSpeed + phaseOffset);
            legUpperRef.current.rotation.x = legSin * kickAmp;
            const kneeBend = Math.max(0, legSin) * 0.62;
            legCalfRef.current.rotation.x = kneeBend;
          };

          computeLeg(0, leftUpperLeg, leftCalf);
          computeLeg(Math.PI, rightUpperLeg, rightCalf);

          // Body roll
          if (body.current) {
            body.current.rotation.z = Math.sin(cycle * 0.5) * 0.22;
          }
        }

        if (nextProgress >= 1) onReachedEnd();
      } else {
        group.current.position.y = -0.12;
      }
    }
  });

  return (
    <group ref={group} position={[swimmer.lane * laneWidth, onBlockY, startZ]}>
      <group ref={body}>

        {/* Torso */}
        <mesh castShadow>
          <capsuleGeometry args={[0.22, 0.5, 8, 16]} />
          <meshStandardMaterial color={swimColor} roughness={0.3} metalness={0.15} />
        </mesh>

        {/* Head */}
        <group position={[0, 0.57, 0]}>
          {/* Front face - skin */}
          <mesh castShadow>
            <sphereGeometry args={[0.2, 20, 20, 0, Math.PI * 2, 0, Math.PI]} />
            <meshStandardMaterial color={skinColor} roughness={0.5} />
          </mesh>
          {/* Back of head - dark / black */}
          <mesh castShadow position={[0, 0, -0.01]}>
            <sphereGeometry args={[0.205, 20, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
            <meshStandardMaterial color="#111111" roughness={0.6} />
          </mesh>
          {/* Swim cap (dome over top) */}
          <mesh position={[0, 0.04, 0]} rotation={[-0.08, 0, 0]}>
            <sphereGeometry args={[0.208, 20, 20, 0, Math.PI * 2, 0, Math.PI / 1.9]} />
            <meshStandardMaterial color={swimmer.capColor} roughness={0.35} metalness={0.1} />
          </mesh>
          {/* Goggles */}
          <mesh position={[-0.07, -0.04, 0.17]} rotation={[0, 0.15, Math.PI / 2]}>
            <torusGeometry args={[0.04, 0.018, 8, 18]} />
            <meshStandardMaterial color="#1a1a2e" metalness={0.6} roughness={0.2} />
          </mesh>
          <mesh position={[0.07, -0.04, 0.17]} rotation={[0, -0.15, Math.PI / 2]}>
            <torusGeometry args={[0.04, 0.018, 8, 18]} />
            <meshStandardMaterial color="#1a1a2e" metalness={0.6} roughness={0.2} />
          </mesh>
        </group>

        {/* LEFT ARM */}
        <group ref={leftUpperArm} position={[-0.27, 0.28, 0]}>
          <mesh position={[0, -0.21, 0]} castShadow>
            <capsuleGeometry args={[0.072, 0.37, 4, 8]} />
            <meshStandardMaterial color={skinColor} roughness={0.45} />
          </mesh>
          <group ref={leftForearm} position={[0, -0.44, 0]}>
            <mesh position={[0, -0.17, 0]} castShadow>
              <capsuleGeometry args={[0.058, 0.3, 4, 8]} />
              <meshStandardMaterial color={skinColor} roughness={0.45} />
            </mesh>
            <mesh position={[0, -0.33, 0.03]} castShadow>
              <boxGeometry args={[0.12, 0.07, 0.18]} />
              <meshStandardMaterial color={skinColor} roughness={0.5} />
            </mesh>
          </group>
        </group>

        {/* RIGHT ARM */}
        <group ref={rightUpperArm} position={[0.27, 0.28, 0]}>
          <mesh position={[0, -0.21, 0]} castShadow>
            <capsuleGeometry args={[0.072, 0.37, 4, 8]} />
            <meshStandardMaterial color={skinColor} roughness={0.45} />
          </mesh>
          <group ref={rightForearm} position={[0, -0.44, 0]}>
            <mesh position={[0, -0.17, 0]} castShadow>
              <capsuleGeometry args={[0.058, 0.3, 4, 8]} />
              <meshStandardMaterial color={skinColor} roughness={0.45} />
            </mesh>
            <mesh position={[0, -0.33, 0.03]} castShadow>
              <boxGeometry args={[0.12, 0.07, 0.18]} />
              <meshStandardMaterial color={skinColor} roughness={0.5} />
            </mesh>
          </group>
        </group>

        {/* LEFT LEG */}
        <group ref={leftUpperLeg} position={[-0.11, -0.26, 0]}>
          <mesh position={[0, -0.25, 0]} castShadow>
            <capsuleGeometry args={[0.092, 0.43, 4, 8]} />
            <meshStandardMaterial color={swimColor} roughness={0.4} />
          </mesh>
          <group ref={leftCalf} position={[0, -0.52, 0]}>
            <mesh position={[0, -0.2, 0]} castShadow>
              <capsuleGeometry args={[0.07, 0.36, 4, 8]} />
              <meshStandardMaterial color={skinColor} roughness={0.45} />
            </mesh>
            <mesh position={[0, -0.4, 0.07]} castShadow rotation={[0.25, 0, 0]}>
              <boxGeometry args={[0.1, 0.07, 0.22]} />
              <meshStandardMaterial color={skinColor} roughness={0.5} />
            </mesh>
          </group>
        </group>

        {/* RIGHT LEG */}
        <group ref={rightUpperLeg} position={[0.11, -0.26, 0]}>
          <mesh position={[0, -0.25, 0]} castShadow>
            <capsuleGeometry args={[0.092, 0.43, 4, 8]} />
            <meshStandardMaterial color={swimColor} roughness={0.4} />
          </mesh>
          <group ref={rightCalf} position={[0, -0.52, 0]}>
            <mesh position={[0, -0.2, 0]} castShadow>
              <capsuleGeometry args={[0.07, 0.36, 4, 8]} />
              <meshStandardMaterial color={skinColor} roughness={0.45} />
            </mesh>
            <mesh position={[0, -0.4, 0.07]} castShadow rotation={[0.25, 0, 0]}>
              <boxGeometry args={[0.1, 0.07, 0.22]} />
              <meshStandardMaterial color={skinColor} roughness={0.5} />
            </mesh>
          </group>
        </group>

      </group>

      {/* Splash effect only while actively swimming */}
      {appState === AppState.RACING && !swimmer.isCollapsed && progress > 0.03 && progress < 0.98 && (
        <Splash position={[0, 0.1, 0]} scale={2.2} rate={3.5} />
      )}
    </group>
  );
};

export default Swimmer;

