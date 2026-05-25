export type Vendor = 'nvidia' | 'amd';
export type MemoryType = 'GDDR6' | 'GDDR7' | 'HBM2e' | 'HBM3';
export type DieTopology = 'monolithic' | 'dual-die' | 'chiplet';
export type BlockKind =
  | 'compute-cluster' | 'tensor' | 'l2' | 'memCtrl' | 'hbm' | 'gddr' | 'interconnect';

export interface Throughput {
  fp64Vector: number;   // TFLOPS
  fp64Matrix?: number;  // TFLOPS; absent for consumer-lineage
  fp64Ratio: number;    // fp64Vector / fp32
  fp32: number;         // TFLOPS
  fp16Dense: number;    // TFLOPS
  fp16Sparse?: number;  // TFLOPS, 2:4 sparsity
  int8Dense: number;    // TOPS
  int8Sparse?: number;  // TOPS, 2:4 sparsity
}

export interface Memory {
  capacityGB: number;
  type: MemoryType;
  bandwidthGBs: number;
}

export interface DieBlockSpec {
  kind: BlockKind;
  count: number;
  areaWeight: number;        // relative die area; all blocks sum to ~100
  label: string;
  mfmaIntegrated?: boolean;  // AMD: matrix ops live inside this block
}

export interface GpuSpec {
  id: string;
  name: string;
  vendor: Vendor;
  arch: string;
  node: string;
  topology: DieTopology;
  chipletCount?: number;
  throughput: Throughput;
  memory: Memory;
  computeUnits: number;
  tdpW: number;
  priceUSD: number;
  die: DieBlockSpec[];
}

export const GPU_SPECS: GpuSpec[] = [
  {
    id: 'l20', name: 'NVIDIA L20', vendor: 'nvidia', arch: 'Ada Lovelace', node: 'TSMC 4N',
    topology: 'monolithic',
    throughput: { fp64Vector: 0.93, fp64Ratio: 1 / 64, fp32: 59.8, fp16Dense: 119.5, fp16Sparse: 239, int8Dense: 239, int8Sparse: 478 },
    memory: { capacityGB: 48, type: 'GDDR6', bandwidthGBs: 864 },
    computeUnits: 92, tdpW: 275, priceUSD: 3500,
    die: [
      { kind: 'compute-cluster', count: 8, areaWeight: 40, label: 'SM Array (92 SMs)' },
      { kind: 'tensor', count: 8, areaWeight: 12, label: 'Tensor Cores (4th Gen)' },
      { kind: 'l2', count: 1, areaWeight: 18, label: 'L2 Cache (96 MB)' },
      { kind: 'memCtrl', count: 2, areaWeight: 8, label: 'Memory Controllers' },
      { kind: 'gddr', count: 6, areaWeight: 14, label: 'GDDR6' },
      { kind: 'interconnect', count: 1, areaWeight: 8, label: 'PCIe 4.0' },
    ],
  },
  {
    id: 'rtx-pro-6000', name: 'RTX PRO 6000', vendor: 'nvidia', arch: 'Blackwell', node: 'TSMC 4NP',
    topology: 'monolithic',
    throughput: { fp64Vector: 2.0, fp64Ratio: 1 / 64, fp32: 125, fp16Dense: 1001, fp16Sparse: 2002, int8Dense: 2000, int8Sparse: 4000 },
    memory: { capacityGB: 96, type: 'GDDR7', bandwidthGBs: 1792 },
    computeUnits: 188, tdpW: 600, priceUSD: 8500,
    die: [
      { kind: 'compute-cluster', count: 12, areaWeight: 38, label: 'SM Array (188 SMs)' },
      { kind: 'tensor', count: 12, areaWeight: 14, label: 'Tensor Cores (5th Gen)' },
      { kind: 'l2', count: 1, areaWeight: 16, label: 'L2 Cache' },
      { kind: 'memCtrl', count: 4, areaWeight: 8, label: 'Memory Controllers' },
      { kind: 'gddr', count: 8, areaWeight: 16, label: 'GDDR7' },
      { kind: 'interconnect', count: 1, areaWeight: 8, label: 'PCIe 5.0' },
    ],
  },
  {
    id: 'rtx-pro-4500', name: 'RTX PRO 4500', vendor: 'nvidia', arch: 'Blackwell', node: 'TSMC 4NP',
    topology: 'monolithic',
    throughput: { fp64Vector: 0.84, fp64Ratio: 1 / 64, fp32: 53.8, fp16Dense: 420, fp16Sparse: 840, int8Dense: 840, int8Sparse: 1680 },
    memory: { capacityGB: 32, type: 'GDDR7', bandwidthGBs: 896 },
    computeUnits: 82, tdpW: 200, priceUSD: 2600,
    die: [
      { kind: 'compute-cluster', count: 6, areaWeight: 38, label: 'SM Array (82 SMs)' },
      { kind: 'tensor', count: 6, areaWeight: 14, label: 'Tensor Cores (5th Gen)' },
      { kind: 'l2', count: 1, areaWeight: 18, label: 'L2 Cache' },
      { kind: 'memCtrl', count: 2, areaWeight: 8, label: 'Memory Controllers' },
      { kind: 'gddr', count: 4, areaWeight: 14, label: 'GDDR7' },
      { kind: 'interconnect', count: 1, areaWeight: 8, label: 'PCIe 5.0' },
    ],
  },
  {
    id: 'h100-sxm', name: 'H100 SXM', vendor: 'nvidia', arch: 'Hopper', node: 'TSMC 4N',
    topology: 'monolithic',
    throughput: { fp64Vector: 34, fp64Matrix: 67, fp64Ratio: 0.5, fp32: 67, fp16Dense: 989, fp16Sparse: 1979, int8Dense: 1979, int8Sparse: 3958 },
    memory: { capacityGB: 80, type: 'HBM3', bandwidthGBs: 3350 },
    computeUnits: 132, tdpW: 700, priceUSD: 30000,
    die: [
      { kind: 'compute-cluster', count: 8, areaWeight: 35, label: 'SM Array (132 SMs)' },
      { kind: 'tensor', count: 8, areaWeight: 18, label: 'Tensor Cores (4th Gen Hopper)' },
      { kind: 'l2', count: 1, areaWeight: 14, label: 'L2 Cache (50 MB)' },
      { kind: 'memCtrl', count: 6, areaWeight: 6, label: 'HBM3 Controllers' },
      { kind: 'hbm', count: 6, areaWeight: 20, label: 'HBM3 Stacks' },
      { kind: 'interconnect', count: 1, areaWeight: 7, label: 'NVLink 4.0' },
    ],
  },
  {
    id: 'mi210', name: 'MI210', vendor: 'amd', arch: 'CDNA2', node: 'TSMC N6',
    topology: 'monolithic',
    throughput: { fp64Vector: 22.6, fp64Matrix: 45.3, fp64Ratio: 1.0, fp32: 22.6, fp16Dense: 181, int8Dense: 181 },
    memory: { capacityGB: 64, type: 'HBM2e', bandwidthGBs: 1600 },
    computeUnits: 104, tdpW: 300, priceUSD: 12000,
    die: [
      { kind: 'compute-cluster', count: 8, areaWeight: 56, label: 'Compute Units (104 CUs)', mfmaIntegrated: true },
      { kind: 'l2', count: 1, areaWeight: 14, label: 'L2 + Infinity Cache (8 MB)' },
      { kind: 'memCtrl', count: 4, areaWeight: 8, label: 'HBM2e Controllers' },
      { kind: 'hbm', count: 4, areaWeight: 16, label: 'HBM2e Stacks' },
      { kind: 'interconnect', count: 1, areaWeight: 6, label: 'Infinity Fabric' },
    ],
  },
  {
    id: 'mi250', name: 'MI250', vendor: 'amd', arch: 'CDNA2', node: 'TSMC N6',
    topology: 'dual-die',
    throughput: { fp64Vector: 45.3, fp64Matrix: 90.5, fp64Ratio: 1.0, fp32: 45.3, fp16Dense: 362, int8Dense: 362 },
    memory: { capacityGB: 128, type: 'HBM2e', bandwidthGBs: 3200 },
    computeUnits: 208, tdpW: 500, priceUSD: 12000,
    die: [
      { kind: 'compute-cluster', count: 8, areaWeight: 56, label: 'Compute Units (104 CUs/die)', mfmaIntegrated: true },
      { kind: 'l2', count: 1, areaWeight: 14, label: 'L2 + Infinity Cache' },
      { kind: 'memCtrl', count: 4, areaWeight: 8, label: 'HBM2e Controllers' },
      { kind: 'hbm', count: 4, areaWeight: 16, label: 'HBM2e Stacks' },
      { kind: 'interconnect', count: 1, areaWeight: 6, label: 'Infinity Fabric + xGMI' },
    ],
  },
  {
    id: 'mi300x', name: 'MI300X', vendor: 'amd', arch: 'CDNA3', node: '5+6nm chiplet',
    topology: 'chiplet', chipletCount: 8,
    throughput: { fp64Vector: 81.7, fp64Matrix: 163.4, fp64Ratio: 0.5, fp32: 163.4, fp16Dense: 1307, fp16Sparse: 2614, int8Dense: 2614, int8Sparse: 5229 },
    memory: { capacityGB: 192, type: 'HBM3', bandwidthGBs: 5325 },
    computeUnits: 304, tdpW: 750, priceUSD: 18000,
    die: [
      { kind: 'compute-cluster', count: 8, areaWeight: 52, label: 'XCD Compute Units (38 CUs each)', mfmaIntegrated: true },
      { kind: 'l2', count: 1, areaWeight: 10, label: 'L2 Cache per XCD' },
      { kind: 'memCtrl', count: 8, areaWeight: 10, label: 'HBM3 Controllers' },
      { kind: 'hbm', count: 8, areaWeight: 20, label: 'HBM3 Stacks (24 GB each)' },
      { kind: 'interconnect', count: 1, areaWeight: 8, label: 'I/O Die + Infinity Fabric' },
    ],
  },
];

export const GPU_MAP: Record<string, GpuSpec> = Object.fromEntries(
  GPU_SPECS.map((g) => [g.id, g]),
);
