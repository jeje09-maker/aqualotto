// @ts-nocheck
// Fix: Suppress JSX intrinsic element type errors for Three.js components (group, mesh, meshStandardMaterial, etc.)
import React, { useMemo } from 'react';
import * as THREE from 'three';

const Terrain: React.FC = () => {
  const mountainGeom = useMemo(() => {
    const width = 150;
    const depth = 600;
    const segments = 60;
    const geom = new THREE.PlaneGeometry(width, depth, segments, segments);
    
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      
      const distFromCenter = Math.abs(x);
      let h = 0;
      if (distFromCenter > 25) {
        // Canyon walls
        h = Math.pow(distFromCenter - 25, 1.2) * 1.5;
        // Turbulence noise
        h += Math.sin(y * 0.05) * 6 + Math.cos(x * 0.1) * 4;
      } else {
        // Smooth valley floor
        h = Math.sin(y * 0.1) * 1.5;
      }
      
      pos.setZ(i, h);
    }
    geom.computeVertexNormals();
    return geom;
  }, []);

  return (
    <group rotation-x={-Math.PI / 2} position={[0, -0.5, -150]}>
      <mesh geometry={mountainGeom} receiveShadow>
        <meshStandardMaterial 
          color="#1a2e1a" 
          roughness={1} 
          flatShading 
        />
      </mesh>
      {/* Wireframe overlay for techy look */}
      <mesh geometry={mountainGeom} position={[0, 0, 0.05]}>
        <meshStandardMaterial 
          color="#4ecca3" 
          wireframe 
          transparent 
          opacity={0.05} 
        />
      </mesh>
    </group>
  );
};

export default Terrain;