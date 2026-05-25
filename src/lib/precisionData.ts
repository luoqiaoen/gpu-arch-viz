import type { GpuSpec } from '../data/gpus';

export type PrecisionRow = { precision: string } & Record<string, number | string>;

export function buildPrecisionData(specs: GpuSpec[], marketing: boolean): PrecisionRow[] {
  const precisions: Array<{ key: string; get: (s: GpuSpec) => number }> = [
    { key: 'FP64', get: (s) => s.throughput.fp64Vector },
    { key: 'FP32', get: (s) => s.throughput.fp32 },
    { key: 'FP16', get: (s) => (marketing && s.throughput.fp16Sparse != null ? s.throughput.fp16Sparse : s.throughput.fp16Dense) },
    { key: 'INT8', get: (s) => (marketing && s.throughput.int8Sparse != null ? s.throughput.int8Sparse : s.throughput.int8Dense) },
  ];
  return precisions.map(({ key, get }) => {
    const row: PrecisionRow = { precision: key };
    for (const s of specs) row[s.id] = get(s);
    return row;
  });
}
