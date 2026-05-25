// Simplified latency-hiding model: more resident warps hide more memory latency.
// occupancyPct in [0,100].
export function exposedLatencyFraction(occupancyPct: number): number {
  const o = Math.max(0, Math.min(100, occupancyPct)) / 100;
  return 1 - o; // linear: at 100% occupancy, latency fully hidden
}

export function throughputAtOccupancy(occupancyPct: number): number {
  // Effective throughput shrinks as exposed latency grows.
  const exposed = exposedLatencyFraction(occupancyPct);
  return Math.round((1 - exposed) * 100);
}
