import { describe, it, expect } from 'vitest';
import { buildPrecisionData } from '../lib/precisionData';
import { GPU_MAP } from '../data/gpus';

describe('buildPrecisionData', () => {
  const specs = [GPU_MAP['l20'], GPU_MAP['h100-sxm']];

  it('produces one row per precision', () => {
    const data = buildPrecisionData(specs, false);
    expect(data.map((d) => d.precision)).toEqual(['FP64', 'FP32', 'FP16', 'INT8']);
  });

  it('uses dense FP16 when marketing is off', () => {
    const data = buildPrecisionData(specs, false);
    const fp16 = data.find((d) => d.precision === 'FP16')!;
    expect(fp16['h100-sxm']).toBe(989);
  });

  it('uses sparse FP16 when marketing is on', () => {
    const data = buildPrecisionData(specs, true);
    const fp16 = data.find((d) => d.precision === 'FP16')!;
    expect(fp16['h100-sxm']).toBe(1979);
  });

  it('captures the L20 FP64 collapse', () => {
    const data = buildPrecisionData(specs, false);
    const fp64 = data.find((d) => d.precision === 'FP64')!;
    expect(fp64['l20']).toBe(0.93);
  });
});
