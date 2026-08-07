
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

  const laneWidth = 3;
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
      setProgress(0);
    }
  }, [appState]);

  useFrame((state, delta) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();

    // ---- IDLE ----
    if (appState === AppState.IDLE) {
      group.current.position.set(swimmer.lane * laneWidth, onBlockY, startZ);
      // Y=π → swimmer faces AWAY from camera (we see their black back/head)
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

    // ---- READY ----
    if (appState === AppState.READY) {
      // Keep showing back (black head) just like IDLE
      group.current.rotation.y = Math.PI;
      group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, onBlockY, 0.2);
      if (body.current) body.current.rotation.x = THREE.MathUtils.lerp(body.current.rotation.x, -0.08, 0.15);
      if (leftUpperArm.current) leftUpperArm.current.rotation.x = THREE.MathUtils.lerp(leftUpperArm.current.rotation.x, -0.4, 0.15);
      if (rightUpperArm.current) rightUpperArm.current.rotation.x = THREE.MathUtils.lerp(rightUpperArm.current.rotation.x, -0.4, 0.15);
    }

    // ---- RACING ----
    if (appState === AppState.RACING) {
      if (currentProgressRef.current < 1) {
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

        // DIVE phase (0–7%): long diagonal arc entry far from block
        const diveThreshold = 0.07;
        if (nextProgress < diveThreshold) {
          const diveT = nextProgress / diveThreshold;
          // Long arcing leap — 4.5 units horizontal, 1.6 units high
          const diveLeap = Math.sin(diveT * Math.PI) * 4.5;
          group.current.position.x = swimmer.lane * laneWidth; // stay in lane
          group.current.position.z = startZ - nextProgress * poolLength - diveLeap;
          const jumpHeight = Math.sin(diveT * Math.PI) * 1.6;
          group.current.position.y = onBlockY + jumpHeight - diveT * (onBlockY + 0.3);
          // rotation.x goes from 0 (standing) → +π/1.5 (nose-diving)
          // rotation.y stays at π (back toward camera throughout)
          group.current.rotation.set(
            THREE.MathUtils.lerp(0, Math.PI / 1.5, diveT),
            Math.PI,
            0
          );
          if (body.current) body.current.rotation.set(0, 0, 0);
          // Arms streamline forward during dive
          if (leftUpperArm.current) leftUpperArm.current.rotation.set(Math.PI * 0.9 * diveT, 0, -0.06);
          if (rightUpperArm.current) rightUpperArm.current.rotation.set(Math.PI * 0.9 * diveT, 0, 0.06);
          if (leftForearm.current) leftForearm.current.rotation.set(0, 0, 0);
          if (rightForearm.current) rightForearm.current.rotation.set(0, 0, 0);
          if (leftUpperLeg.current) leftUpperLeg.current.rotation.set(0, 0, 0);
          if (rightUpperLeg.current) rightUpperLeg.current.rotation.set(0, 0, 0);
          if (leftCalf.current) leftCalf.current.rotation.set(0, 0, 0);
          if (rightCalf.current) rightCalf.current.rotation.set(0, 0, 0);
        } else {
          // SWIM phase:
          //   rotation.x = +π/2 → body lies horizontal
          //   rotation.y = π    → head faces -Z (finish), face faces -Y (into water) = freestyle ✓
          group.current.position.x = swimmer.lane * laneWidth; // locked to lane
          group.current.position.z = startZ - nextProgress * poolLength;
          group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, -0.15, 0.3);
          group.current.rotation.set(Math.PI / 2, Math.PI, 0);
          if (body.current) body.current.rotation.x = 0;

          // Per-swimmer speed variation — clamped so limbs never stop
          const swimSpeed = Math.max(2.5, Math.min(14, (4.2 + p_var * 3 + p_spurt * 12) * animMult.current));
          const cycle = t * swimSpeed; // continuous accumulating angle

          // ===== FREESTYLE ARM ANIMATION =====
          // Each arm is offset by π (opposite phase)
          // Cycle phases:
          //   0–π   : Recovery (above water) — arm sweeps from back, over the water
          //   π–2π  : Pull (below water) — arm enters water, pulls through

          const computeArm = (phaseOffset: number, armUpperRef, armForearmRef, zSign: number) => {
            if (!armUpperRef.current || !armForearmRef.current) return;
            const ph = (cycle + phaseOffset) % (Math.PI * 2);
            const norm = ph / (Math.PI * 2); // 0→1

            // Upper arm rotation around X (forward/back)
            // recovery: sweeps from ~1.5 (back) around to ~-1.5 (front entry)
            // pull:     sweeps from ~-1.5 (entry) to ~1.2 (exit/back)
            let armX: number;
            if (norm < 0.5) {
              // Recovery: arm above water — rotates backward over body
              // 0 → over → reach forward
              armX = Math.PI * (1 - 4 * norm); // +π → -π
            } else {
              // Pull: arm underwater pulling through
              armX = -Math.PI + Math.PI * 2 * (norm - 0.5) * 2; // -π → +π
            }
            // Negate rotation so arm sweeps FORWARD into water on pull (correct freestyle direction)
            armUpperRef.current.rotation.x = -armX * 0.6;
            // Slight outward flare
            armUpperRef.current.rotation.z = zSign * (0.15 + Math.sin(ph) * 0.08);

            // Elbow bend
            // Recovery phase (norm 0–0.5): elbow bends up to ~90° (π/2) as arm passes overhead
            // Pull phase (norm 0.5–1): elbow mostly straight
            let elbowBend: number;
            if (norm < 0.5) {
              // Peak elbow bend at norm~0.25 (directly overhead)
              elbowBend = Math.sin(norm * Math.PI * 2) * (Math.PI / 2); // 0 → 90° → 0
            } else {
              // Under water pull — slight bend for power ~30°
              elbowBend = Math.sin((norm - 0.5) * Math.PI) * 0.5;
            }
            armForearmRef.current.rotation.x = elbowBend;
          };

          computeArm(0, leftUpperArm, leftForearm, -1);
          computeArm(Math.PI, rightUpperArm, rightForearm, 1);

          // ===== FLUTTER KICK (legs) — always running, clamped speed =====
          // Per-swimmer kick speed uses a separate ref so it's independent & never 0
          const kickSpeed = Math.max(5.0, swimSpeed * 1.65);
          const kickAmp = 0.44;

          const computeLeg = (phaseOffset: number, legUpperRef, legCalfRef) => {
            if (!legUpperRef.current || !legCalfRef.current) return;
            // Negate legSin so kick direction matches actual freestyle (feet kick backward/downward)
            const legSin = -Math.sin(t * kickSpeed + phaseOffset);
            legUpperRef.current.rotation.x = legSin * kickAmp;
            // Knee bends on the upswing
            const kneeBend = Math.max(0, legSin) * 0.62;
            legCalfRef.current.rotation.x = kneeBend;
          };

          computeLeg(0, leftUpperLeg, leftCalf);
          computeLeg(Math.PI, rightUpperLeg, rightCalf);

          // ===== BODY ROLL (realistic crawl) =====
          if (body.current) {
            body.current.rotation.z = Math.sin(cycle * 0.5) * 0.22;
          }
        }

        if (nextProgress >= 1) onReachedEnd();
      } else {
        group.current.position.y = -0.12;
      }
    }

    // ---- FINISHED ----
    if (appState === AppState.FINISHED) {
      group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, 0.4, 0.05);
      group.current.rotation.set(-0.2, Math.PI, 0);
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
          {/* Goggles (small torus around eyes) */}
          <mesh position={[-0.07, -0.04, 0.17]} rotation={[0, 0.15, Math.PI / 2]}>
            <torusGeometry args={[0.04, 0.018, 8, 18]} />
            <meshStandardMaterial color="#1a1a2e" metalness={0.6} roughness={0.2} />
          </mesh>
          <mesh position={[0.07, -0.04, 0.17]} rotation={[0, -0.15, Math.PI / 2]}>
            <torusGeometry args={[0.04, 0.018, 8, 18]} />
            <meshStandardMaterial color="#1a1a2e" metalness={0.6} roughness={0.2} />
          </mesh>
        </group>

        {/* LEFT ARM — shoulder pivot */}
        <group ref={leftUpperArm} position={[-0.27, 0.28, 0]}>
          {/* Upper arm */}
          <mesh position={[0, -0.21, 0]} castShadow>
            <capsuleGeometry args={[0.072, 0.37, 4, 8]} />
            <meshStandardMaterial color={skinColor} roughness={0.45} />
          </mesh>
          {/* Elbow pivot */}
          <group ref={leftForearm} position={[0, -0.44, 0]}>
            {/* Forearm */}
            <mesh position={[0, -0.17, 0]} castShadow>
              <capsuleGeometry args={[0.058, 0.3, 4, 8]} />
              <meshStandardMaterial color={skinColor} roughness={0.45} />
            </mesh>
            {/* Hand */}
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

        {/* LEFT LEG — hip pivot */}
        <group ref={leftUpperLeg} position={[-0.11, -0.26, 0]}>
          {/* Thigh */}
          <mesh position={[0, -0.25, 0]} castShadow>
            <capsuleGeometry args={[0.092, 0.43, 4, 8]} />
            <meshStandardMaterial color={swimColor} roughness={0.4} />
          </mesh>
          {/* Knee pivot */}
          <group ref={leftCalf} position={[0, -0.52, 0]}>
            {/* Calf */}
            <mesh position={[0, -0.2, 0]} castShadow>
              <capsuleGeometry args={[0.07, 0.36, 4, 8]} />
              <meshStandardMaterial color={skinColor} roughness={0.45} />
            </mesh>
            {/* Foot */}
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

      {appState === AppState.RACING && progress > 0.03 && progress < 0.98 && (
        <Splash position={[0, 0.1, 0]} scale={2.2} rate={3.5} />
      )}
    </group>
  );
};

export default Swimmer;
