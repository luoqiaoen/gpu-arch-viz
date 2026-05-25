import { describe, it, expect } from 'vitest';
import { GPU_SPECS, GPU_MAP } from '../data/gpus';

describe('GPU_SPECS', () => {
  it('contains all 9 cards', () => {
    expect(GPU_SPECS.map((g) => g.id).sort()).toEqual(
      ['h100-sxm', 'l20', 'mi210', 'mi250', 'mi300x', 'rtx-pro-4500', 'rtx-pro-6000', 'w7800', 'w7900'].sort(),
    );
  });

  it('die areaWeights sum to ~100 for every card', () => {
    for (const g of GPU_SPECS) {
      const sum = g.die.reduce((a, b) => a + b.areaWeight, 0);
      expect(sum, `${g.id} areaWeight sum`).toBeGreaterThanOrEqual(95);
      expect(sum, `${g.id} areaWeight sum`).toBeLessThanOrEqual(105);
    }
  });

  it('NVIDIA cards have a dedicated tensor block; AMD cards do not', () => {
    for (const g of GPU_SPECS) {
      const hasTensor = g.die.some((b) => b.kind === 'tensor');
      if (g.vendor === 'nvidia') expect(hasTensor, `${g.id}`).toBe(true);
      else expect(hasTensor, `${g.id}`).toBe(false);
    }
  });

  it('AMD compute clusters are MFMA-integrated', () => {
    for (const g of GPU_SPECS.filter((g) => g.vendor === 'amd')) {
      const cc = g.die.find((b) => b.kind === 'compute-cluster');
      expect(cc?.mfmaIntegrated, `${g.id}`).toBe(true);
    }
  });

  it('consumer-lineage NVIDIA cards have crippled FP64 (ratio < 0.05)', () => {
    for (const id of ['l20', 'rtx-pro-6000', 'rtx-pro-4500']) {
      expect(GPU_MAP[id].throughput.fp64Ratio).toBeLessThan(0.05);
    }
  });

  it('AMD CDNA2 cards have true 1:1 FP64:FP32', () => {
    for (const id of ['mi210', 'mi250']) {
      expect(GPU_MAP[id].throughput.fp64Ratio).toBe(1.0);
    }
  });

  it('GPU_MAP indexes every spec by id', () => {
    expect(Object.keys(GPU_MAP).length).toBe(GPU_SPECS.length);
    expect(GPU_MAP['h100-sxm'].name).toBe('H100 SXM');
  });
});
