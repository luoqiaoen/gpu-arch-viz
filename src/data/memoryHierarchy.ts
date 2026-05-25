import type { GpuSpec } from './gpus';

export interface MemRung {
  level: string;
  capacity: string;
  bandwidth: string;
  bwNumGBps: number | null; // per-chip bandwidth; null for reg/L1 (per-SM values, not comparable)
  latency: string;
  latencyNs: number;
  external?: boolean;
}

const HOPPER: MemRung[] = [
  { level: 'Registers',       capacity: '256 KB/SM',  bandwidth: '~80 TB/s/SM',   bwNumGBps: null,  latency: '<1 ns',   latencyNs: 0.5 },
  { level: 'Shared / L1',     capacity: '228 KB/SM',  bandwidth: '~30 TB/s/SM',   bwNumGBps: null,  latency: '~5 ns',   latencyNs: 5   },
  { level: 'L2 Cache',        capacity: '50 MB',      bandwidth: '~12 TB/s',      bwNumGBps: 12000, latency: '~80 ns',  latencyNs: 80  },
  { level: 'HBM3',            capacity: '80 GB',      bandwidth: '3350 GB/s',     bwNumGBps: 3350,  latency: '~500 ns', latencyNs: 500,  external: true },
  { level: 'PCIe 5.0 → Host', capacity: 'Host RAM',   bandwidth: '128 GB/s',      bwNumGBps: 128,   latency: '~5 µs',   latencyNs: 5000, external: true },
];

const ADA: MemRung[] = [
  { level: 'Registers',       capacity: '256 KB/SM',  bandwidth: '~70 TB/s/SM',   bwNumGBps: null,  latency: '<1 ns',   latencyNs: 0.5 },
  { level: 'Shared / L1',     capacity: '128 KB/SM',  bandwidth: '~25 TB/s/SM',   bwNumGBps: null,  latency: '~5 ns',   latencyNs: 5   },
  { level: 'L2 Cache',        capacity: '96 MB',      bandwidth: '~5 TB/s',       bwNumGBps: 5000,  latency: '~85 ns',  latencyNs: 85  },
  { level: 'GDDR6',           capacity: '48 GB',      bandwidth: '864 GB/s',      bwNumGBps: 864,   latency: '~700 ns', latencyNs: 700,  external: true },
  { level: 'PCIe 4.0 → Host', capacity: 'Host RAM',   bandwidth: '64 GB/s',       bwNumGBps: 64,    latency: '~6 µs',   latencyNs: 6000, external: true },
];

const BLACKWELL: MemRung[] = [
  { level: 'Registers',       capacity: '256 KB/SM',  bandwidth: '~90 TB/s/SM',   bwNumGBps: null,  latency: '<1 ns',   latencyNs: 0.5 },
  { level: 'Shared / L1',     capacity: '256 KB/SM',  bandwidth: '~40 TB/s/SM',   bwNumGBps: null,  latency: '~4 ns',   latencyNs: 4   },
  { level: 'L2 Cache',        capacity: '~128 MB',    bandwidth: '~7 TB/s',       bwNumGBps: 7000,  latency: '~75 ns',  latencyNs: 75  },
  { level: 'GDDR7',           capacity: '32–96 GB',   bandwidth: '800–1344 GB/s', bwNumGBps: 1344,  latency: '~600 ns', latencyNs: 600,  external: true },
  { level: 'PCIe 5.0 → Host', capacity: 'Host RAM',   bandwidth: '128 GB/s',      bwNumGBps: 128,   latency: '~5 µs',   latencyNs: 5000, external: true },
];

const CDNA2: MemRung[] = [
  { level: 'Registers',       capacity: '256 KB/CU',  bandwidth: '~60 TB/s/CU',   bwNumGBps: null,  latency: '<1 ns',   latencyNs: 0.5 },
  { level: 'LDS (Shared)',     capacity: '64 KB/CU',   bandwidth: '~15 TB/s/CU',   bwNumGBps: null,  latency: '~5 ns',   latencyNs: 5   },
  { level: 'L1 Cache',        capacity: '16 KB/CU',   bandwidth: '~10 TB/s/CU',   bwNumGBps: null,  latency: '~25 ns',  latencyNs: 25  },
  { level: 'L2 + Infinity',   capacity: '8 MB',       bandwidth: '~3 TB/s',       bwNumGBps: 3000,  latency: '~120 ns', latencyNs: 120 },
  { level: 'HBM2e',           capacity: '64–128 GB',  bandwidth: '1600–3200 GB/s',bwNumGBps: 3200,  latency: '~400 ns', latencyNs: 400,  external: true },
  { level: 'PCIe 4.0 → Host', capacity: 'Host RAM',   bandwidth: '64 GB/s',       bwNumGBps: 64,    latency: '~6 µs',   latencyNs: 6000, external: true },
];

const CDNA3: MemRung[] = [
  { level: 'Registers',       capacity: '512 KB/CU',  bandwidth: '~100 TB/s/CU',  bwNumGBps: null,  latency: '<1 ns',   latencyNs: 0.5 },
  { level: 'LDS (Shared)',     capacity: '64 KB/CU',   bandwidth: '~20 TB/s/CU',   bwNumGBps: null,  latency: '~4 ns',   latencyNs: 4   },
  { level: 'L1 Cache',        capacity: '32 KB/CU',   bandwidth: '~15 TB/s/CU',   bwNumGBps: null,  latency: '~20 ns',  latencyNs: 20  },
  { level: 'L2 per XCD',      capacity: '4 MB/XCD',   bandwidth: '~5 TB/s',       bwNumGBps: 5000,  latency: '~100 ns', latencyNs: 100 },
  { level: 'HBM3',            capacity: '192 GB',     bandwidth: '5300 GB/s',     bwNumGBps: 5300,  latency: '~350 ns', latencyNs: 350,  external: true },
  { level: 'PCIe 5.0 → Host', capacity: 'Host RAM',   bandwidth: '128 GB/s',      bwNumGBps: 128,   latency: '~5 µs',   latencyNs: 5000, external: true },
];

const BY_ARCH: Record<string, MemRung[]> = {
  Hopper: HOPPER,
  'Ada Lovelace': ADA,
  Blackwell: BLACKWELL,
  CDNA2: CDNA2,
  CDNA3: CDNA3,
};

export function hierarchyForCard(spec: GpuSpec): MemRung[] {
  return BY_ARCH[spec.arch] ?? HOPPER;
}
