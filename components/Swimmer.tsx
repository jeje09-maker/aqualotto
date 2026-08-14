// @ts-nocheck
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AppState, Swimmer as SwimmerType } from '../types';
import Splash from './Splash';
import { getLaneX } from './SwimmingPool';

interface SwimmerProps {
  swimmer: SwimmerType;
  totalSwimmers: number;
  appState: AppState;
  isCurrentIntro: boolean;
  onReachedEnd: () => void;
  laneWidth?: number;
}

const Swimmer: React.FC<SwimmerProps> = ({ swimmer, totalSwimmers, appState, isCurrentIntro, onReachedEnd, laneWidth = 3 }) => {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);

  const leftUpperArm = useRef<THREE.Group>(null);
  const rightUpperArm = useRef<THREE.Group>(null);
  const leftForearm = useRef<THREE.Group>(null);
  const rightForearm = useRef<THREE.Group>(null);
  const leftUpperLeg = useRef<THREE.Group>(null);
  const rightUpperLeg = useRef<THREE.Group>(null);
  const leftCalf = useRef<THREE.Group>(null);
  const rightCalf = useRef<THREE.Group>(null);

  const [progress, setProgress] = useState(0);
  const currentProgressRef = useRef(0);
  const startTime = useRef(0);
  const collapseAnimProgress = useRef(0);

  const startZ = 3.6;
  const finishZ = -52.4;
  const poolLength = Math.abs(startZ - finishZ);
  const onBlockY = 2.42;

  const laneX = getLaneX(swimmer.lane, totalSwimmers, laneWidth);
  const animMult = useRef(0.85 + Math.random() * 0.35);

  const skinColor = '#e59866'; // Rich warm natural skin tone
  const swimColor = swimmer.color || '#2563eb';

  // Number Badge Texture
  const numberTexture = React.useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = swimmer.capColor || swimColor;
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 64px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(swimmer.id.toString(), 64, 64);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 6;
      ctx.strokeText(swimmer.id.toString(), 64, 64);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [swimmer.id, swimmer.capColor, swimColor]);

  // Floating 3D Nameplate Texture
  const nameplateTexture = React.useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(10, 15, 30, 0.88)';
      ctx.roundRect(4, 4, 248, 56, 16);
      ctx.fill();
      ctx.strokeStyle = swimmer.capColor || swimColor;
      ctx.lineWidth = 4;
      ctx.roundRect(4, 4, 248, 56, 16);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const displayName = swimmer.name ? `${swimmer.id}. ${swimmer.name}` : `${swimmer.id}번`;
      ctx.fillText(displayName.length > 9 ? displayName.slice(0, 8) + '…' : displayName, 128, 32);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [swimmer.id, swimmer.name, swimmer.capColor, swimColor]);

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
      group.current.position.set(laneX, onBlockY, startZ);
      group.current.rotation.set(0, Math.PI, 0);
      if (body.current) body.current.rotation.set(0, 0, 0);
      if (leftUpperArm.current) leftUpperArm.current.rotation.set(0, 0, 0.2);
      if (rightUpperArm.current) rightUpperArm.current.rotation.set(0, 0, -0.2);
      if (leftForearm.current) leftForearm.current.rotation.set(0, 0, 0);
      if (rightForearm.current) rightForearm.current.rotation.set(0, 0, 0);
      if (leftUpperLeg.current) leftUpperLeg.current.rotation.set(0, 0, 0);
      if (rightUpperLeg.current) rightUpperLeg.current.rotation.set(0, 0, 0);
      if (leftCalf.current) leftCalf.current.rotation.set(0, 0, 0);
      if (rightCalf.current) rightCalf.current.rotation.set(0, 0, 0);
      return;
    }

    // ---- READY ----
    if (appState === AppState.READY || appState === AppState.GREETING || appState === AppState.PREPARING) {
      group.current.position.set(laneX, onBlockY, startZ);
      group.current.rotation.y = Math.PI;
      group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, onBlockY, 0.2);
      if (body.current) body.current.rotation.x = THREE.MathUtils.lerp(body.current.rotation.x, -0.35, 0.15);
      if (leftUpperArm.current) leftUpperArm.current.rotation.x = THREE.MathUtils.lerp(leftUpperArm.current.rotation.x, -0.6, 0.15);
      if (rightUpperArm.current) rightUpperArm.current.rotation.x = THREE.MathUtils.lerp(rightUpperArm.current.rotation.x, -0.6, 0.15);
      return;
    }

    // ---- RACING & FINISHED ----
    if (appState === AppState.RACING || appState === AppState.FINISHED) {
      if (swimmer.isCollapsed) {
        collapseAnimProgress.current = Math.min(1, collapseAnimProgress.current + delta * 3);
        const colT = collapseAnimProgress.current;

        group.current.position.x = laneX;
        group.current.position.z = startZ - currentProgressRef.current * poolLength;
        group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, -0.65, 0.1);
        
        group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, Math.PI * 0.95, 0.1);
        group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, Math.PI + 0.3, 0.1);
        group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, 0.6, 0.1);

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
        group.current.position.set(laneX, 0.4, finishZ + 0.5);
        group.current.rotation.set(-0.2, Math.PI, 0);
        if (rightUpperArm.current) rightUpperArm.current.rotation.z = -2.0 + Math.sin(t * 6) * 0.3;
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

        // REALISTIC HEAD-FIRST DIVE ENTRY
        const diveThreshold = 0.075;
        if (nextProgress < diveThreshold) {
          const diveT = nextProgress / diveThreshold;
          group.current.position.x = laneX;
          
          const diveDistance = diveT * 5.2;
          group.current.position.z = startZ - diveDistance;
          
          let jumpHeight: number;
          let divePitch: number;

          if (diveT < 0.3) {
            const tNorm = diveT / 0.3;
            jumpHeight = Math.sin(tNorm * Math.PI * 0.5) * 0.7;
            divePitch = THREE.MathUtils.lerp(-0.15, -Math.PI * 0.40, tNorm);
          } else if (diveT < 0.75) {
            const tNorm = (diveT - 0.3) / 0.45;
            jumpHeight = Math.cos(tNorm * Math.PI * 0.5) * 0.7 - tNorm * 1.8;
            divePitch = THREE.MathUtils.lerp(-Math.PI * 0.40, -Math.PI * 0.72, tNorm);
          } else {
            const tNorm = (diveT - 0.75) / 0.25;
            jumpHeight = -1.1 + tNorm * 1.02;
            divePitch = THREE.MathUtils.lerp(-Math.PI * 0.72, -Math.PI * 0.50, tNorm);
          }

          group.current.position.y = onBlockY + jumpHeight;
          group.current.rotation.set(divePitch, Math.PI, 0);
          if (body.current) body.current.rotation.set(0, 0, 0);
          
          if (leftUpperArm.current) leftUpperArm.current.rotation.set(-Math.PI * 0.98, 0, -0.05);
          if (rightUpperArm.current) rightUpperArm.current.rotation.set(-Math.PI * 0.98, 0, 0.05);
          if (leftForearm.current) leftForearm.current.rotation.set(0, 0, 0);
          if (rightForearm.current) rightForearm.current.rotation.set(0, 0, 0);
          if (leftUpperLeg.current) leftUpperLeg.current.rotation.set(0, 0, 0);
          if (rightUpperLeg.current) rightUpperLeg.current.rotation.set(0, 0, 0);
          if (leftCalf.current) leftCalf.current.rotation.set(0, 0, 0);
          if (rightCalf.current) rightCalf.current.rotation.set(0, 0, 0);
        } else {
          // PERFECT WATER DRAFTING DEPTH (Y = -0.08: Body submerged naturally underwater, zero left-right wobbling!)
          group.current.position.x = laneX;
          group.current.position.z = startZ - nextProgress * poolLength;
          group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, -0.08, 0.3);
          
          // Laser-straight forward orientation (zero Y/Z wobbling!)
          group.current.rotation.set(-Math.PI / 2, Math.PI, 0);
          if (body.current) body.current.rotation.set(0, 0, 0);

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
            armUpperRef.current.rotation.x = -armX * 0.95;
            armUpperRef.current.rotation.z = zSign * (0.22 + Math.sin(ph) * 0.12);

            let elbowBend: number;
            if (norm < 0.5) {
              elbowBend = Math.sin(norm * Math.PI * 2) * (Math.PI / 2.0);
            } else {
              elbowBend = Math.sin((norm - 0.5) * Math.PI) * 0.6;
            }
            armForearmRef.current.rotation.x = elbowBend;
          };

          computeArm(0, leftUpperArm, leftForearm, -1);
          computeArm(Math.PI, rightUpperArm, rightForearm, 1);

          // Submerged flutter kick
          const kickSpeed = Math.max(5.0, swimSpeed * 1.65);

          const computeLeg = (phaseOffset: number, legUpperRef, legCalfRef) => {
            if (!legUpperRef.current || !legCalfRef.current) return;
            const legSin = Math.sin(t * kickSpeed + phaseOffset);
            legUpperRef.current.rotation.x = Math.max(0, legSin) * 0.32 + 0.05;
            const kneeBend = Math.max(0, legSin) * 0.45;
            legCalfRef.current.rotation.x = kneeBend;
          };

          computeLeg(0, leftUpperLeg, leftCalf);
          computeLeg(Math.PI, rightUpperLeg, rightCalf);
        }

        if (nextProgress >= 1) onReachedEnd();
      } else {
        group.current.position.y = -0.12;
      }
    }
  });

  return (
    <group ref={group} position={[laneX, onBlockY, startZ]}>
      <group ref={body}>

        {/* 3D Floating Nameplate Badge */}
        <sprite position={[0, 1.55, 0]} scale={[1.8, 0.45, 1]}>
          <spriteMaterial map={nameplateTexture} depthTest={false} />
        </sprite>

        {/* Athletic Human Torso - Smooth Rounded Shoulder Capsule */}
        <group position={[0, 0.2, 0]}>
          <mesh castShadow position={[0, 0.26, 0]} scale={[1.38, 1.0, 0.88]}>
            <capsuleGeometry args={[0.24, 0.28, 12, 24]} />
            <meshStandardMaterial color={skinColor} roughness={0.35} metalness={0.08} />
          </mesh>
          <mesh castShadow position={[-0.12, 0.30, 0.12]} rotation={[0.1, 0, 0]}>
            <boxGeometry args={[0.22, 0.18, 0.10]} />
            <meshStandardMaterial color={skinColor} roughness={0.35} metalness={0.08} />
          </mesh>
          <mesh castShadow position={[0.12, 0.30, 0.12]} rotation={[0.1, 0, 0]}>
            <boxGeometry args={[0.22, 0.18, 0.10]} />
            <meshStandardMaterial color={skinColor} roughness={0.35} metalness={0.08} />
          </mesh>
        </group>

        {/* Swim Trunks */}
        <group position={[0, -0.18, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.24, 0.22, 0.35, 24]} />
            <meshStandardMaterial color={swimColor} roughness={0.4} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0.15, 0]}>
            <torusGeometry args={[0.245, 0.02, 8, 24]} />
            <meshStandardMaterial color={swimmer.capColor || '#ffffff'} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.02, 0.23]} rotation={[0, 0, 0]}>
            <planeGeometry args={[0.16, 0.16]} />
            <meshStandardMaterial map={numberTexture} transparent roughness={0.5} />
          </mesh>
        </group>

        {/* Anatomical Head with Swim Cap & Tinted Goggles */}
        <group position={[0, 0.78, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.19, 24, 24]} />
            <meshStandardMaterial color={skinColor} roughness={0.4} />
          </mesh>
          
          <mesh position={[0, 0.04, -0.01]} rotation={[-0.1, 0, 0]}>
            <sphereGeometry args={[0.198, 24, 24, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
            <meshStandardMaterial color={swimmer.capColor || swimColor} roughness={0.25} metalness={0.25} />
          </mesh>

          <mesh position={[0.18, 0.05, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.14, 0.14]} />
            <meshStandardMaterial map={numberTexture} transparent roughness={0.4} />
          </mesh>

          <group position={[0, -0.02, 0.16]}>
            <mesh position={[-0.065, 0, 0]} rotation={[0, 0.2, 0]}>
              <boxGeometry args={[0.08, 0.05, 0.04]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[0.065, 0, 0]} rotation={[0, 0.2, 0]}>
              <boxGeometry args={[0.08, 0.05, 0.04]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[0, 0, -0.1]} rotation={[0, 0, 0]}>
              <torusGeometry args={[0.185, 0.012, 6, 24]} />
              <meshStandardMaterial color="#1e293b" roughness={0.5} />
            </mesh>
          </group>
        </group>

        {/* LEFT ARM */}
        <group ref={leftUpperArm} position={[-0.34, 0.52, 0]}>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshStandardMaterial color={skinColor} roughness={0.35} />
          </mesh>
          <mesh position={[0, -0.21, 0]} castShadow>
            <capsuleGeometry args={[0.068, 0.36, 6, 12]} />
            <meshStandardMaterial color={skinColor} roughness={0.35} />
          </mesh>
          <group ref={leftForearm} position={[0, -0.44, 0]}>
            <mesh position={[0, -0.17, 0]} castShadow>
              <capsuleGeometry args={[0.055, 0.32, 6, 12]} />
              <meshStandardMaterial color={skinColor} roughness={0.35} />
            </mesh>
            <mesh position={[0, -0.34, 0.03]} castShadow>
              <boxGeometry args={[0.11, 0.06, 0.16]} />
              <meshStandardMaterial color={skinColor} roughness={0.4} />
            </mesh>
          </group>
        </group>

        {/* RIGHT ARM */}
        <group ref={rightUpperArm} position={[0.34, 0.52, 0]}>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshStandardMaterial color={skinColor} roughness={0.35} />
          </mesh>
          <mesh position={[0, -0.21, 0]} castShadow>
            <capsuleGeometry args={[0.068, 0.36, 6, 12]} />
            <meshStandardMaterial color={skinColor} roughness={0.35} />
          </mesh>
          <group ref={rightForearm} position={[0, -0.44, 0]}>
            <mesh position={[0, -0.17, 0]} castShadow>
              <capsuleGeometry args={[0.055, 0.32, 6, 12]} />
              <meshStandardMaterial color={skinColor} roughness={0.35} />
            </mesh>
            <mesh position={[0, -0.34, 0.03]} castShadow>
              <boxGeometry args={[0.11, 0.06, 0.16]} />
              <meshStandardMaterial color={skinColor} roughness={0.4} />
            </mesh>
          </group>
        </group>

        {/* LEFT LEG & FOOT */}
        <group ref={leftUpperLeg} position={[-0.14, -0.36, 0]}>
          <mesh position={[0, -0.25, 0]} castShadow>
            <capsuleGeometry args={[0.088, 0.42, 6, 12]} />
            <meshStandardMaterial color={swimColor} roughness={0.4} />
          </mesh>
          <group ref={leftCalf} position={[0, -0.52, 0]}>
            <mesh position={[0, -0.2, 0]} castShadow>
              <capsuleGeometry args={[0.068, 0.38, 6, 12]} />
              <meshStandardMaterial color={skinColor} roughness={0.35} />
            </mesh>
            <mesh position={[0, -0.42, 0.06]} castShadow rotation={[0.2, 0, 0]}>
              <boxGeometry args={[0.09, 0.06, 0.22]} />
              <meshStandardMaterial color={skinColor} roughness={0.4} />
            </mesh>
          </group>
        </group>

        {/* RIGHT LEG & FOOT */}
        <group ref={rightUpperLeg} position={[0.14, -0.36, 0]}>
          <mesh position={[0, -0.25, 0]} castShadow>
            <capsuleGeometry args={[0.088, 0.42, 6, 12]} />
            <meshStandardMaterial color={swimColor} roughness={0.4} />
          </mesh>
          <group ref={rightCalf} position={[0, -0.52, 0]}>
            <mesh position={[0, -0.2, 0]} castShadow>
              <capsuleGeometry args={[0.068, 0.38, 6, 12]} />
              <meshStandardMaterial color={skinColor} roughness={0.35} />
            </mesh>
            <mesh position={[0, -0.42, 0.06]} castShadow rotation={[0.2, 0, 0]}>
              <boxGeometry args={[0.09, 0.06, 0.22]} />
              <meshStandardMaterial color={skinColor} roughness={0.4} />
            </mesh>
          </group>
        </group>

      </group>

      {/* Dynamic Water Splash ONLY WHEN IN WATER */}
      {appState === AppState.RACING && !swimmer.isCollapsed && progress >= 0.075 && progress < 0.98 && (
        <Splash position={[0, 0.1, 0]} scale={2.4} rate={4} />
      )}
    </group>
  );
};

export default Swimmer;
