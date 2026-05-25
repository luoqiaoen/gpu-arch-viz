import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore, selectedSpecIds } from '../store/useAppStore';
import { GPU_MAP, type GpuSpec } from '../data/gpus';

const MAX_BW = 5300; // MI300X
const PARTICLES = 120;
const SPAN = 3.2; // z distance from memory to compute

function Stream({ spec, x }: { spec: GpuSpec; x: number }) {
  const ref = useRef<THREE.Points>(null);
  const bwFrac = spec.memory.bandwidthGBs / MAX_BW;
  const speed = 0.012 + bwFrac * 0.06;
  const count = Math.max(8, Math.round(bwFrac * PARTICLES));
  const color = spec.vendor === 'nvidia' ? '#3fb950' : '#f85149';

  const positions = useMemo(() => {
    const arr = new Float32Array(PARTICLES * 3);
    for (let i = 0; i < PARTICLES; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 1.6;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 0.6;
      arr[i * 3 + 2] = -SPAN / 2 + Math.random() * SPAN;
    }
    return arr;
  }, []);

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  useFrame(() => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < PARTICLES; i++) {
      if (i >= count) { pos[i * 3 + 1] = 999; continue; } // park inactive particles offscreen
      const z = pos[i * 3 + 2];
      const inGate = z > SPAN / 2 - 0.6; // queue near the compute gate
      pos[i * 3 + 2] += speed * (inGate ? 0.35 : 1);
      if (pos[i * 3 + 2] > SPAN / 2) {
        pos[i * 3 + 2] = -SPAN / 2;
        pos[i * 3] = (Math.random() - 0.5) * 1.6;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 0.6;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, 0, -SPAN / 2]}>
        <boxGeometry args={[2, 0.8, 0.3]} />
        <meshStandardMaterial color={spec.memory.type.startsWith('HBM') ? '#143a4d' : '#3a2350'} />
      </mesh>
      <mesh position={[0, 0, SPAN / 2]}>
        <boxGeometry args={[2, 0.8, 0.3]} />
        <meshStandardMaterial color={spec.vendor === 'nvidia' ? '#1f3d2a' : '#3a1c1c'} />
      </mesh>
      <points ref={ref} geometry={geom}>
        <pointsMaterial size={0.07} color={color} transparent opacity={0.85} />
      </points>
      <Text position={[0, -0.8, -SPAN / 2]} fontSize={0.28} color="#8b949e" anchorX="center">
        {spec.memory.type} {spec.memory.bandwidthGBs} GB/s
      </Text>
      <Text position={[0, 0.9, 0]} fontSize={0.26} color="#c9d1d9" anchorX="center">
        {spec.name}
      </Text>
    </group>
  );
}

export function MemoryFlow() {
  const { selectedCards } = useAppStore();
  const specs = selectedSpecIds(selectedCards).map((id) => GPU_MAP[id]).filter(Boolean);
  const step = 4;
  const originX = -((specs.length - 1) * step) / 2;

  return (
    <div className="h-full w-full">
      <Canvas camera={{ position: [0, 1.5, 6.5], fov: 45 }} className="bg-bg">
        <ambientLight intensity={0.6} />
        <directionalLight position={[4, 6, 5]} intensity={0.5} />
        {specs.map((spec, i) => (
          <Stream key={spec.id} spec={spec} x={originX + i * step} />
        ))}
      </Canvas>
    </div>
  );
}
