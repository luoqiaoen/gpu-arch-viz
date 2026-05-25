import { describe, it, expect } from 'vitest';
import { exposedLatencyFraction, throughputAtOccupancy } from '../lib/occupancy';

describe('occupancy', () => {
  it('full occupancy fully hides latency (exposed ≈ 0)', () => {
    expect(exposedLatencyFraction(100)).toBeCloseTo(0, 5);
  });

  it('zero occupancy fully exposes latency', () => {
    expect(exposedLatencyFraction(0)).toBe(1);
  });

  it('throughput rises monotonically with occupancy', () => {
    expect(throughputAtOccupancy(25)).toBeLessThan(throughputAtOccupancy(75));
  });

  it('throughput is capped at 100', () => {
    expect(throughputAtOccupancy(100)).toBeLessThanOrEqual(100);
  });
});
