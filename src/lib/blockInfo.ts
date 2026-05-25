import type { GpuSpec, BlockKind } from '../data/gpus';
import { isBlockActive, WORKLOADS, type WorkloadId } from '../data/workloads';

const ROLE: Record<BlockKind, string> = {
  'compute-cluster': 'Execution units (NVIDIA: SMs, AMD: CUs). Each SM/CU contains ALUs, register files, and L1/shared memory — the workhorse for every workload.',
  tensor: 'Dedicated matrix-multiply accelerators. Deliver peak throughput only for FP16/BF16/INT8 matmul (AI training/inference). Completely idle for scalar FP64/FP32 work.',
  l2: 'Shared last-level on-die cache. Reusing data here avoids expensive trips to external memory. A larger L2 directly reduces bandwidth pressure on memory-bound kernels.',
  memCtrl: 'Memory controllers — schedule reads/writes, handle ECC, and drive refresh cycles. More controllers increase effective bandwidth by parallelising memory channel traffic.',
  hbm: 'High-Bandwidth Memory (HBM) stacks. 1024-bit-wide bus per stack enables thousands of GB/s. Critical for bandwidth-bound workloads; far more energy-efficient per bit than GDDR.',
  gddr: 'GDDR memory — cheaper than HBM, but narrower bus and lower bandwidth. Bandwidth-bound kernels (scientific sim, imaging) will hit this ceiling first.',
  interconnect: 'Off-die fabric for host and peer traffic: NVLink (NVIDIA), Infinity Fabric / xGMI (AMD), or PCIe. The bottleneck for multi-GPU collective ops and host DMA transfers.',
};

export interface BlockInfo {
  kind: BlockKind;
  role: string;
  active: boolean;
  dieAreaPct: number;
  note: string;
}

export function describeBlock(spec: GpuSpec, kind: BlockKind, workloadId: WorkloadId): BlockInfo {
  const active = isBlockActive(kind, workloadId);
  const dieAreaPct = spec.die.find((b) => b.kind === kind)?.areaWeight ?? 0;
  const wl = WORKLOADS[workloadId];

  // Topology context appended to every note
  const unitLabel = spec.vendor === 'nvidia' ? 'SMs' : 'CUs';
  const perDieCount =
    spec.topology === 'chiplet'
      ? Math.round(spec.computeUnits / (spec.chipletCount ?? 8))
      : spec.topology === 'dual-die'
      ? Math.round(spec.computeUnits / 2)
      : spec.computeUnits;
  const topoCtx =
    spec.topology === 'chiplet'
      ? ` ${spec.chipletCount ?? 8} XCDs, each with its own copy of this block (${perDieCount} ${unitLabel}/XCD, ${spec.computeUnits} total).`
      : spec.topology === 'dual-die'
      ? ` Two dies, each with ${perDieCount} ${unitLabel} — this block is replicated per die.`
      : kind === 'compute-cluster'
      ? ` ${spec.computeUnits} ${unitLabel} on a single monolithic die.`
      : '';

  let note: string;
  if (kind === 'tensor' && !active && dieAreaPct > 0) {
    note = `Idle during "${wl.label}" — ~${dieAreaPct}% of die area sitting unused. Switch to an AI workload to engage it.`;
  } else if (kind === 'compute-cluster' && spec.die.find((b) => b.kind === kind)?.mfmaIntegrated) {
    note = `MFMA matrix ops execute inside the CUs — there is no separate idle matrix block.${topoCtx}`;
  } else if (active) {
    note = `Engaged by "${wl.label}".${topoCtx}`;
  } else {
    note = `Not on the critical path for "${wl.label}".${topoCtx}`;
  }

  return { kind, role: ROLE[kind], active, dieAreaPct, note };
}
