import type { GpuSpec, BlockKind } from '../data/gpus';
import { generateDieLayouts, type Block3D } from './dieLayout';

export interface Block2D {
  id: string;
  kind: BlockKind;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  mfmaIntegrated: boolean;
  isSmCell: boolean;
  smIndex?: number;
}

export interface DieLayout2D {
  dieIndex: number;
  label: string; // '' for monolithic, 'Die 0/1' for dual-die, 'XCD 0..7' for chiplet
  blocks: Block2D[];
}

const SM_PAD = 0.025;

export function generateDieLayouts2D(spec: GpuSpec): DieLayout2D[] {
  const layouts3D = generateDieLayouts(spec);

  const smsPerDie =
    spec.topology === 'chiplet'
      ? Math.round(spec.computeUnits / (spec.chipletCount ?? 8))
      : spec.topology === 'dual-die'
      ? Math.round(spec.computeUnits / 2)
      : spec.computeUnits;

  return layouts3D.map((layout) => {
    const label =
      spec.topology === 'chiplet' ? `XCD ${layout.dieIndex}` :
      spec.topology === 'dual-die' ? `Die ${layout.dieIndex}` : '';

    // Use same ID prefix format as dieLayout.ts so BlockInspector parseBlockId still works
    const idPrefix =
      spec.topology === 'chiplet'
        ? `${spec.id}-xcd${layout.dieIndex}`
        : `${spec.id}-d${layout.dieIndex}`;

    const structural: Block2D[] = layout.blocks
      .filter(b => b.kind !== 'compute-cluster' && b.kind !== 'tensor')
      .map(b => ({ ...b, isSmCell: false }));

    const compBlocks = layout.blocks.filter(b => b.kind === 'compute-cluster');
    const smCells = compBlocks.length > 0
      ? expandToSmCells(compBlocks, smsPerDie, spec.vendor === 'nvidia', idPrefix)
      : [];

    return { dieIndex: layout.dieIndex, label, blocks: [...structural, ...smCells] };
  });
}

function expandToSmCells(
  compBlocks: Block3D[],
  smCount: number,
  hasTensor: boolean,
  idPrefix: string,
): Block2D[] {
  // Compute bounding box of all compute-cluster blocks in this die
  const minX = Math.min(...compBlocks.map(b => b.x));
  const minY = Math.min(...compBlocks.map(b => b.y));
  const maxX = Math.max(...compBlocks.map(b => b.x + b.width));
  const maxY = Math.max(...compBlocks.map(b => b.y + b.height));
  const areaW = maxX - minX;
  const areaH = maxY - minY;
  const mfmaIntegrated = compBlocks[0]?.mfmaIntegrated ?? false;
  const tFrac = hasTensor ? 0.22 : 0;

  const cols = smCount <= 4 ? smCount : Math.ceil(Math.sqrt(smCount));
  const rows = Math.ceil(smCount / cols);
  const cellW = areaW / cols;
  const cellH = areaH / rows;

  const cells: Block2D[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (idx >= smCount) break;
      const bx = minX + c * cellW;
      const by = minY + r * cellH;
      const label = hasTensor ? `SM ${idx}` : `CU ${idx}`;

      // SM / CU cell — ID format matches dieLayout.ts so BlockInspector works
      cells.push({
        id: `${idPrefix}-compute-cluster-${idx}`,
        kind: 'compute-cluster',
        label,
        x: bx + SM_PAD,
        y: by + SM_PAD,
        width: cellW * (1 - tFrac) - SM_PAD * 2,
        height: cellH - SM_PAD * 2,
        mfmaIntegrated,
        isSmCell: true,
        smIndex: idx,
      });

      // Tensor core sliver per SM (NVIDIA only)
      if (hasTensor) {
        cells.push({
          id: `${idPrefix}-tensor-${idx}`,
          kind: 'tensor',
          label: `TC ${idx}`,
          x: bx + cellW * (1 - tFrac) + SM_PAD * 0.5,
          y: by + SM_PAD,
          width: cellW * tFrac - SM_PAD * 1.5,
          height: cellH - SM_PAD * 2,
          mfmaIntegrated: false,
          isSmCell: true,
          smIndex: idx,
        });
      }
    }
  }
  return cells;
}
