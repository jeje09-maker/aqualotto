
// @ts-nocheck
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Crowd: React.FC<{ swimmersCount: number }> = ({ swimmersCount }) => {
  const laneWidth = 3;
  const poolWidth = swimmersCount * laneWidth + 2;
  const rowCount = 6;
  const rowSpacing = 1.1;
  const seatSpacing = 0.9;

  const bodyRef = useRef<THREE.InstancedMesh>();
  const headRef = useRef<THREE.InstancedMesh>();
  const leftArmRef = useRef<THREE.InstancedMesh>();
  const rightArmRef = useRef<THREE.InstancedMesh>();

  // Two separate dummy objects so we don't clobber matrix between body/arm updates
  const dummyBody = useMemo(() => new THREE.Object3D(), []);
  const dummyArm = useMemo(() => new THREE.Object3D(), []);

  const SHIRT_COLORS = [
    '#e63946', '#457b9d', '#f4d35e', '#3a86ff', '#ff6b6b',
    '#06d6a0', '#ffbe0b', '#8338ec', '#ff9f1c', '#2ec4b6'
  ];
  const SKIN_COLORS = ['#f5c99a', '#e8a87c', '#c68642', '#8d5524', '#fddbb4'];
  const STAND_COLOR = '#2b3a42';

  const spectators = useMemo(() => {
    const data: any[] = [];
    const poolLen = 58;
    const poolStartZ = 5;

    const push = (x: number, y: number, z: number) => {
      data.push({
        x, y, z,
        phase: Math.random() * Math.PI * 2,
        cheerSpeed: 2.0 + Math.random() * 3.5,   // how fast they cheer/raise arms
        jumpH: 0.07 + Math.random() * 0.13,
        shirtColor: new THREE.Color(SHIRT_COLORS[Math.floor(Math.random() * SHIRT_COLORS.length)]),
        skinColor: new THREE.Color(SKIN_COLORS[Math.floor(Math.random() * SKIN_COLORS.length)]),
      });
    };

    // Side stands (left and right)
    for (const xSign of [1, -1]) {
      for (let row = 0; row < rowCount; row++) {
        const x = (poolWidth / 2 + 1.5 + row * rowSpacing) * xSign;
        const baseY = 0.5 + row * 0.5;
        const cols = Math.floor(poolLen / seatSpacing);
        for (let c = 0; c < cols; c++) {
          push(x, baseY, poolStartZ - c * seatSpacing);
        }
      }
    }

    // End stands (behind start blocks)
    for (let row = 0; row < rowCount; row++) {
      const z = poolStartZ + 2 + row * rowSpacing;
      const baseY = 0.5 + row * 0.5;
      const totalWidth = poolWidth + 10 + row * 2;
      const cols = Math.floor(totalWidth / seatSpacing);
      for (let c = 0; c < cols; c++) {
        const x = -(totalWidth / 2) + c * seatSpacing;
        push(x, baseY, z);
      }
    }

    return data;
  }, [poolWidth]);

  useFrame((state) => {
    if (!bodyRef.current || !headRef.current || !leftArmRef.current || !rightArmRef.current) return;
    const t = state.clock.getElapsedTime();

    spectators.forEach((s, i) => {
      // Cheer intensity: oscillates between 0 and 1 (always positive)
      const cheer = (Math.sin(t * s.cheerSpeed + s.phase) + 1) * 0.5; // 0→1
      const jump = cheer * s.jumpH;

      // --- BODY (torso box) ---
      dummyBody.position.set(s.x, s.y + jump, s.z);
      dummyBody.scale.set(0.32, 0.42, 0.26);
      dummyBody.rotation.set(0, 0, 0);
      dummyBody.updateMatrix();
      bodyRef.current.setMatrixAt(i, dummyBody.matrix);
      bodyRef.current.setColorAt(i, s.shirtColor);

      // --- HEAD (sphere, above body) ---
      dummyBody.position.set(s.x, s.y + 0.36 + jump, s.z);
      dummyBody.scale.set(0.21, 0.23, 0.21);
      dummyBody.rotation.set(0, 0, 0);
      dummyBody.updateMatrix();
      headRef.current.setMatrixAt(i, dummyBody.matrix);
      headRef.current.setColorAt(i, s.skinColor);

      // --- ARMS ---
      // arm raise angle: 0 = hanging down, π*0.9 = fully raised overhead
      // When cheer=1 (peak), arms go almost vertical above head
      // When cheer=0 (rest), arms hang at ~30° outward
      const armAngle = THREE.MathUtils.lerp(0.3, Math.PI * 0.88, cheer);
      const armLen = 0.18; // half-length of arm box

      const shoulderY = s.y + 0.2 + jump; // top of torso

      // LEFT ARM: pivots at left shoulder, raises to the left-upward
      // Center of arm box = shoulder + armLen * direction
      const lDirX = -Math.sin(armAngle); // negative X (left)
      const lDirY = Math.cos(armAngle);   // positive Y (up)
      dummyArm.position.set(
        s.x - 0.18 + lDirX * armLen,
        shoulderY + lDirY * armLen,
        s.z
      );
      dummyArm.scale.set(0.1, 0.36, 0.1);
      dummyArm.rotation.set(0, 0, -(Math.PI / 2 - armAngle)); // tilt angle from vertical
      dummyArm.updateMatrix();
      leftArmRef.current.setMatrixAt(i, dummyArm.matrix);
      leftArmRef.current.setColorAt(i, s.skinColor);

      // RIGHT ARM: mirror
      const rDirX = Math.sin(armAngle);
      const rDirY = Math.cos(armAngle);
      dummyArm.position.set(
        s.x + 0.18 + rDirX * armLen,
        shoulderY + rDirY * armLen,
        s.z
      );
      dummyArm.scale.set(0.1, 0.36, 0.1);
      dummyArm.rotation.set(0, 0, (Math.PI / 2 - armAngle));
      dummyArm.updateMatrix();
      rightArmRef.current.setMatrixAt(i, dummyArm.matrix);
      rightArmRef.current.setColorAt(i, s.skinColor);
    });

    bodyRef.current.instanceMatrix.needsUpdate = true;
    if (bodyRef.current.instanceColor) bodyRef.current.instanceColor.needsUpdate = true;

    headRef.current.instanceMatrix.needsUpdate = true;
    if (headRef.current.instanceColor) headRef.current.instanceColor.needsUpdate = true;

    leftArmRef.current.instanceMatrix.needsUpdate = true;
    if (leftArmRef.current.instanceColor) leftArmRef.current.instanceColor.needsUpdate = true;

    rightArmRef.current.instanceMatrix.needsUpdate = true;
    if (rightArmRef.current.instanceColor) rightArmRef.current.instanceColor.needsUpdate = true;
  });

  const poolLen = 58;
  const poolStartZ = 5;

  return (
    <group>
      {/* ===== CONCRETE STAND STEPS ===== */}
      {/* Left side */}
      {Array.from({ length: rowCount }).map((_, row) => (
        <mesh
          key={`L-${row}`}
          position={[poolWidth / 2 + 1.5 + row * rowSpacing, row * 0.5 - 0.05, poolStartZ / 2 - poolLen / 2]}
          receiveShadow castShadow
        >
          <boxGeometry args={[rowSpacing * 0.94, 0.18 + row * 0.5, poolLen + 2]} />
          <meshStandardMaterial color={STAND_COLOR} roughness={0.82} />
        </mesh>
      ))}
      {/* Right side */}
      {Array.from({ length: rowCount }).map((_, row) => (
        <mesh
          key={`R-${row}`}
          position={[-(poolWidth / 2 + 1.5 + row * rowSpacing), row * 0.5 - 0.05, poolStartZ / 2 - poolLen / 2]}
          receiveShadow castShadow
        >
          <boxGeometry args={[rowSpacing * 0.94, 0.18 + row * 0.5, poolLen + 2]} />
          <meshStandardMaterial color={STAND_COLOR} roughness={0.82} />
        </mesh>
      ))}
      {/* End (behind start blocks) */}
      {Array.from({ length: rowCount }).map((_, row) => (
        <mesh
          key={`E-${row}`}
          position={[0, row * 0.5 - 0.05, poolStartZ + 2 + row * rowSpacing]}
          receiveShadow castShadow
        >
          <boxGeometry args={[poolWidth + 10 + row * 2, 0.18 + row * 0.5, rowSpacing * 0.94]} />
          <meshStandardMaterial color={STAND_COLOR} roughness={0.82} />
        </mesh>
      ))}

      {/* ===== SPECTATOR BODIES ===== */}
      <instancedMesh ref={bodyRef} args={[null, null, spectators.length]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>

      {/* ===== SPECTATOR HEADS ===== */}
      <instancedMesh ref={headRef} args={[null, null, spectators.length]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial roughness={0.5} />
      </instancedMesh>

      {/* ===== LEFT ARMS ===== */}
      <instancedMesh ref={leftArmRef} args={[null, null, spectators.length]} castShadow>
        <capsuleGeometry args={[1, 1, 4, 8]} />
        <meshStandardMaterial roughness={0.55} />
      </instancedMesh>

      {/* ===== RIGHT ARMS ===== */}
      <instancedMesh ref={rightArmRef} args={[null, null, spectators.length]} castShadow>
        <capsuleGeometry args={[1, 1, 4, 8]} />
        <meshStandardMaterial roughness={0.55} />
      </instancedMesh>
    </group>
  );
};

export default Crowd;
