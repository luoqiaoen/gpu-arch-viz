import { GPU_SPECS, type GpuSpec, type BlockKind } from './gpus';

export type WorkloadId = 'fp64-sim' | 'fp32-imaging' | 'fp16-inference' | 'matmul-training';
export type Precision = 'fp64' | 'fp32' | 'fp16' | 'int8';

export interface Workload {
  id: WorkloadId;
  label: string;
  description: string;
  activeBlocks: BlockKind[];
  dominantPrecision: Precision;
  arithmeticIntensity: number; // FLOP/byte midpoint for roofline
}

export const WORKLOADS: Record<WorkloadId, Workload> = {
  'fp64-sim': {
    id: 'fp64-sim',
    label: 'FP64 Scientific Sim',
    description:
      'High-precision simulation (molecular dynamics, CFD, climate). Bottlenecked by FP64 vector throughput and memory bandwidth. Tensor Cores sit idle.',
    activeBlocks: ['compute-cluster', 'memCtrl', 'hbm', 'gddr', 'interconnect'],
    dominantPrecision: 'fp64',
    arithmeticIntensity: 2,
  },
  'fp32-imaging': {
    id: 'fp32-imaging',
    label: 'FP32 Image Processing',
    description:
      'Image filters, stencil kernels, signal processing. Highly bandwidth-bound — memory bandwidth dominates throughput.',
    activeBlocks: ['compute-cluster', 'memCtrl', 'hbm', 'gddr', 'l2'],
    dominantPrecision: 'fp32',
    arithmeticIntensity: 1,
  },
  'fp16-inference': {
    id: 'fp16-inference',
    label: 'FP16/BF16 AI Inference',
    description:
      'Transformer inference. Matrix-heavy: Tensor Cores (NVIDIA) and MFMA (AMD) are both engaged. Memory-bound at small batch.',
    activeBlocks: ['compute-cluster', 'tensor', 'memCtrl', 'hbm', 'gddr', 'l2'],
    dominantPrecision: 'fp16',
    arithmeticIntensity: 100,
  },
  'matmul-training': {
    id: 'matmul-training',
    label: 'Dense MatMul Training',
    description:
      'Large GEMM (transformer training). Highest arithmetic intensity; fully utilizes Tensor Cores / MFMA units. Compute-bound.',
    activeBlocks: ['compute-cluster', 'tensor', 'l2'],
    dominantPrecision: 'fp16',
    arithmeticIntensity: 300,
  },
};

function precisionThroughput(spec: GpuSpec, precision: Precision): number {
  switch (precision) {
    case 'fp64': return spec.throughput.fp64Vector;
    case 'fp32': return spec.throughput.fp32;
    case 'fp16': return spec.throughput.fp16Dense;
    case 'int8': return spec.throughput.int8Dense;
  }
}

export function computeUtilization(spec: GpuSpec, workloadId: WorkloadId): number {
  const precision = WORKLOADS[workloadId].dominantPrecision;
  const value = precisionThroughput(spec, precision);
  const max = Math.max(...GPU_SPECS.map((g) => precisionThroughput(g, precision)));
  return Math.round((value / max) * 100);
}

export function isBlockActive(kind: BlockKind, workloadId: WorkloadId): boolean {
  return WORKLOADS[workloadId].activeBlocks.includes(kind);
}
