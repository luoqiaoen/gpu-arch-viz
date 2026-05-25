import { describe, it, expect } from 'vitest';
import { ridgePoint, achievableThroughput, bottleneck, WORKLOAD_POINTS } from '../lib/roofline';

describe('roofline', () => {
  it('ridge point = compute ceiling / bandwidth', () => {
    expect(ridgePoint(67000, 3350)).toBeCloseTo(20, 1); // H100 FP32: 67 TFLOPS, 3.35 TB/s
  });

  it('crippled FP64 pushes the ridge far left (tiny compute ceiling)', () => {
    const h100 = ridgePoint(34000, 3350);
    const l20 = ridgePoint(930, 864);
    expect(l20).toBeLessThan(h100);
  });

  it('achievableThroughput is bandwidth-bound below the ridge', () => {
    expect(achievableThroughput(2, 67000, 3350)).toBeCloseTo(6700, 0);
  });

  it('achievableThroughput is compute-bound above the ridge', () => {
    expect(achievableThroughput(1000, 67000, 3350)).toBe(67000);
  });

  it('exposes named workload points', () => {
    expect(WORKLOAD_POINTS.map((w) => w.label)).toContain('2D Stencil');
  });

  it('returns memory when arithmetic intensity is below the ridge point', () => {
    // H100 FP32: ridgePoint(67000, 3350) ≈ 20 — AI=2 is below
    expect(bottleneck(2, 67000, 3350)).toBe('memory');
  });

  it('returns compute when arithmetic intensity is above the ridge point', () => {
    // AI=300 is well above ridge point ~20
    expect(bottleneck(300, 67000, 3350)).toBe('compute');
  });

  it('returns compute exactly at the ridge point', () => {
    const ridge = ridgePoint(67000, 3350);
    expect(bottleneck(ridge, 67000, 3350)).toBe('compute');
  });

  it('RTX PRO 6000 at AI=50 is memory-bound, at AI=300 is compute-bound', () => {
    // ridgePoint(125000, 1344) ≈ 93
    expect(bottleneck(50, 125000, 1344)).toBe('memory');
    expect(bottleneck(300, 125000, 1344)).toBe('compute');
  });
});
