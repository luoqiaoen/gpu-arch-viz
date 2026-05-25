import { useMemo } from 'react';
import type { GpuSpec } from '../data/gpus';
import { generateDieLayouts, DIE_SIZE } from '../lib/dieLayout';
import { isBlockActive, type WorkloadId } from '../data/workloads';
import { FunctionalBlock } from './FunctionalBlock';

interface Props {
  spec: GpuSpec;
  workload: WorkloadId;
  activeBlockId: string | null;
  onSelect: (id: string) => void;
}

const DIE_GAP = 1.5;

export function DieMesh({ spec, workload, activeBlockId, onSelect }: Props) {
  const layouts = useMemo(() => generateDieLayouts(spec), [spec]);

  // Arrange multiple dies (dual-die / chiplet) in a row or grid centered on origin.
  const cols = layouts.length <= 2 ? layouts.length : 4;
  const rows = Math.ceil(layouts.length / cols);
  const stepX = DIE_SIZE + DIE_GAP;
  const stepZ = DIE_SIZE + DIE_GAP;
  const originX = -((cols - 1) * stepX) / 2;
  const originZ = -((rows - 1) * stepZ) / 2;

  return (
    <group>
      {/* Vendor-tinted substrate label plane under the whole package */}
      {layouts.map((layout, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const dx = originX + c * stepX;
        const dz = originZ + r * stepZ;
        return (
          <group key={layout.dieIndex} position={[dx - DIE_SIZE / 2, 0, dz - DIE_SIZE / 2]}>
            {/* substrate */}
            <mesh position={[DIE_SIZE / 2, -0.1, DIE_SIZE / 2]}>
              <boxGeometry args={[DIE_SIZE + 0.2, 0.15, DIE_SIZE + 0.2]} />
              <meshStandardMaterial color={spec.vendor === 'nvidia' ? '#0c1f12' : '#1f0c0c'} />
            </mesh>
            {layout.blocks.map((block) => (
              <FunctionalBlock
                key={block.id}
                block={block}
                active={isBlockActive(block.kind, workload)}
                selected={block.id === activeBlockId}
                onSelect={onSelect}
              />
            ))}
          </group>
        );
      })}
    </group>
  );
}
