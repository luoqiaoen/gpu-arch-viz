// All throughput values in GFLOPS; bandwidth in GB/s; intensity in FLOP/byte.
export function ridgePoint(computeCeilingGFLOPS: number, bandwidthGBs: number): number {
  return computeCeilingGFLOPS / bandwidthGBs;
}

export function achievableThroughput(intensity: number, computeCeilingGFLOPS: number, bandwidthGBs: number): number {
  return Math.min(intensity * bandwidthGBs, computeCeilingGFLOPS);
}

export function bottleneck(
  arithmeticIntensity: number,
  computeCeilingGFLOPS: number,
  bandwidthGBs: number,
): 'compute' | 'memory' {
  return arithmeticIntensity >= ridgePoint(computeCeilingGFLOPS, bandwidthGBs) ? 'compute' : 'memory';
}

export interface WorkloadPoint {
  label: string;
  intensity: number; // FLOP/byte
}

export const WORKLOAD_POINTS: WorkloadPoint[] = [
  { label: '2D Stencil', intensity: 0.5 },
  { label: 'SpMV', intensity: 0.25 },
  { label: 'FFT', intensity: 5 },
  { label: 'Molecular Dynamics', intensity: 20 },
  { label: 'Dense GEMM', intensity: 200 },
];
