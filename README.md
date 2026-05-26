# gpu-arch-viz

Interactive GPU architecture visualizer for comparing NVIDIA and AMD GPUs. Two views: **Explorer** for side-by-side spec comparison with die diagrams, and **Learn** for understanding performance models.

---

## Launch

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm test           # Vitest unit tests
npx tsc --noEmit   # type-check
```

---

## What it does

### Explorer view

**Die diagrams** — Each selected GPU renders a 2D die diagram showing individual SM/CU cells. Blocks are color-coded by kind (compute, cache, memory, interconnect) and dim when idle for the selected workload. Click any block for a description of its role, topology context, and workload relevance. Multi-die GPUs (MI250 dual-die, MI300X 8 XCDs) get per-layer tabs.

**Workload selector** — Choose from four workloads to see which blocks activate and what the bottleneck is:

| Workload | Dominant precision | Arithmetic intensity | Typical bottleneck |
|----------|--------------------|---------------------|-------------------|
| FP64 Scientific Sim | FP64 | ~2 FLOP/byte | Memory bandwidth |
| FP32 Image Processing | FP32 | ~1 FLOP/byte | Memory bandwidth |
| FP16/BF16 AI Inference | FP16 | ~100 FLOP/byte | Compute (Tensor/MFMA) |
| Dense MatMul Training | FP16 | ~300 FLOP/byte | Compute (Tensor/MFMA) |

**Compare table** — Side-by-side spec sheet with:
- FP64 / FP32 / FP16 throughput (TFLOPS)
- Memory bandwidth (GB/s), capacity, type
- TDP (W), price with **editable price inputs** for real-time efficiency recalculation
- **FP16/$k** and **TFLOPS/W** efficiency rows
- **Bottleneck verdict** — "Mem BW ↑" or "Compute ↑" per workload, per GPU

**Bandwidth chart** — Bar chart comparing memory bandwidth across selected GPUs.

### Learn view

| Section | What it teaches |
|---------|----------------|
| Roofline model | Per-GPU compute/bandwidth ceilings on a log-log chart; FP32/FP16/INT8/FP64 ceiling toggle; convolution op dots auto-placed on each roofline curve |
| Convolution calculator | Arithmetic intensity for grayscale K×K convolution (3×3 → 15×15); tiled vs naive cache modes; separable decomposition (K×K → K×1+1×K); live dense vs separable AI in legend; per-GPU throughput table in MP/s; expandable "Show math" panel with formulas and worked numbers |
| Tiling depth & halo overhead | Visualizes how tile size T affects AI: a T×T output tile loads a (T+K-1)² input patch; charts show AI vs T converging to K²/bpe asymptote, and halo waste % vs T; reference table at T=8/16/32 |
| Floating-point formats | Stacked bit-field bars for FP64 → INT8; sign / exponent / mantissa breakdown |
| Memory hierarchy | Bandwidth cliff bar chart (log scale) + latency ladder from registers to PCIe |
| Warp scheduler | Occupancy simulator — adjust thread block size and register pressure |
| Memory access patterns | Coalesced vs strided access animation |

**Precision loop:** changing precision in the convolution calculator (FP32 / FP16 / INT8) simultaneously shifts the AI values (bpe changes bytes) *and* switches the roofline ceiling to the matching tensor-core rate, showing both effects together.

---

## Adding a GPU

All GPU data lives in **`src/data/gpus.ts`**. Add an entry to the `GPU_SPECS` array:

```typescript
{
  id: 'my-gpu',                  // unique kebab-case identifier
  name: 'My GPU Name',           // display name
  vendor: 'nvidia' | 'amd',
  arch: 'Hopper',                // must match a key in memoryHierarchy BY_ARCH (see below)
  node: 'TSMC 4N',
  topology: 'monolithic' | 'dual-die' | 'chiplet',
  chipletCount: 8,               // required only when topology === 'chiplet'
  throughput: {
    fp64Vector: 34,              // TFLOPS
    fp64Matrix: 67,              // TFLOPS; omit for consumer/pro cards without a matrix path
    fp64Ratio: 0.5,              // fp64Vector / fp32 (0.5 = 1:2, 1/64 = crippled)
    fp32: 67,                    // TFLOPS
    fp16Dense: 989,              // TFLOPS — use Tensor Core / MFMA rate, not 2×FP32
    fp16Sparse: 1979,            // TFLOPS with 2:4 sparsity; omit if not supported
    int8Dense: 1979,             // TOPS
    int8Sparse: 3958,            // TOPS with 2:4 sparsity; omit if not supported
  },
  memory: {
    capacityGB: 80,
    type: 'HBM3',                // 'GDDR6' | 'GDDR7' | 'HBM2e' | 'HBM3'
    bandwidthGBs: 3350,
  },
  computeUnits: 132,             // SMs for NVIDIA, CUs for AMD
  tdpW: 700,                     // rated TDP, not peak power
  priceUSD: 30000,               // launch MSRP; users can override in the UI
  die: [
    // area weights should sum to ~100
    { kind: 'compute-cluster', count: 8,  areaWeight: 35, label: 'SM Array (132 SMs)' },
    { kind: 'tensor',          count: 8,  areaWeight: 18, label: 'Tensor Cores (4th Gen)' },
    { kind: 'l2',              count: 1,  areaWeight: 14, label: 'L2 Cache (50 MB)' },
    { kind: 'memCtrl',         count: 6,  areaWeight: 6,  label: 'HBM3 Controllers' },
    { kind: 'hbm',             count: 6,  areaWeight: 20, label: 'HBM3 Stacks' },
    { kind: 'interconnect',    count: 1,  areaWeight: 7,  label: 'NVLink 4.0' },
  ],
},
```

**Notes on `die` blocks:**
- NVIDIA cards must have a `tensor` block (separate Tensor Core array). AMD CDNA and RDNA cards have matrix ops integrated in the CU — use `mfmaIntegrated: true` on the `compute-cluster` block and omit `tensor`.
- Use `hbm` for HBM stacks, `gddr` for GDDR6/7.
- `count` on `compute-cluster` controls how many columns the SM/CU grid renders in the die diagram.

**If the architecture is new**, add a memory hierarchy profile in **`src/data/memoryHierarchy.ts`**:

```typescript
const MY_ARCH: MemRung[] = [
  { level: 'Registers',       capacity: '256 KB/SM', bandwidth: '~80 TB/s/SM',  bwNumGBps: null, latency: '<1 ns',   latencyNs: 0.5 },
  { level: 'Shared / L1',     capacity: '228 KB/SM', bandwidth: '~30 TB/s/SM',  bwNumGBps: null, latency: '~5 ns',   latencyNs: 5   },
  { level: 'L2 Cache',        capacity: '50 MB',     bandwidth: '~12 TB/s',     bwNumGBps: 12000, latency: '~80 ns', latencyNs: 80  },
  { level: 'HBM3',            capacity: '80 GB',     bandwidth: '3350 GB/s',    bwNumGBps: 3350,  latency: '~500 ns',latencyNs: 500, external: true },
  { level: 'PCIe 5.0 → Host', capacity: 'Host RAM',  bandwidth: '128 GB/s',     bwNumGBps: 128,   latency: '~5 µs',  latencyNs: 5000, external: true },
];

// then register it:
const BY_ARCH: Record<string, MemRung[]> = {
  ...
  'My Arch Name': MY_ARCH,   // must match the arch field in GpuSpec
};
```

`bwNumGBps: null` for per-SM/CU levels (registers, shared memory) — these aren't comparable to per-chip bandwidths and are excluded from the bar chart.

Finally, **update the test** in `src/test/gpus.test.ts` to include the new GPU id in the card list.

---

## GPUs included

| GPU | Vendor | Architecture | Memory | FP16 (Tensor) |
|-----|--------|-------------|--------|--------------|
| H100 SXM | NVIDIA | Hopper | 80 GB HBM3 | 989 TFLOPS |
| RTX PRO 6000 | NVIDIA | Blackwell | 96 GB GDDR7 | 1,001 TFLOPS |
| RTX PRO 4500 | NVIDIA | Blackwell | 32 GB GDDR7 | 420 TFLOPS |
| L40 | NVIDIA | Ada Lovelace | 48 GB GDDR6 | 181 TFLOPS |
| L20 | NVIDIA | Ada Lovelace | 48 GB GDDR6 | 120 TFLOPS |
| MI300X | AMD | CDNA3 (8 XCDs) | 192 GB HBM3 | 1,307 TFLOPS |
| MI250 | AMD | CDNA2 (dual-die) | 128 GB HBM2e | 362 TFLOPS |
| MI210 | AMD | CDNA2 | 64 GB HBM2e | 181 TFLOPS |
| Radeon PRO W7900 | AMD | RDNA 3 | 48 GB GDDR6 | 123 TFLOPS* |
| Radeon PRO W7800 | AMD | RDNA 3 | 32 GB GDDR6 | 91 TFLOPS* |

\* RDNA 3 FP16 is shader-based (WMMA on SIMD ALUs), not a dedicated matrix engine. No 2:4 sparsity acceleration.

---

## Stack

- React 18 + TypeScript + Vite
- Zustand 5 (state management)
- Recharts (all 2D charts)
- Tailwind CSS v3
- Vitest + @testing-library/react
