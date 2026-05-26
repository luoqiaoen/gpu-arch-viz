import { describe, it, expect } from 'vitest';
import { convFlops, convBytesTiled, convBytesNaive, convAI } from '../lib/convolutionAI';

const BASE = { imageW: 2048, imageH: 1024, kSize: 3, cIn: 3, cOut: 16 };

describe('convolutionAI', () => {
  it('convFlops scales with K² (doubling K quadruples FLOPs)', () => {
    const k3 = convFlops({ ...BASE, kSize: 3 });
    const k6 = convFlops({ ...BASE, kSize: 6 });
    expect(k6 / k3).toBeCloseTo(4, 5);
  });

  it('convFlops for K=1 (pointwise) equals 2×H×W×C_in×C_out', () => {
    const p = { imageW: 1024, imageH: 512, kSize: 1, cIn: 8, cOut: 16 };
    expect(convFlops(p)).toBe(2 * 1024 * 512 * 8 * 16);
  });

  it('convBytesTiled reads each tensor exactly once (FP32)', () => {
    const p = { imageW: 1024, imageH: 512, kSize: 3, cIn: 4, cOut: 8 };
    const px = 1024 * 512;
    const expected = (px * 4 + 9 * 4 * 8 + px * 8) * 4;
    expect(convBytesTiled(p, 'fp32')).toBe(expected);
  });

  it('fp16 tiled bytes are exactly half of fp32 tiled bytes', () => {
    const p = { imageW: 1024, imageH: 512, kSize: 3, cIn: 4, cOut: 8 };
    expect(convBytesTiled(p, 'fp32') / convBytesTiled(p, 'fp16')).toBe(2);
  });

  it('naive AI ≈ 1/bpe for large K×C (fp32 → ≈0.25)', () => {
    const p = { imageW: 512, imageH: 512, kSize: 7, cIn: 64, cOut: 64 };
    expect(convAI(p, 'fp32', 'naive')).toBeCloseTo(0.25, 1);
  });

  it('naive AI ≈ 1/bpe for large K×C (fp16 → ≈0.5)', () => {
    const p = { imageW: 512, imageH: 512, kSize: 7, cIn: 64, cOut: 64 };
    expect(convAI(p, 'fp16', 'naive')).toBeCloseTo(0.5, 1);
  });

  it('naive AI ≈ 1/bpe for large K×C (int8 → ≈1.0)', () => {
    const p = { imageW: 512, imageH: 512, kSize: 7, cIn: 64, cOut: 64 };
    expect(convAI(p, 'int8', 'naive')).toBeCloseTo(1.0, 1);
  });

  it('tiled AI is always larger than naive AI', () => {
    const p = { imageW: 2048, imageH: 1024, kSize: 7, cIn: 3, cOut: 3 };
    expect(convAI(p, 'fp32', 'tiled')).toBeGreaterThan(convAI(p, 'fp32', 'naive'));
  });

  // Image-processing preset validation (C=grayscale or RGB, not CNN feature maps)
  it('3×3 grayscale tiled at 2MP is memory-bound (AI ≈ 2.2)', () => {
    const p = { imageW: 2048, imageH: 1024, kSize: 3, cIn: 1, cOut: 1 };
    expect(convAI(p, 'fp32', 'tiled')).toBeCloseTo(2.25, 1);
  });

  it('7×7 RGB tiled at 2MP is AI ≈ 36.7 (memory-bound on most GPUs)', () => {
    const p = { imageW: 2048, imageH: 1024, kSize: 7, cIn: 3, cOut: 3 };
    expect(convAI(p, 'fp32', 'tiled')).toBeCloseTo(36.7, 0);
  });

  it('11×11 RGB tiled is compute-bound territory (AI > 80)', () => {
    const p = { imageW: 2048, imageH: 1024, kSize: 11, cIn: 3, cOut: 3 };
    expect(convAI(p, 'fp32', 'tiled')).toBeGreaterThan(80);
  });

  it('15×15 RGB tiled has higher AI than 11×11 (larger kernel = more compute reuse)', () => {
    const p11 = { imageW: 2048, imageH: 1024, kSize: 11, cIn: 3, cOut: 3 };
    const p15 = { imageW: 2048, imageH: 1024, kSize: 15, cIn: 3, cOut: 3 };
    expect(convAI(p15, 'fp32', 'tiled')).toBeGreaterThan(convAI(p11, 'fp32', 'tiled'));
  });
});
