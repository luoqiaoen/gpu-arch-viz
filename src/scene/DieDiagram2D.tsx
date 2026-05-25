import { useState } from 'react';
import type { GpuSpec, BlockKind } from '../data/gpus';
import type { WorkloadId } from '../data/workloads';
import { isBlockActive } from '../data/workloads';
import { blockColor } from './blockColors';
import { generateDieLayouts2D, type Block2D } from '../lib/dieLayout2D';

const DIE_SIZE = 10;

const BLOCK_ABBREV: Record<BlockKind, string> = {
  'compute-cluster': 'CU',
  tensor: 'TC',
  l2: 'L2',
  memCtrl: 'MC',
  hbm: 'HBM',
  gddr: 'GDDR',
  interconnect: 'Link',
};

interface Props {
  spec: GpuSpec;
  workload: WorkloadId;
  activeBlockId: string | null;
  onSelect: (id: string | null) => void;
}

function BlockRect({
  block, active, isSelected, onSelect,
}: {
  block: Block2D;
  active: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const fill = blockColor(block.kind, active);
  // SVG y-axis is top-down; die layout is y-up — flip the coordinate
  const svgY = DIE_SIZE - block.y - block.height;
  const showLabel = !block.isSmCell && block.width > 0.9 && block.height > 0.35;

  const stroke = isSelected
    ? '#ffffff'
    : block.mfmaIntegrated
    ? '#f85149'
    : 'none';
  const strokeWidth = isSelected ? 0.07 : block.mfmaIntegrated ? 0.04 : 0;
  const strokeOpacity = isSelected ? 1 : 0.5;

  return (
    <g onClick={() => onSelect(block.id)} style={{ cursor: 'pointer' }}>
      <title>{block.label}</title>
      <rect
        x={block.x}
        y={svgY}
        width={block.width}
        height={block.height}
        fill={fill}
        fillOpacity={active ? 0.85 : 0.6}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeOpacity={strokeOpacity}
      />
      {showLabel && (
        <text
          x={block.x + block.width / 2}
          y={svgY + block.height / 2 + 0.15}
          textAnchor="middle"
          fontSize="0.4"
          fill={active ? '#e6edf3' : '#8b949e'}
          fontFamily="monospace"
          pointerEvents="none"
        >
          {BLOCK_ABBREV[block.kind]}
        </text>
      )}
    </g>
  );
}

export function DieDiagram2D({ spec, workload, activeBlockId, onSelect }: Props) {
  const [activeDie, setActiveDie] = useState(0);
  const layouts = generateDieLayouts2D(spec);
  const layout = layouts[Math.min(activeDie, layouts.length - 1)];

  const smCount = layout.blocks.filter((b) => b.isSmCell && b.kind === 'compute-cluster').length;
  const unitLabel = spec.vendor === 'nvidia' ? 'SMs' : 'CUs';

  return (
    <div className="flex flex-col">
      {/* Card header */}
      <div className="font-mono text-xs px-2 py-1 flex items-baseline gap-2 shrink-0 border-b border-edge">
        <span className={spec.vendor === 'nvidia' ? 'text-nvidia' : 'text-amd'}>{spec.name}</span>
        <span className="text-muted">{spec.arch}</span>
        <span className="text-muted">{smCount} {unitLabel}/die</span>
      </div>

      {/* Die / XCD layer tabs — only for multi-die GPUs */}
      {layouts.length > 1 && (
        <div className="flex border-b border-edge shrink-0 overflow-x-auto">
          {layouts.map((l, i) => (
            <button
              key={i}
              onClick={() => setActiveDie(i)}
              className={`font-mono text-[10px] px-2 py-0.5 border-r border-edge whitespace-nowrap ${
                i === activeDie
                  ? 'text-primary bg-surface'
                  : 'text-muted hover:text-primary'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}

      {/* SVG die diagram — padding-bottom: 100% keeps it square */}
      <div className="relative w-full" style={{ paddingBottom: '100%' }}>
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 10 10"
          style={{ background: '#0d1117' }}
        >
          {layout.blocks.map((block) => (
            <BlockRect
              key={block.id}
              block={block}
              active={isBlockActive(block.kind, workload)}
              isSelected={block.id === activeBlockId}
              onSelect={onSelect}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
