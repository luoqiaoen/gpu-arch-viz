import { describe, it, expect } from 'vitest';
import { describeBlock } from '../lib/blockInfo';
import { GPU_MAP } from '../data/gpus';

describe('describeBlock', () => {
  it('flags an idle tensor block as wasted die area', () => {
    const info = describeBlock(GPU_MAP['h100-sxm'], 'tensor', 'fp64-sim');
    expect(info.active).toBe(false);
    expect(info.dieAreaPct).toBeGreaterThan(0);
    expect(info.note.toLowerCase()).toContain('idle');
  });

  it('reports an active compute cluster for fp32 imaging', () => {
    const info = describeBlock(GPU_MAP['mi210'], 'compute-cluster', 'fp32-imaging');
    expect(info.active).toBe(true);
  });

  it('returns the die area percentage from the spec areaWeight', () => {
    const info = describeBlock(GPU_MAP['h100-sxm'], 'tensor', 'matmul-training');
    expect(info.dieAreaPct).toBe(18); // H100 tensor areaWeight
  });
});
