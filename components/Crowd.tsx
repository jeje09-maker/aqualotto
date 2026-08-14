// @ts-nocheck
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Crowd: React.FC<{ swimmersCount: number }> = ({ swimmersCount }) => {
  const laneWidth = swimmersCount > 15 ? 2.2 : 3;
  const poolWidth = swimmersCount * laneWidth + 2;
  const rowCount = 5;
  const rowSpacing = 1.2;
  const seatSpacing = 1.0;

  const bodyRef = useRef<THREE.InstancedMesh>();
  const headRef = useRef<THREE.InstancedMesh>();

  const dummy = useMemo(() => new THREE.Object3D(), []);

  const SHIRT_COLORS = [
    '#e63946', '#457b9d', '#f4d35e', '#3a86ff', '#ff6b6b',
    '#06d6a0', '#ffbe0b', '#8338ec', '#ff9f1c', '#2ec4b6'
  ];
  const SKIN_COLORS = ['#f5c99a', '#e8a87c', '#c68642', '#8d5524', '#fddbb4'];
  const STAND_COLOR = '#1e293b';

  const spectators = useMemo(() => {
    const data: any[] = [];
    const poolLen = 58;
    const poolStartZ = 5;

    const push = (x: number, y: number, z: number) => {
      data.push({
        x, y, z,
        phase: Math.random() * Math.PI * 2,
        cheerSpeed: 1.8 + Math.random() * 2.2,
        bounceH: 0.08 + Math.random() * 0.12,
        shirtColor: new THREE.Color(SHIRT_COLORS[Math.floor(Math.random() * SHIRT_COLORS.length)]),
        skinColor: new THREE.Color(SKIN_COLORS[Math.floor(Math.random() * SKIN_COLORS.length)]),
      });
    };

    // Side stands (left and right)
    for (const xSign of [1, -1]) {
      for (let row = 0; row < rowCount; row++) {
        const x = (poolWidth / 2 + 1.8 + row * rowSpacing) * xSign;
        const baseY = 0.5 + row * 0.55;
        const cols = Math.floor(poolLen / seatSpacing);
        for (let c = 0; c < cols; c++) {
          push(x, baseY, poolStartZ - c * seatSpacing);
        }
      }
    }

    // End stands (behind start blocks)
    for (let row = 0; row < rowCount; row++) {
      const z = poolStartZ + 2.5 + row * rowSpacing;
      const baseY = 0.5 + row * 0.55;
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
    if (!bodyRef.current || !headRef.current) return;
    const t = state.clock.getElapsedTime();

    spectators.forEach((s, i) => {
      // Clean rhythmic up-down bounce (no chaotic arms)
      const bounce = Math.sin(t * s.cheerSpeed + s.phase) * s.bounceH;
      const curY = s.y + Math.max(0, bounce);

      // --- TORSO ---
      dummy.position.set(s.x, curY + 0.2, s.z);
      dummy.scale.set(0.32, 0.44, 0.28);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      bodyRef.current.setMatrixAt(i, dummy.matrix);
      bodyRef.current.setColorAt(i, s.shirtColor);

      // --- HEAD ---
      dummy.position.set(s.x, curY + 0.52, s.z);
      dummy.scale.set(0.22, 0.24, 0.22);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      headRef.current.setMatrixAt(i, dummy.matrix);
      headRef.current.setColorAt(i, s.skinColor);
    });

    bodyRef.current.instanceMatrix.needsUpdate = true;
    if (bodyRef.current.instanceColor) bodyRef.current.instanceColor.needsUpdate = true;

    headRef.current.instanceMatrix.needsUpdate = true;
    if (headRef.current.instanceColor) headRef.current.instanceColor.needsUpdate = true;
  });

  const poolLen = 58;
  const poolStartZ = 5;

  return (
    <group>
      {/* Stand steps */}
      {Array.from({ length: rowCount }).map((_, row) => (
        <mesh
          key={`L-${row}`}
          position={[poolWidth / 2 + 1.8 + row * rowSpacing, row * 0.55 - 0.05, poolStartZ / 2 - poolLen / 2]}
          receiveShadow castShadow
        >
          <boxGeometry args={[rowSpacing * 0.94, 0.2 + row * 0.55, poolLen + 2]} />
          <meshStandardMaterial color={STAND_COLOR} roughness={0.8} />
        </mesh>
      ))}
      {Array.from({ length: rowCount }).map((_, row) => (
        <mesh
          key={`R-${row}`}
          position={[-(poolWidth / 2 + 1.8 + row * rowSpacing), row * 0.55 - 0.05, poolStartZ / 2 - poolLen / 2]}
          receiveShadow castShadow
        >
          <boxGeometry args={[rowSpacing * 0.94, 0.2 + row * 0.55, poolLen + 2]} />
          <meshStandardMaterial color={STAND_COLOR} roughness={0.8} />
        </mesh>
      ))}
      {Array.from({ length: rowCount }).map((_, row) => (
        <mesh
          key={`E-${row}`}
          position={[0, row * 0.55 - 0.05, poolStartZ + 2.5 + row * rowSpacing]}
          receiveShadow castShadow
        >
          <boxGeometry args={[poolWidth + 10 + row * 2, 0.2 + row * 0.55, rowSpacing * 0.94]} />
          <meshStandardMaterial color={STAND_COLOR} roughness={0.8} />
        </mesh>
      ))}

      {/* Spectator Torsos */}
      <instancedMesh ref={bodyRef} args={[null, null, spectators.length]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>

      {/* Spectator Heads */}
      <instancedMesh ref={headRef} args={[null, null, spectators.length]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshStandardMaterial roughness={0.5} />
      </instancedMesh>
    </group>
  );
};

export default Crowd;
