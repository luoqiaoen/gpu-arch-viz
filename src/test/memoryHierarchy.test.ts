import { describe, it, expect } from 'vitest';
import { hierarchyForCard } from '../data/memoryHierarchy';
import { GPU_MAP } from '../data/gpus';

describe('memoryHierarchy', () => {
  it('Hopper hierarchy ends in HBM3', () => {
    const rungs = hierarchyForCard(GPU_MAP['h100-sxm']);
    expect(rungs.some((r) => r.level.includes('HBM3'))).toBe(true);
  });

  it('Ada hierarchy ends in GDDR6', () => {
    const rungs = hierarchyForCard(GPU_MAP['l20']);
    expect(rungs.some((r) => r.level.includes('GDDR6'))).toBe(true);
  });

  it('every rung has level, capacity, bandwidth, latency', () => {
    const rungs = hierarchyForCard(GPU_MAP['mi300x']);
    for (const r of rungs) {
      expect(r.level).toBeTruthy();
      expect(r.capacity).toBeTruthy();
      expect(r.bandwidth).toBeTruthy();
      expect(r.latency).toBeTruthy();
    }
  });

  it('every rung has bwNumGBps (number or null) and latencyNs (number)', () => {
    const rungs = hierarchyForCard(GPU_MAP['h100-sxm']);
    for (const r of rungs) {
      expect('bwNumGBps' in r).toBe(true);
      expect(typeof r.latencyNs).toBe('number');
    }
  });

  it('L2 and external rungs have non-null bwNumGBps', () => {
    const rungs = hierarchyForCard(GPU_MAP['h100-sxm']);
    const l2 = rungs.find((r) => r.level.includes('L2'))!;
    expect(l2.bwNumGBps).not.toBeNull();
    const hbm = rungs.find((r) => r.level.includes('HBM'))!;
    expect(hbm.bwNumGBps).not.toBeNull();
  });
});
