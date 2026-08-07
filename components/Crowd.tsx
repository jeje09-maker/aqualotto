
// @ts-nocheck
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Crowd: React.FC<{ swimmersCount: number }> = ({ swimmersCount }) => {
  const laneWidth = 3;
  const poolWidth = swimmersCount * laneWidth + 2;
  const standDepth = 8;     // how deep the stands are (multiple rows)
  const rowCount = 6;       // rows of seats per side
  const rowSpacing = 1.1;   // space between rows (step up)
  const seatSpacing = 0.9;  // space between seats along pool

  // Head mesh ref (sphere)
  const headRef = useRef();
  // Body mesh ref (capsule/box)
  const bodyRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const SEAT_COLORS = ['#e63946', '#457b9d', '#f4d35e', '#3a86ff', '#ff6b6b', '#06d6a0', '#ffbe0b', '#8338ec'];
  const SHIRT_COLORS = ['#ff595e', '#6a4c93', '#1982c4', '#8ac926', '#ffca3a', '#ff595e', '#6a4c93', '#1982c4'];

  // Generate spectator data: position, phase, colors
  const spectators = useMemo(() => {
    const data = [];
    const poolLen = 58;
    const poolStartZ = 5;

    const addSide = (xBase: number, xSign: number) => {
      for (let row = 0; row < rowCount; row++) {
        const x = xBase + row * rowSpacing * xSign;
        const baseY = 0.5 + row * 0.5; // stepped up
        const cols = Math.floor(poolLen / seatSpacing);
        for (let c = 0; c < cols; c++) {
          const z = poolStartZ - c * seatSpacing;
          data.push({
            x, y: baseY, z,
            phase: Math.random() * Math.PI * 2,
            jumpSpeed: 2.5 + Math.random() * 4,
            jumpH: 0.06 + Math.random() * 0.12,
            seatColor: new THREE.Color(SEAT_COLORS[Math.floor(Math.random() * SEAT_COLORS.length)]),
            shirtColor: new THREE.Color(SHIRT_COLORS[Math.floor(Math.random() * SHIRT_COLORS.length)]),
          });
        }
      }
    };

    // Both sides
    addSide(poolWidth / 2 + 1.5, 1);
    addSide(-(poolWidth / 2 + 1.5), -1);

    // End stands (behind start blocks)
    for (let row = 0; row < rowCount; row++) {
      const z = poolStartZ + 2 + row * rowSpacing;
      const baseY = 0.5 + row * 0.5;
      const cols = Math.floor((poolWidth + 10 + row * 2) / seatSpacing);
      for (let c = 0; c < cols; c++) {
        const x = -((poolWidth + 10 + row * 2) / 2) + c * seatSpacing;
        data.push({
          x, y: baseY, z,
          phase: Math.random() * Math.PI * 2,
          jumpSpeed: 2.5 + Math.random() * 4,
          jumpH: 0.06 + Math.random() * 0.12,
          seatColor: new THREE.Color(SEAT_COLORS[Math.floor(Math.random() * SEAT_COLORS.length)]),
          shirtColor: new THREE.Color(SHIRT_COLORS[Math.floor(Math.random() * SHIRT_COLORS.length)]),
        });
      }
    }

    return data;
  }, [poolWidth]);

  // Two instanced meshes: body (box) and head (sphere)
  useFrame((state) => {
    if (!bodyRef.current || !headRef.current) return;
    const t = state.clock.getElapsedTime();

    spectators.forEach((s, i) => {
      const jump = Math.max(0, Math.sin(t * s.jumpSpeed + s.phase)) * s.jumpH;

      // Body (torso)
      dummy.position.set(s.x, s.y + jump, s.z);
      dummy.scale.set(0.35, 0.45, 0.28);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      bodyRef.current.setMatrixAt(i, dummy.matrix);
      bodyRef.current.setColorAt(i, s.shirtColor);

      // Head (sphere, slightly above body)
      dummy.position.set(s.x, s.y + 0.38 + jump, s.z);
      dummy.scale.set(0.22, 0.24, 0.22);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      headRef.current.setMatrixAt(i, dummy.matrix);
      headRef.current.setColorAt(i, new THREE.Color('#f5c99a'));
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
      {/* === STAND STRUCTURE (concrete steps) === */}
      {/* Left side stands */}
      {Array.from({ length: rowCount }).map((_, row) => (
        <mesh
          key={`stand-L-${row}`}
          position={[poolWidth / 2 + 1.5 + row * rowSpacing, row * 0.5 - 0.05, poolStartZ / 2 - poolLen / 2]}
          castShadow receiveShadow
        >
          <boxGeometry args={[rowSpacing * 0.95, 0.2 + row * 0.5, poolLen + 2]} />
          <meshStandardMaterial color="#2b3a42" roughness={0.8} />
        </mesh>
      ))}
      {/* Right side stands */}
      {Array.from({ length: rowCount }).map((_, row) => (
        <mesh
          key={`stand-R-${row}`}
          position={[-(poolWidth / 2 + 1.5 + row * rowSpacing), row * 0.5 - 0.05, poolStartZ / 2 - poolLen / 2]}
          castShadow receiveShadow
        >
          <boxGeometry args={[rowSpacing * 0.95, 0.2 + row * 0.5, poolLen + 2]} />
          <meshStandardMaterial color="#2b3a42" roughness={0.8} />
        </mesh>
      ))}
      {/* End stands (start block side) */}
      {Array.from({ length: rowCount }).map((_, row) => (
        <mesh
          key={`stand-E-${row}`}
          position={[0, row * 0.5 - 0.05, poolStartZ + 2 + row * rowSpacing]}
          castShadow receiveShadow
        >
          <boxGeometry args={[poolWidth + 10 + row * 2, 0.2 + row * 0.5, rowSpacing * 0.95]} />
          <meshStandardMaterial color="#2b3a42" roughness={0.8} />
        </mesh>
      ))}

      {/* === SPECTATOR BODIES === */}
      <instancedMesh ref={bodyRef} args={[null, null, spectators.length]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.6} metalness={0.05} />
      </instancedMesh>

      {/* === SPECTATOR HEADS === */}
      <instancedMesh ref={headRef} args={[null, null, spectators.length]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshStandardMaterial roughness={0.5} />
      </instancedMesh>
    </group>
  );
};

export default Crowd;
