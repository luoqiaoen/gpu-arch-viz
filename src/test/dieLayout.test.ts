import { describe, it, expect } from 'vitest';
import { generateDieLayouts, DIE_SIZE } from '../lib/dieLayout';
import { GPU_MAP } from '../data/gpus';

describe('generateDieLayouts', () => {
  it('monolithic cards produce 1 die layout', () => {
    expect(generateDieLayouts(GPU_MAP['h100-sxm'])).toHaveLength(1);
  });

  it('dual-die (MI250) produces 2 die layouts', () => {
    expect(generateDieLayouts(GPU_MAP['mi250'])).toHaveLength(2);
  });

  it('chiplet (MI300X) produces 8 die layouts', () => {
    expect(generateDieLayouts(GPU_MAP['mi300x'])).toHaveLength(8);
  });

  it('NVIDIA layouts include tensor blocks; AMD layouts do not', () => {
    const h100 = generateDieLayouts(GPU_MAP['h100-sxm'])[0];
    const mi210 = generateDieLayouts(GPU_MAP['mi210'])[0];
    expect(h100.blocks.some((b) => b.kind === 'tensor')).toBe(true);
    expect(mi210.blocks.some((b) => b.kind === 'tensor')).toBe(false);
  });

  it('AMD compute-cluster blocks carry mfmaIntegrated flag', () => {
    const mi210 = generateDieLayouts(GPU_MAP['mi210'])[0];
    const cc = mi210.blocks.filter((b) => b.kind === 'compute-cluster');
    expect(cc.length).toBeGreaterThan(0);
    expect(cc.every((b) => b.mfmaIntegrated)).toBe(true);
  });

  it('all blocks stay within die bounds', () => {
    const layout = generateDieLayouts(GPU_MAP['h100-sxm'])[0];
    for (const b of layout.blocks) {
      expect(b.x).toBeGreaterThanOrEqual(-0.01);
      expect(b.y).toBeGreaterThanOrEqual(-0.01);
      expect(b.x + b.width).toBeLessThanOrEqual(DIE_SIZE + 0.01);
      expect(b.y + b.height).toBeLessThanOrEqual(DIE_SIZE + 0.01);
    }
  });

  it('block ids are unique within a layout', () => {
    const layout = generateDieLayouts(GPU_MAP['h100-sxm'])[0];
    const ids = layout.blocks.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('NVIDIA produces one tensor sliver per compute cluster', () => {
    const h100 = generateDieLayouts(GPU_MAP['h100-sxm'])[0];
    const clusters = h100.blocks.filter((b) => b.kind === 'compute-cluster').length;
    const tensors = h100.blocks.filter((b) => b.kind === 'tensor').length;
    expect(tensors).toBe(clusters);
  });
});
