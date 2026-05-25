import type { GpuSpec, BlockKind, DieBlockSpec } from '../data/gpus';

export const DIE_SIZE = 10;

export interface Block3D {
  id: string;
  kind: BlockKind;
  label: string;
  x: number;          // left edge in die space (0..DIE_SIZE)
  y: number;          // bottom edge in die space (0..DIE_SIZE)
  width: number;      // x extent
  height: number;     // y extent (depth in floor plan)
  blockHeight: number; // extruded height above die plane
  mfmaIntegrated: boolean;
  clusterIndex?: number;
}

export interface DieLayout {
  dieIndex: number;
  blocks: Block3D[];
  totalWidth: number;
  totalHeight: number;
}

const BLOCK_HEIGHT: Record<BlockKind, number> = {
  'compute-cluster': 0.5,
  tensor: 0.5,
  l2: 0.35,
  memCtrl: 0.25,
  hbm: 0.45,
  gddr: 0.45,
  interconnect: 0.3,
};

const PAD = 0.05;

export function generateDieLayouts(spec: GpuSpec): DieLayout[] {
  switch (spec.topology) {
    case 'monolithic':
      return [layoutSingleDie(spec, 0)];
    case 'dual-die':
      return [layoutSingleDie(spec, 0), layoutSingleDie(spec, 1)];
    case 'chiplet':
      return Array.from({ length: spec.chipletCount ?? 8 }, (_, i) => layoutChipletXcd(spec, i));
  }
}

function layoutSingleDie(spec: GpuSpec, dieIndex: number): DieLayout {
  const blocks: Block3D[] = [];
  let uid = 0;
  const push = (
    kind: BlockKind, x: number, y: number, w: number, h: number, label: string,
    extra: Partial<Block3D> = {},
  ) => {
    blocks.push({
      id: `${spec.id}-d${dieIndex}-${kind}-${uid++}`,
      kind, label, x, y, width: w, height: h,
      blockHeight: BLOCK_HEIGHT[kind], mfmaIntegrated: false, ...extra,
    });
  };

  const find = (k: BlockKind) => spec.die.find((b) => b.kind === k);
  const memSpec = find('hbm') ?? find('gddr');
  const l2Spec = find('l2');
  const ctrlSpec = find('memCtrl');
  const intSpec = find('interconnect');
  const compSpec = find('compute-cluster');
  const tensSpec = find('tensor');

  const MEM_W = memSpec ? 1.1 : 0;
  const INTER_H = intSpec ? 0.6 : 0;
  const CTRL_H = ctrlSpec ? 0.5 : 0;
  const L2_H = l2Spec ? 1.0 : 0;

  const innerL = MEM_W;
  const innerR = DIE_SIZE - MEM_W;
  const innerW = innerR - innerL;
  const innerB = INTER_H + CTRL_H;
  const innerT = DIE_SIZE - L2_H;
  const innerH = innerT - innerB;

  // Memory stacks split across left and right edges
  if (memSpec) {
    const leftN = Math.ceil(memSpec.count / 2);
    const rightN = memSpec.count - leftN;
    const lh = (DIE_SIZE - PAD * 2) / leftN;
    for (let i = 0; i < leftN; i++) {
      push(memSpec.kind, PAD, PAD + i * lh, MEM_W - PAD * 2, lh - PAD, memSpec.label);
    }
    if (rightN > 0) {
      const rh = (DIE_SIZE - PAD * 2) / rightN;
      for (let i = 0; i < rightN; i++) {
        push(memSpec.kind, DIE_SIZE - MEM_W + PAD, PAD + i * rh, MEM_W - PAD * 2, rh - PAD, memSpec.label);
      }
    }
  }

  // Interconnect bottom strip
  if (intSpec) {
    push('interconnect', innerL + PAD, PAD, innerW - PAD * 2, INTER_H - PAD, intSpec.label);
  }

  // Memory controllers
  if (ctrlSpec) {
    const cw = (innerW - PAD * 2) / ctrlSpec.count;
    for (let i = 0; i < ctrlSpec.count; i++) {
      push('memCtrl', innerL + PAD + i * cw, INTER_H + PAD, cw - PAD, CTRL_H - PAD * 2, ctrlSpec.label);
    }
  }

  // L2 top strip
  if (l2Spec) {
    push('l2', innerL + PAD, innerT + PAD, innerW - PAD * 2, L2_H - PAD * 2, l2Spec.label);
  }

  // Compute clusters interior grid (+ tensor sliver for NVIDIA)
  if (compSpec) {
    placeComputeGrid(compSpec, tensSpec, innerL, innerB, innerW, innerH, push);
  }

  return { dieIndex, blocks, totalWidth: DIE_SIZE, totalHeight: DIE_SIZE };
}

function placeComputeGrid(
  compSpec: DieBlockSpec,
  tensSpec: DieBlockSpec | undefined,
  ox: number, oy: number, w: number, h: number,
  push: (kind: BlockKind, x: number, y: number, w: number, h: number, label: string, extra?: Partial<Block3D>) => void,
) {
  const cols = compSpec.count <= 4 ? compSpec.count : Math.ceil(Math.sqrt(compSpec.count));
  const rows = Math.ceil(compSpec.count / cols);
  const cellW = w / cols;
  const cellH = h / rows;
  const tFrac = tensSpec ? 0.22 : 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (idx >= compSpec.count) break;
      const cx = ox + c * cellW;
      const cy = oy + r * cellH;
      push(
        'compute-cluster', cx + PAD, cy + PAD,
        cellW * (1 - tFrac) - PAD * 2, cellH - PAD * 2,
        `${compSpec.label} [${idx}]`,
        { mfmaIntegrated: compSpec.mfmaIntegrated ?? false, clusterIndex: idx },
      );
      if (tensSpec && tFrac > 0) {
        push(
          'tensor', cx + cellW * (1 - tFrac) + PAD * 0.5, cy + PAD,
          cellW * tFrac - PAD * 1.5, cellH - PAD * 2,
          `${tensSpec.label} [${idx}]`,
        );
      }
    }
  }
}

// Chiplet XCD: a compact die with compute clusters + an L2 strip + an HBM stack edge.
function layoutChipletXcd(spec: GpuSpec, dieIndex: number): DieLayout {
  const blocks: Block3D[] = [];
  let uid = 0;
  const push = (
    kind: BlockKind, x: number, y: number, w: number, h: number, label: string, extra: Partial<Block3D> = {},
  ) => {
    blocks.push({
      id: `${spec.id}-xcd${dieIndex}-${kind}-${uid++}`,
      kind, label, x, y, width: w, height: h,
      blockHeight: BLOCK_HEIGHT[kind], mfmaIntegrated: false, ...extra,
    });
  };

  const hbmSpec = spec.die.find((b) => b.kind === 'hbm');
  const compSpec = spec.die.find((b) => b.kind === 'compute-cluster');
  const l2Spec = spec.die.find((b) => b.kind === 'l2');

  // One HBM stack per XCD along the bottom edge
  if (hbmSpec) {
    push('hbm', PAD, PAD, DIE_SIZE - PAD * 2, 1.0, hbmSpec.label);
  }
  // L2 strip
  if (l2Spec) {
    push('l2', PAD, DIE_SIZE - 0.8, DIE_SIZE - PAD * 2, 0.7, l2Spec.label);
  }
  // Compute clusters fill the middle (~38 CUs per XCD shown as a 3x3 tile grid)
  if (compSpec) {
    const innerB = 1.0 + PAD;
    const innerT = DIE_SIZE - 0.9;
    placeComputeGrid(
      { ...compSpec, count: 9, label: `XCD ${dieIndex} CUs` },
      undefined,
      PAD, innerB, DIE_SIZE - PAD * 2, innerT - innerB, push,
    );
  }

  return { dieIndex, blocks, totalWidth: DIE_SIZE, totalHeight: DIE_SIZE };
}
