import { describe, it, expect } from 'vitest';
import { WORKLOADS, computeUtilization, isBlockActive, type WorkloadId } from '../data/workloads';
import { GPU_MAP } from '../data/gpus';

describe('workloads', () => {
  it('defines all 4 workloads', () => {
    expect(Object.keys(WORKLOADS).sort()).toEqual(
      ['fp16-inference', 'fp32-imaging', 'fp64-sim', 'matmul-training'].sort(),
    );
  });

  it('computeUtilization gives the strongest FP64 card 100% on fp64-sim', () => {
    // mi300x has the highest fp64Vector (81.7)
    expect(computeUtilization(GPU_MAP['mi300x'], 'fp64-sim')).toBe(100);
  });

  it('computeUtilization crushes L20 on fp64-sim (<5%)', () => {
    expect(computeUtilization(GPU_MAP['l20'], 'fp64-sim')).toBeLessThan(5);
  });

  it('isBlockActive: tensor is idle for fp64-sim but active for matmul-training', () => {
    expect(isBlockActive('tensor', 'fp64-sim')).toBe(false);
    expect(isBlockActive('tensor', 'matmul-training')).toBe(true);
  });

  it('isBlockActive: compute-cluster is active for every workload', () => {
    for (const id of Object.keys(WORKLOADS) as WorkloadId[]) {
      expect(isBlockActive('compute-cluster', id)).toBe(true);
    }
  });

  it('every workload has a positive arithmetic intensity', () => {
    for (const wl of Object.values(WORKLOADS)) {
      expect(wl.arithmeticIntensity).toBeGreaterThan(0);
    }
  });
});
