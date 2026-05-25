import { useRef, useState } from 'react';
import { type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Mesh } from 'three';
import type { Block3D } from '../lib/dieLayout';
import { blockColor } from './blockColors';

interface Props {
  block: Block3D;
  active: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function FunctionalBlock({ block, active, selected, onSelect }: Props) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const color = blockColor(block.kind, active);
  const opacity = active ? 1 : 0.32;

  // Die plane is XZ; block extrudes up in Y.
  const cx = block.x + block.width / 2;
  const cz = block.y + block.height / 2;
  const hy = block.blockHeight / 2;

  return (
    <group>
      <mesh
        ref={meshRef}
        position={[cx, hy, cz]}
        scale={hovered || selected ? 1.04 : 1}
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(block.id); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <boxGeometry args={[block.width, block.blockHeight, block.height]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          emissive={selected ? color : '#000000'}
          emissiveIntensity={selected ? 0.4 : 0}
        />
      </mesh>
      {hovered && (
        <Html position={[cx, block.blockHeight + 0.3, cz]} center distanceFactor={18}>
          <div className="font-mono text-[10px] px-1.5 py-0.5 bg-surface border border-edge text-primary whitespace-nowrap rounded pointer-events-none">
            {block.label}
          </div>
        </Html>
      )}
    </group>
  );
}
